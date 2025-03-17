import { NextApiRequest, NextApiResponse } from "next";

// Define a type-safe structure for the bets object
interface Bet {
    amount: number;
    player: string;
    accepted?: boolean;
}

// Store bets in-memory (use a database in production)
const bets: Record<string, Bet> = {}; 

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Ensure match_id is always a string
    const matchId = Array.isArray(req.query.match_id) ? req.query.match_id[0] : req.query.match_id;

    if (!matchId || !bets[matchId]) {
        return res.status(404).json({ error: "Bet not found." });
    }

    bets[matchId].accepted = true;
    return res.status(200).json({ message: "Bet accepted!", bet: bets[matchId] });
}
