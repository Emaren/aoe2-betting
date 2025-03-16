import { NextApiRequest, NextApiResponse } from "next";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = await open({
            filename: "game_stats.db",
            driver: sqlite3.Database
        });

        const rows = await db.all(
            "SELECT id, replay_file, game_version, map, game_type, duration, winner, players, timestamp FROM game_stats ORDER BY timestamp DESC LIMIT 10"
        );

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
