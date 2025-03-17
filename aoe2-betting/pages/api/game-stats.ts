import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg"; // PostgreSQL Connection Pool

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// CORS Middleware
const allowCors = (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins (Change "*" to restrict access if needed)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS middleware
  if (allowCors(req, res)) return;

  try {
    const client = await pool.connect(); // Reuse a single pool connection
    const result = await client.query(`
      SELECT id, replay_file, game_version, map, game_type, duration, winner, players, timestamp
      FROM game_stats
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    client.release(); // Release connection back to the pool

    const games = result.rows.map((row) => ({
      id: row.id,
      replay_file: row.replay_file,
      game_version: row.game_version,
      map_name: row.map,
      game_type: row.game_type,
      game_duration: `${Math.floor(row.duration / 60)} minutes ${row.duration % 60} seconds`,
      winner: row.winner,
      players: row.players ? JSON.parse(row.players) : [], // Ensure valid JSON parsing
      timestamp: row.timestamp,
    }));

    res.status(200).json({ games });
  } catch (error) {
    const err = error as Error; // Explicitly cast `error` as an Error
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
