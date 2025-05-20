// pages/api/chain-id.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const backendRes = await fetch("http://127.0.0.1:8002/api/chain-id");
    const json = await backendRes.json();
    res.status(200).json(json);
  } catch (error) {
    console.error("❌ Failed to fetch chain-id from FastAPI:", error);
    res.status(500).json({ error: "Failed to fetch chain-id" });
  }
}
