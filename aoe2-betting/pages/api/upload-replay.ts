import { NextApiRequest, NextApiResponse } from "next";

// Define the structure for a bet
interface Bet {
    match_id: string;
    player_1: string;
    player_2: string;
    amount: number;
    accepted: boolean;
    winner: string | null;
}

// Store bets in memory (should be replaced with a DB in production)
const bets: Record<string, Bet> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const matchId = Array.isArray(req.query.match_id) ? req.query.match_id[0] : req.query.match_id;

    if (!matchId || !bets[matchId]) {
        return res.status(404).json({ error: "Bet not found." });
    }

    const { winner } = req.body;
    bets[matchId].winner = winner;

    return res.status(200).json({ message: "Replay uploaded!", bet: bets[matchId] });
}
