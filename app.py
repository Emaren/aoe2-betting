import os
import io
import json
import logging
import re
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError
from flask_migrate import Migrate
from mgz import header, summary
import hashlib

# ------------------------------------------------------------------------------
# Configure the Flask app
# ------------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")

# ------------------------------------------------------------------------------
# Database Setup
# ------------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////System/Volumes/Data/Users/tonyblum/projects/aoe2de-parsing/aoc-mgz/instance/game_stats.db")
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ------------------------------------------------------------------------------
# Define the GameStats model
# ------------------------------------------------------------------------------
class GameStats(db.Model):
    __tablename__ = "game_stats"
    id = db.Column(db.Integer, primary_key=True)
    replay_file = db.Column(db.String(500), unique=True, nullable=False)
    game_version = db.Column(db.String(50))
    map_name = db.Column(db.Text)
    map_size = db.Column(db.Text)
    game_type = db.Column(db.String(50))
    duration = db.Column(db.Integer)
    winner = db.Column(db.String(100))
    players = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    hash = db.Column(db.String(64), unique=True, nullable=False)

# Create tables if they do not exist
with app.app_context():
    try:
        db.create_all()
    except SQLAlchemyError as e:
        logging.error(f"Error creating tables: {e}")

# ------------------------------------------------------------------------------
# Helper: Extract Timestamp from Filename
# ------------------------------------------------------------------------------
def extract_timestamp_from_filename(filename):
    match = re.search(r"@(\d{4}\.\d{2}\.\d{2}) (\d{6})", filename)
    if match:
        date_part, time_part = match.groups()
        formatted_date = date_part.replace(".", "-")
        formatted_time = f"{time_part[:2]}:{time_part[2:4]}:{time_part[4:]}"
        try:
            return datetime.strptime(f"{formatted_date} {formatted_time}", "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return datetime.utcnow()
    return datetime.utcnow()

# ------------------------------------------------------------------------------
# Compute SHA-256 Hash for Deduplication (Binary Method)
# ------------------------------------------------------------------------------
def compute_replay_hash(replay_path):
    """Generate a stable SHA-256 hash for a replay file using its binary content."""
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

# ------------------------------------------------------------------------------
# Replay Parsing Function
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# POST /api/parse_replay
# ------------------------------------------------------------------------------
@app.route("/api/parse_replay", methods=["POST"])
def parse_new_replay():
    data = request.json or {}
    replay_path = data.get("replay_file")
    replay_hash = data.get("hash")  # Expecting hash from the client

    logging.info(f"🔎 Received API Request: {json.dumps(data, indent=4)}")

    if not replay_path:
        return jsonify({"error": "Replay path missing"}), 400

    if not replay_hash:
        logging.error(f"❌ No hash provided in request: {json.dumps(data, indent=4)}")
        return jsonify({"error": "Failed to compute replay hash"}), 500

    existing = GameStats.query.filter_by(hash=replay_hash).first()
    if existing:
        logging.info(f"⚠️ Replay already in DB: {replay_path}")
        return jsonify({"message": "Replay already in database."}), 200

    logging.info(f"✅ Hash received and valid: {replay_hash}")

    parsed_data = parse_replay(replay_path)
    if not parsed_data:
        return jsonify({"error": "Failed to parse replay"}), 500

    # Ensure the parsed data includes the hash from the request
    if "hash" not in parsed_data or parsed_data["hash"] is None:
        logging.error("❌ Hash missing from parsed replay data!")
        return jsonify({"error": "Failed to compute replay hash"}), 500

    new_game = GameStats(
        replay_file=parsed_data["replay_file"],
        game_version=parsed_data["game_version"],
        map_name=parsed_data["map_name"],
        map_size=parsed_data.get("map_size", "Unknown"),
        game_type=parsed_data["game_type"],
        duration=parsed_data["duration"],
        winner=parsed_data["winner"],
        players=json.dumps(parsed_data["players"]),
        timestamp=parsed_data["timestamp"],
        hash=parsed_data["hash"]
    )

    try:
        db.session.add(new_game)
        db.session.commit()
    except SQLAlchemyError as e:
        logging.error(f"❌ DB Insert Error: {e}")
        db.session.rollback()
        return jsonify({"error": "Database Insert Error"}), 500

    return jsonify({"message": "Replay parsed and stored successfully!"}), 200

# ------------------------------------------------------------------------------
# GET /api/game_stats
# ------------------------------------------------------------------------------
@app.route("/api/game_stats", methods=["GET"])
def get_game_stats():
    try:
        all_games = GameStats.query.order_by(GameStats.timestamp.desc()).all()
        results = []
        for game in all_games:
            try:
                player_data = json.loads(game.players) if game.players else []
            except json.JSONDecodeError:
                player_data = []
            results.append({
                "id": game.id,
                "game_version": game.game_version,
                "map_name": game.map_name,
                "map_size": game.map_size,
                "game_type": game.game_type,
                "duration": game.duration,
                "winner": game.winner,
                "players": player_data,
                "timestamp": str(game.timestamp),
                "hash": game.hash,
            })
        return jsonify({"games": results})
    except SQLAlchemyError as e:
        logging.error(f"❌ Error fetching from DB: {e}")
        return jsonify({"error": "Database Fetch Error"}), 500

# ------------------------------------------------------------------------------
# Additional Routes
# ------------------------------------------------------------------------------
@app.route("/api/check_replay", methods=["GET"])
def check_replay():
    replay_hash = request.args.get("hash")
    if not replay_hash:
        return jsonify({"error": "Missing hash parameter"}), 400

    exists = GameStats.query.filter_by(hash=replay_hash).first()
    return jsonify({"exists": exists is not None})

@app.route("/healthcheck", methods=["GET"])
def healthcheck():
    return jsonify({"status": "healthy", "message": "API is up and running!"}), 200

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "AoE2 Parsing API is running!"})

# ------------------------------------------------------------------------------
# Run the Flask app
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
