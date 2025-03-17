import os
import io
import json
import pathlib
import logging
import re
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError

# mgz provides the parser for AoE2 .mgz files
from mgz import header, summary

# ------------------------------------------------------------------------------
# Configure the Flask app
# ------------------------------------------------------------------------------
app = Flask(__name__)

# Allow all origins for quick development; adjust for production if needed.
CORS(app, resources={r"/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO)

# ------------------------------------------------------------------------------
# Database Setup (PostgreSQL via SQLAlchemy)
# ------------------------------------------------------------------------------
# Example format: "postgresql://username:password@host:port/dbname"
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set. Please set your Postgres connection string.")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ------------------------------------------------------------------------------
# Define the GameStats model
# ------------------------------------------------------------------------------
class GameStats(db.Model):
    __tablename__ = "game_stats"  # ensure table name is consistent
    id = db.Column(db.Integer, primary_key=True)
    replay_file = db.Column(db.String(500), unique=True, nullable=False)
    game_version = db.Column(db.String(50))
    map = db.Column(db.Text)
    game_type = db.Column(db.String(50))
    duration = db.Column(db.Integer)
    winner = db.Column(db.String(100))
    players = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False)

# Ensure the table exists (for quick dev/demo). For production, consider migrations.
with app.app_context():
    try:
        db.create_all()
    except SQLAlchemyError as e:
        logging.error(f"Error creating tables: {e}")
        raise

# ------------------------------------------------------------------------------
# Global error handler to ensure CORS on errors
# ------------------------------------------------------------------------------
@app.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"❌ Uncaught Exception: {e}", exc_info=True)
    response = jsonify({"error": str(e)})
    response.status_code = 500
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# ------------------------------------------------------------------------------
# After-request hook to add CORS headers on all responses
# ------------------------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response

# ------------------------------------------------------------------------------
# Helper Function: Extract Timestamp from Filename
# ------------------------------------------------------------------------------
def extract_timestamp_from_filename(filename):
    """
    Extract a datetime from filenames like:
      "AUTOSAVE@2025.03.14 121250.aoe2record" => 2025-03-14 12:12:50
    """
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
# Replay Parsing Function
# ------------------------------------------------------------------------------
def parse_replay(replay_path: str):
    """
    Convert a .mgz (or .aoe2record) file to structured replay data.
    """
    if not os.path.exists(replay_path):
        logging.error(f"❌ Replay file not found: {replay_path}")
        return None

    # If the file is .aoe2record, rename it to .mgz for the mgz parser
    if replay_path.endswith(".aoe2record"):
        new_replay_path = replay_path.replace(".aoe2record", ".mgz")
        os.rename(replay_path, new_replay_path)
        replay_path = new_replay_path

    try:
        with open(replay_path, "rb") as f:
            # Parse header and summary information
            h = header.parse_stream(f)
            f.seek(0)
            match_summary = summary.Summary(f)

            duration_seconds = int(match_summary.get_duration() / 1000)
            game_type_str = str(match_summary.get_settings().get("type", "Unknown"))
            match_start_time = extract_timestamp_from_filename(os.path.basename(replay_path))

            stats = {
                "replay_file": replay_path,
                "game_version": str(h.version),
                "map": {
                    "name": match_summary.get_map().get("name", "Unknown"),
                    "size": match_summary.get_map().get("size", "Unknown")
                },
                "game_type": game_type_str,
                "duration": duration_seconds,
                "players": [],
                "winner": "Unknown",
                "timestamp": match_start_time
            }

            # Gather player data
            for p in match_summary.get_players():
                player_info = {
                    "name": p.get("name", "Unknown"),
                    "civilization": p.get("civilization", "Unknown"),
                    "winner": p.get("winner", False),
                    "military_score": p.get("military", {}).get("score", 0),
                    "economy_score": p.get("economy", {}).get("score", 0),
                    "technology_score": p.get("technology", {}).get("score", 0),
                    "society_score": p.get("society", {}).get("score", 0),
                    "units_killed": p.get("military", {}).get("units_killed", 0),
                    "fastest_castle_age": p.get("technology", {}).get("fastest_castle_age", 0),
                }
                stats["players"].append(player_info)
                if player_info["winner"]:
                    stats["winner"] = player_info["name"]

            logging.info(f"✅ Parsed replay data: {stats}")
            return stats

    except Exception as e:
        logging.error(f"❌ Error parsing replay: {e}", exc_info=True)
        return None

# ------------------------------------------------------------------------------
# POST /api/parse_replay
# ------------------------------------------------------------------------------
@app.route("/api/parse_replay", methods=["POST"])
def parse_new_replay():
    """
    Accepts a JSON payload: {"replay_file": "/path/to/file.aoe2record"}
    Parses the replay and inserts it into the database.
    """
    data = request.json or {}
    replay_path = data.get("replay_file")
    if not replay_path:
        return jsonify({"error": "Replay path missing"}), 400

    replay_path = str(pathlib.Path(replay_path).expanduser().resolve())

    # Check if replay is already in the database
    existing = GameStats.query.filter_by(replay_file=replay_path).first()
    if existing:
        logging.info(f"⚠️ Replay already in DB: {replay_path}")
        return jsonify({"message": "Replay already in database."}), 200

    parsed_data = parse_replay(replay_path)
    if not parsed_data:
        return jsonify({"error": "Failed to parse replay"}), 500

    # Insert new entry into the database
    new_game = GameStats(
        replay_file=parsed_data["replay_file"],
        game_version=parsed_data["game_version"],
        map=json.dumps(parsed_data["map"]),
        game_type=parsed_data["game_type"],
        duration=parsed_data["duration"],
        winner=parsed_data["winner"],
        players=json.dumps(parsed_data["players"]),
        timestamp=parsed_data["timestamp"],
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
    """
    Returns all game stats from the database, sorted by timestamp in descending order.
    """
    try:
        all_games = GameStats.query.order_by(GameStats.timestamp.desc()).all()
        results = []

        for game in all_games:
            # Convert stored JSON strings back to objects
            try:
                map_data = json.loads(game.map) if game.map else {}
            except json.JSONDecodeError:
                map_data = {}

            try:
                player_data = json.loads(game.players) if game.players else []
            except json.JSONDecodeError:
                player_data = []

            results.append({
                "id": game.id,
                "game_version": game.game_version,
                "map": map_data,
                "game_type": game.game_type,
                "duration": game.duration,
                "winner": game.winner,
                "players": player_data,
                "timestamp": str(game.timestamp)
            })

        return jsonify(results)

    except SQLAlchemyError as e:
        logging.error(f"❌ Error fetching from DB: {e}")
        return jsonify({"error": "Database Fetch Error"}), 500

# ------------------------------------------------------------------------------
# Additional Routes
# ------------------------------------------------------------------------------
@app.route("/healthcheck", methods=["GET"])
def healthcheck():
    """
    Quick health route for Render.
    """
    return jsonify({"status": "healthy", "message": "API is up and running!"}), 200

@app.route("/dbtest", methods=["GET"])
def dbtest():
    """
    Test the database connection by executing a simple query.
    """
    try:
        test = db.session.execute("SELECT 1 as test_col").fetchone()
        return jsonify({"status": "success", "db_test_result": test.test_col if test else None}), 200
    except SQLAlchemyError as e:
        logging.error(f"DB test failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "AoE2 Parsing API (Postgres) is running!"})

# ------------------------------------------------------------------------------
# Run the Flask app
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
