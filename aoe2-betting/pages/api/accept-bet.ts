import { NextApiRequest, NextApiResponse } from "next";

let bets = {};  // This should be stored in a DB in production

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { match_id } = req.query;

    if (!match_id || !bets[match_id]) {
        return res.status(404).json({ error: "Bet not found." });
    }

    bets[match_id].accepted = true;
    return res.status(200).json({ message: "Bet accepted!", bet: bets[match_id] });
}
