import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

// Use the correct API base URL
const API_URL = "https://aoe2de-betting-api.onrender.com/api/game_stats";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for some hosted PostgreSQL services
  },
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
    // 🔹 Fetch game stats from the correct API
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const apiData = await response.json();

    // 🔹 Transform data for frontend
    const games = apiData.map((game: any) => ({
      id: game.id,
      replay_file: game.replay_file,
      game_version: game.game_version,
      map_name: game.map?.name || "Unknown",
      game_type: game.game_type,
      game_duration: `${Math.floor(game.duration / 60)} minutes ${game.duration % 60} seconds`,
      winner: game.winner || "Unknown",
      players: game.players || [],
      timestamp: new Date(game.timestamp).toISOString(),
    }));

    // 🔹 Send processed data to the frontend
    res.status(200).json({ games });
  } catch (error) {
    console.error("❌ Error fetching game stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
