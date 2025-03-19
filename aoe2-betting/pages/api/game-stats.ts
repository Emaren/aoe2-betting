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

    const result = await client.query(`
      SELECT id, replay_file, game_version, map_name, map_size, game_type, duration, winner, players, timestamp
      FROM game_stats
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    client.release();

    const games = result.rows.map((game) => {
      let playersParsed;
      try {
        playersParsed = JSON.parse(game.players);
      } catch (err) {
        playersParsed = [];
      }

      return {
        id: game.id,
        replay_file: game.replay_file,
        game_version: game.game_version,
        map: {
          name: game.map_name || "Unknown",
          size: game.map_size || "Unknown",
        },
        game_type: game.game_type,
        duration: game.duration,
        winner: game.winner,
        players: playersParsed,
        timestamp: new Date(game.timestamp).toISOString(),
      };
    });

    res.status(200).json({ games });
  } catch (error) {
    console.error("❌ Error fetching game stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

