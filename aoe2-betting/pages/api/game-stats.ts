import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

// Ensure you use the correct PostgreSQL URL from your environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Fixes SSL issues on hosted services like Vercel
});

// CORS Middleware
const allowCors = (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
};

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (allowCors(req, res)) return;

  try {
    const client = await pool.connect();

    // Fetch the latest 10 game stats
    const result = await client.query(`
      SELECT id, replay_file, game_version, map, game_type, duration, winner, players, timestamp
      FROM game_stats
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    client.release();

    // Transform data for the frontend
    const games = result.rows.map((game) => ({
      id: game.id,
      replay_file: game.replay_file,
      game_version: game.game_version,
      map_name: game.map || "Unknown",
      game_type: game.game_type,
      game_duration: `${Math.floor(game.duration / 60)} minutes ${game.duration % 60} seconds`,
      winner: game.winner || "Unknown",
      players: game.players ? JSON.parse(game.players) : [],
      timestamp: new Date(game.timestamp).toISOString(),
    }));

    res.status(200).json({ games });
  } catch (error) {
    console.error("❌ Error fetching game stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
