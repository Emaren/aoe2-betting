import os
import io
import json
import logging
import requests
import hashlib
import shutil
import sqlite3
from mgz import header, summary

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

FLASK_API_URL = "http://localhost:8000/api/parse_replay"
CHECK_API_URL = "http://localhost:8000/api/check_replay"

SAVEGAME_DIR = "/Users/tonyblum/Library/Application Support/CrossOver/Bottles/Steam/drive_c/users/crossover/Games/Age of Empires 2 DE/76561198065420384/savegame"
print("🔍 Checking directory contents:")
for file in os.listdir(SAVEGAME_DIR):
    print(f"📂 Found: {file}")
ARCHIVE_DIR = "/Users/tonyblum/Library/Application Support/CrossOver/Bottles/Steam/drive_c/users/crossover/Games/Age of Empires 2 DE/76561198065420384/archive"
DB_PATH = "/System/Volumes/Data/Users/tonyblum/projects/aoe2de-parsing/aoc-mgz/instance/game_stats.db"

os.makedirs(ARCHIVE_DIR, exist_ok=True)

def format_duration(seconds):
    """Converts duration into a user-friendly format."""
    minutes = seconds // 60
    hours = minutes // 60
    minutes %= 60
    secs = seconds % 60
    return f"{hours} hours {minutes} minutes {secs} seconds" if hours else f"{minutes} minutes {secs} seconds"

def compute_replay_hash(replay_path):
    """Generate a unique SHA-256 hash for a replay file to detect duplicates."""
    hasher = hashlib.sha256()
    try:
        with open(replay_path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        logging.error(f"❌ Error computing hash: {e}")
        return None


def clean_database():
    """Cleans the game_stats table by removing empty and duplicate records."""
    try:
        if not os.path.exists(DB_PATH):
            logging.warning(f"⚠️ Database file does not exist: {DB_PATH}")
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Delete rows with no duration (empty records)
        cursor.execute("DELETE FROM game_stats WHERE duration IS NULL OR duration = 0")
        logging.info("✅ Removed empty records from game_stats.")

        # Remove duplicate records: keep the row with the smallest id for each unique hash.
        cursor.execute("""
            DELETE FROM game_stats
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM game_stats
                GROUP BY hash
            )
        """)
        logging.info("✅ Removed duplicate records from game_stats.")

        conn.commit()
        conn.close()
    except sqlite3.OperationalError as e:
        logging.error(f"❌ Database connection issue: {e}")
    except Exception as e:
        logging.error(f"❌ Failed to clean database: {e}")

def parse_replay(replay_path: str):
    logging.info(f"🔍 Attempting to parse: {replay_path}")

    if not os.path.exists(replay_path):
        logging.error(f"❌ Replay file not found: {replay_path}")
        return None

    try:
        with open(replay_path, "rb") as f:
            h = header.parse_stream(f)
            f.seek(0)
            match_summary = summary.Summary(f)

            duration_seconds = int(match_summary.get_duration() / 1000)
            logging.info(f"✅ Replay duration: {duration_seconds}s")

            # Convert game_type to string to ensure it's a supported type
            game_type_raw = match_summary.get_settings().get("type", "Unknown")
            game_type = str(game_type_raw)

            stats = {
                "replay_file": os.path.basename(replay_path),
                "game_version": str(h.version),
                "map_name": match_summary.get_map().get("name", "Unknown"),
                "map_size": match_summary.get_map().get("size", "Unknown"),
                "game_type": game_type,
                "duration": duration_seconds,
                "players": [],
                "winner": "Unknown",
                "timestamp": extract_timestamp_from_filename(replay_path),
                "hash": compute_replay_hash(replay_path),
            }

            logging.info(f"🔍 Parsed Replay Data: {stats}")

            for p in match_summary.get_players():
                player_info = {
                    "name": p.get("name", "Unknown"),
                    "winner": p.get("winner", False),
                }
                stats["players"].append(player_info)
                if player_info["winner"]:
                    stats["winner"] = player_info["name"]

            return stats

    except Exception as e:
        logging.error(f"❌ Replay parse failed: {e}", exc_info=True)
        return None


    return stats

def send_to_api(parsed_data):
    """Check replay hash in the database and send parsed data to API if new."""
    clean_database()

    if "hash" not in parsed_data:
        logging.error("❌ Replay hash missing, cannot check for duplicates.")
        return
    
    logging.info(f"📝 Replay Hash Before Sending: {parsed_data['hash']}")  # ✅ Debugging Print

    check_url = f"{CHECK_API_URL}?hash={parsed_data['hash']}"

    try:
        check_response = requests.get(check_url)
        if check_response.status_code == 200 and check_response.json().get("exists"):
            logging.info(f"🔄 Replay already exists in database, skipping: {parsed_data['replay_file']}")
            return
    except Exception as e:
        logging.error(f"⚠️ Failed to check replay existence: {e}")

    try:
        response = requests.post(FLASK_API_URL, json=parsed_data)
        logging.info(f"📨 Sending data to API: {json.dumps(parsed_data, indent=4)}")  # ✅ Debugging Print
        if response.status_code == 200:
            logging.info(f"✅ Successfully sent replay to API: {parsed_data['replay_file']}")
        else:
            logging.error(f"❌ API Error: {response.status_code} - {response.text}")
    except Exception as e:
        logging.error(f"❌ Failed to send replay to API: {e}")


def reparse_json_replays():
    """Reprocess existing JSON replay files and update the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for filename in os.listdir(SAVEGAME_DIR):
        if filename.endswith(".json"):
            json_path = os.path.join(SAVEGAME_DIR, filename)
            logging.info(f"🔄 Reprocessing JSON replay: {json_path}")

            try:
                with open(json_path, "r") as f:
                    replay_data = json.load(f)

                replay_data["hash"] = compute_replay_hash(json_path)
                send_to_api(replay_data)
            except Exception as e:
                logging.error(f"❌ Error processing {filename}: {e}")

    conn.close()

if __name__ == "__main__":
    for replay_file in os.listdir(SAVEGAME_DIR):
        replay_path = os.path.join(SAVEGAME_DIR, replay_file)

        if replay_file.endswith(".json"):
            reparse_json_replays()
            continue

        if os.path.getsize(replay_path) < 5000:
            logging.warning(f"⚠️ Skipping likely incomplete replay: {replay_path}")
            continue

        parsed_data = parse_replay(replay_path)
        if parsed_data:
            send_to_api(parsed_data)
            shutil.move(replay_path, os.path.join(ARCHIVE_DIR, replay_file))
