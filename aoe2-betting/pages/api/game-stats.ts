import { NextApiRequest, NextApiResponse } from "next";
import Database from "better-sqlite3";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = new Database("game_stats.db", { verbose: console.log });

        const rows = db.prepare(
            "SELECT id, replay_file, game_version, map, game_type, duration, winner, players, timestamp FROM game_stats ORDER BY timestamp DESC LIMIT 10"
        ).all();

        const games = rows.map(row => ({
            id: row.id,
            replay_file: row.replay_file,
            game_version: row.game_version,
            map_name: row.map,
            game_type: row.game_type,
            game_duration: `${Math.floor(row.duration / 60)} minutes ${row.duration % 60} seconds`,
            winner: row.winner,
            players: JSON.parse(row.players || "[]"),
            timestamp: row.timestamp
        }));

        res.status(200).json({ games });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
