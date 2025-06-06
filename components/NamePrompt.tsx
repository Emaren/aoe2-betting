// components/NamePrompt.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserAuth } from "@/context/UserAuthContext";

export default function NamePrompt() {
  const { playerName, setPlayerName, loading } = useUserAuth();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && playerName.trim()) {
      // optionally set login status or route here
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <Card className="bg-gray-800 shadow-xl w-full max-w-md">
        <CardContent className="p-8 flex flex-col space-y-6">
          <h1 className="text-xl font-bold text-center text-white">
            Welcome to the AoE2HD Betting App
          </h1>
          <p className="text-gray-300 text-center">
            Enter your in-game name to start betting:
          </p>
          <Input
            className="text-black px-4 py-3 text-lg rounded-md"
            placeholder="Your Steam/In-Game Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            onClick={() => {}} // 🔥 no-op or route logic here later
            disabled={!playerName.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
