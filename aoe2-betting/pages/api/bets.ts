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
    if (req.method === "POST") {
        const { match_id, player_1, player_2, amount } = req.body;

        if (!match_id || !player_1 || !player_2 || !amount) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        if (bets[match_id]) {
            return res.status(400).json({ error: "Bet already exists." });
        }

        bets[match_id] = {
            match_id,
            player_1,
            player_2,
            amount,
            accepted: false,
            winner: null,
        };

        return res.status(201).json({ message: "Bet created!", bet_id: match_id });
    }

    if (req.method === "GET") {
        return res.status(200).json(Object.values(bets).filter((bet) => !bet.accepted));
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
