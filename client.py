import json
import logging
import requests
from parse_replay import parse_replay
from config import load_config

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Load configuration from config.json
config = load_config()

# Set the API base URL (for production, this might be your deployed endpoint)
# For example: "https://aoe2de-betting-api.onrender.com"
API_BASE_URL = config.get("api_endpoint", "http://127.0.0.1:8002")

# Define endpoints without duplicating paths
API_REPLAY_ENDPOINT = f"{API_BASE_URL}/api/replays"
API_GAME_STATS_ENDPOINT = f"{API_BASE_URL}/api/game_stats"

def send_stats_to_backend(stats):
    """
    Send the parsed replay stats to the backend.
    """
    headers = {"Content-Type": "application/json"}
    try:
        logging.info(f"📤 Sending stats to backend: {API_REPLAY_ENDPOINT}")
        response = requests.post(API_REPLAY_ENDPOINT, json=stats, headers=headers, timeout=10)
        response.raise_for_status()
        logging.info("✅ Successfully sent stats to backend.")
        return True
    except requests.RequestException as e:
        logging.error(f"❌ Error sending stats: {e}")
        return False

def fetch_game_stats():
    """
    Fetches the latest game stats from the backend.
    Handles responses that are either a raw array or an object with a "games" key.
    """
    try:
        logging.info(f"📥 Fetching game stats from: {API_GAME_STATS_ENDPOINT}")
        response = requests.get(API_GAME_STATS_ENDPOINT, timeout=10)
        response.raise_for_status()
        data = response.json()
        logging.info("🔍 RAW API Response: %s", data)

        # Determine if the response is an array or an object with a "games" key.
        let game_stats = []
        if isinstance(data, list):
            game_stats = data
        elif isinstance(data, dict) and "games" in data:
            game_stats = data["games"]
        else:
            logging.warning("⚠️ No game stats array found in API response.")
            return []

        logging.info(f"✅ Fetched {len(game_stats)} game stats entries.")
        return game_stats
    except requests.RequestException as e:
        logging.error(f"❌ Error fetching game stats: {e}")
        return []

def process_replay(replay_path):
    """
    Process a replay file: parse it and send its data to the backend.
    """
    logging.info(f"🔍 Processing replay: {replay_path}")
    stats = parse_replay(replay_path)
    if stats is None:
        logging.error("❌ Parsing failed, skipping backend submission.")
        return False
    return send_stats_to_backend(stats)

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        replay_file = sys.argv[1]
        process_replay(replay_file)
    else:
        logging.info("⚠️ No replay file provided for testing.")
        logging.info("Fetching latest game stats instead...")
        game_stats = fetch_game_stats()
        logging.info(json.dumps(game_stats, indent=2))
