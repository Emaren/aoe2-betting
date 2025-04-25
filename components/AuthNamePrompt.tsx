"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  playerName: string;
  setPlayerName: (name: string) => void;
  savePlayerName: () => void;
  loading: boolean;
}

export default function AuthNamePrompt({ playerName, setPlayerName, savePlayerName }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <Card className="bg-gray-800 shadow-xl w-full max-w-md">
        <CardContent className="p-8 flex flex-col space-y-6">
          <h1 className="text-xl font-bold text-center">Welcome to AoE2HD Betting App</h1>
          <p className="text-gray-300 text-center">Enter your in-game name to start betting:</p>
          <Input
            className="text-black px-4 py-3 text-lg rounded-md"
            placeholder="Your Steam/In-Game Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <Button
            onClick={savePlayerName}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
