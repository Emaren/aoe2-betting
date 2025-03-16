import { NextApiRequest, NextApiResponse } from "next";

let bets = {};  // In production, this would be stored in a DB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { match_id } = req.query;
    const { winner } = req.body;

    if (!match_id || !bets[match_id]) {
        return res.status(404).json({ error: "Bet not found." });
    }

    if (bets[match_id].winner) {
        return res.status(400).json({ error: "Bet already settled." });
    }

    bets[match_id].winner = winner;
    return res.status(200).json({ message: `Bet settled! ${winner} won the bet.` });
}
