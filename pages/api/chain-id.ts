// pages/api/chain-id.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // ← this line will be replaced
    const backendRes = await fetch(`${process.env.FASTAPI_API_URL}/api/chain-id`);
    const json = await backendRes.json();
    res.status(200).json(json);
  } catch (error) {
    console.error("❌ Failed to fetch chain-id from FastAPI:", error);
    res.status(500).json({ error: "Failed to fetch chain-id" });
  }
}
