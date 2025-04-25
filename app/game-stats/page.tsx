"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSkeleton, cleanGameType, formatDuration, sanitizeDuration } from "./loading-skeleton";
import GameStatsHeader from "./GameStatsHeader";

// --- Interfaces ---
interface PlayerStats {
  name: string;
  civilization: number;
  civilization_name: string;
  winner: boolean;
  military_score: number;
  economy_score: number;
  technology_score: number;
  society_score: number;
  units_killed: number;
  buildings_destroyed: number;
  resources_gathered: number;
  fastest_castle_age: number;
  fastest_imperial_age: number;
  relics_collected: number;
}

interface GameStats {
  id: number;
  game_version: string;
  map: any;
  game_type: string;
  duration: number;
  game_duration?: number;
  players: PlayerStats[];
  timestamp: string;
  replay_hash: string;
}

// --- Constants ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8002";

const GameStatsPage = () => {
  const storedName = typeof window !== "undefined" ? localStorage.getItem("playerName")?.toLowerCase() || "" : "";
  const [playerName, setPlayerName] = useState(storedName);
  const [filterMode, setFilterMode] = useState<"all" | "mine">(storedName ? "mine" : "all");
  const [games, setGames] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);

  const latestHashRef = useRef<string | null>(null);
  const focusRef = useRef(true);

  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/game_stats?ts=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!Array.isArray(data)) {
          console.warn("⚠️ Invalid API response format.");
          setLoading(false);
          return;
        }

        const formattedGames = data.map((game: GameStats) => {
          let safePlayers: PlayerStats[] = [];
          let safeMap: any = game.map;

          if (typeof game.players === "string") {
            try { safePlayers = JSON.parse(game.players); } catch { safePlayers = []; }
          } else if (Array.isArray(game.players)) {
            safePlayers = game.players;
          }

          if (typeof safeMap === "string") {
            try { safeMap = JSON.parse(safeMap); } catch { safeMap = {}; }
          }

          return { ...game, players: safePlayers, map: safeMap };
        });

        const dedupedGames = Array.from(
          formattedGames.reduce((map, game) => {
            const existing = map.get(game.replay_hash);
            if (!existing || new Date(game.timestamp) > new Date(existing.timestamp)) {
              map.set(game.replay_hash, game);
            }
            return map;
          }, new Map<string, GameStats>()).values()
        );

        const validGames = dedupedGames.filter((g) => g.players.length > 0);
        validGames.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (validGames.length === 0) {
          console.warn("⚠️ No valid games found.");
          setLoading(false);
          return;
        }

        const newestHash = validGames[0].replay_hash;
        if (newestHash !== latestHashRef.current) {
          latestHashRef.current = newestHash;
          setGames(validGames);
          console.log("🔁 Game list updated. Latest replay_hash:", newestHash);
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch game stats:", err);
        setLoading(false);
      }
    };

    let interval: NodeJS.Timeout;
    const startPolling = () => {
      clearInterval(interval);
      interval = setInterval(fetchGameStats, focusRef.current ? 1000 : 5000);
    };

    fetchGameStats();
    startPolling();

    window.addEventListener("focus", () => { focusRef.current = true; startPolling(); });
    window.addEventListener("blur", () => { focusRef.current = false; startPolling(); });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", () => {});
      window.removeEventListener("blur", () => {});
    };
  }, []);

  const filteredGames = games.filter((game) => {
    if (filterMode === "all") return true;
    return game.players.some((p) => p.name.toLowerCase() === playerName);
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <GameStatsHeader filterMode={filterMode} setFilterMode={setFilterMode} />

      <h2 className="text-3xl font-bold text-center mb-6 text-gray-400">
        {filterMode === "mine" ? "My Matches" : "All Matches"}
      </h2>

      {loading ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingSkeleton />
          </motion.div>
        </AnimatePresence>
      ) : filteredGames.length === 0 ? (
        <p className="text-center text-gray-400">No game stats available.</p>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredGames.map((game, index) => {
              const isLatest = index === 0;
              const cleanedDuration = sanitizeDuration(game.duration || game.game_duration || 0);

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: index * 0.1, // 👈 ADD THIS small delay per card
                  }}
                  className={`p-6 rounded-xl shadow-lg ${
                    isLatest
                      ? "bg-gray-900 text-yellow-400 border-2 border-yellow-500"
                      : "bg-gray-700 text-black border border-gray-600"
                  }`}
                >
                  <h3 className="text-2xl font-semibold">
                    {isLatest ? "🔥 Latest Match" : `Match #${filteredGames.length - index}`}
                  </h3>
                  <p><strong>Map:</strong> {typeof game.map === "object" ? game.map?.name : game.map}</p>
                  <p><strong>Type:</strong> {cleanGameType(game.game_type)}</p>
                  <p><strong>Duration:</strong> {cleanedDuration === 0 ? "⚠️ Invalid" : formatDuration(cleanedDuration)}</p>
                  <h4 className="mt-4 text-xl font-semibold">Players</h4>
                  {game.players.map((player, idx) => (
                    <div key={idx} className="bg-gray-500 mt-2 p-3 rounded-lg">
                      <strong className={player.name.toLowerCase() === playerName ? "text-blue-400" : ""}>
                        {player.name}
                      </strong> {player.winner ? "🏆" : "❌"}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GameStatsPage;
