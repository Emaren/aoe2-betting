import re
import requests
import os
import platform
import time
import logging
import json
import threading
import hashlib
from queue import Queue
from watchdog.observers.polling import PollingObserver
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from config import load_config

# ---------------------------------------------------------------------------------------
# LOAD CONFIG & SETUP
# ---------------------------------------------------------------------------------------
config = load_config()
config_dirs = config.get("replay_directories", None)
use_polling = config.get("use_polling", True)
polling_interval = config.get("polling_interval", 1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PROCESSED_REPLAYS_FILE = "processed_replays.json"
processed_replays = {}

AOE2HD_REPLAY_DIR = (
    "/Users/tonyblum/Library/Application Support/CrossOver/Bottles/Steam/"
    "drive_c/Program Files (x86)/Steam/steamapps/common/Age2HD/SaveGame/multi"
)
AOE2DE_REPLAY_DIR = os.path.expanduser("~/Documents/My Games/Age of Empires 2 DE/SaveGame")

# ---------------------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------------------
def load_processed_replays():
    global processed_replays
    try:
        with open("processed_replays.json", "r") as f:
            processed_replays = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        processed_replays = {}

def save_processed_replays():
    with open("processed_replays.json", "w") as f:
        json.dump(processed_replays, f, indent=4)

def compute_replay_hash(file_path):
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

# Ensures the server parses replay details thoroughly
def parse_replay(file_path):
    if file_path in processed_replays:
        logging.info(f"⚠️ Replay already processed: {file_path}")
        return

    replay_hash = compute_replay_hash(file_path)
    if not replay_hash:
        logging.error(f"❌ Failed to compute replay hash for {file_path}")
        processed_replays[file_path] = {"status": "hash_error"}
        save_processed_replays()
        return

    api_url = "http://localhost:8000/api/parse_replay"
    payload = {"replay_file": file_path, "hash": replay_hash}

    try:
        response = requests.post(api_url, json=payload, timeout=120)
        response.raise_for_status()
        logging.info(f"✅ Successfully sent replay for parsing: {file_path}")
    except requests.RequestException as e:
        logging.error(f"❌ Error sending replay: {e}")

    processed_replays[file_path] = {"status": "processed"}
    save_processed_replays()

def wait_for_stable_file(file_path, stable_seconds=30, verification_seconds=20):
    last_size = -1
    stable_time = 0
    check_interval = 1

    while stable_time < stable_seconds:
        if not os.path.exists(file_path):
            logging.warning(f"⚠️ File disappeared: {file_path}")
            return

        current_size = os.path.getsize(file_path)
        if current_size == last_size:
            stable_time += check_interval
        else:
            stable_time = 0
            last_size = current_size
        time.sleep(check_interval)

    time.sleep(verification_seconds)
    if os.path.getsize(file_path) == last_size:
        parse_replay(file_path)
    else:
        logging.warning(f"⚠️ File size changed again: {file_path}")
        wait_for_stable_file(file_path)

# Queue setup
parse_queue = Queue()
def parse_worker():
    while True:
        file_path = parse_queue.get()
        if file_path is None:
            break
        wait_for_stable_file(file_path)
        parse_queue.task_done()

worker_thread = threading.Thread(target=parse_worker, daemon=True)
worker_thread.start()

# WATCHDOG EVENT HANDLER
class ReplayEventHandler(FileSystemEventHandler):
    FINAL_REPLAY_REGEX = re.compile(
        r"MP Replay v.* @\d{4}\.\d{2}\.\d{2} \d{6}(?: \(\d+\))?\.aoe2record$"
    )

    def on_created(self, event):
        if event.is_directory:
            return
        if self.FINAL_REPLAY_REGEX.match(os.path.basename(event.src_path)):
            logging.info(f"🆕 Final Replay Detected: {event.src_path}")
            parse_queue.put(event.src_path)

# MAIN WATCH FUNCTION
def watch_replay_directories(directories, use_polling=True, interval=1):
    load_processed_replays()
    observer = PollingObserver() if use_polling else Observer()

    for directory in directories:
        if os.path.exists(directory):
            observer.schedule(ReplayEventHandler(), directory, recursive=False)
            logging.info(f"👀 Watching: {directory}")

    observer.start()
    try:
        while True:
            time.sleep(interval)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == '__main__':
    dirs = config_dirs or [AOE2HD_REPLAY_DIR, AOE2DE_REPLAY_DIR]
    watch_replay_directories(directories=dirs, use_polling=use_polling, interval=polling_interval)
    parse_queue.put(None)
    worker_thread.join()
