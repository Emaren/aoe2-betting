"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginOrRegister } from "@/lib/auth";
import AuthNamePrompt from "@/components/AuthNamePrompt";
import AuthPasswordPrompt from "@/components/AuthPasswordPrompt";
import BetChallengeCard from "@/components/BetChallengeCard";
import HeaderMenu from "@/components/HeaderMenu";
import type { Bet } from "@/lib/types";

export default function MainPage() {
  const router = useRouter();
  const [betPending, setBetPending] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [challenger, setChallenger] = useState("");
  const [opponent, setOpponent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingBets, setPendingBets] = useState<Bet[]>([]);
  const [betStatus, setBetStatus] = useState("");
  const [showButtons, setShowButtons] = useState(true);

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const uid = localStorage.getItem("uid");
    if (!uid) {
      console.warn("⚠️ No UID found in localStorage.");
      setShowNamePrompt(true);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8002"}/api/user/me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(async (res) => {
        if (res.status === 404) setShowNamePrompt(true);
        else if (!res.ok) console.error("Failed user lookup:", res.status);
      })
      .catch((err) => console.error("❌ Network error:", err));

    setPendingBets(JSON.parse(localStorage.getItem("pendingBets") || "[]"));

    setTimeout(() => {
      setBetPending(true);
      setBetAmount(3);
      setChallenger("RedLineKey");
    }, 3000);
  }, []);

  const savePlayerName = async () => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      alert("Please enter a valid name.");
      return;
    }

    setShowNamePrompt(false);
    setShowPasswordPrompt(true);
  };

  const savePasswordAndRegister = async () => {
    try {
      await loginOrRegister(playerName, password);
      setShowPasswordPrompt(false);
    } catch (e) {
      alert("Authentication failed.");
    }
  };

  const handleAccept = () => {
    setBetStatus("Accepted!");
    setShowButtons(false);
    setTimeout(() => setBetStatus("Waiting For Battle To Start"), 5000);
    setTimeout(() => setBetStatus("Battle Underway!"), 10000);
    setTimeout(() => setBetStatus("Battle Finished! Processing Win."), 20000);
  };

  const handleDecline = () => {
    const newBet = { challenger, betAmount };
    const updatedBets = [...pendingBets, newBet];
    localStorage.setItem("pendingBets", JSON.stringify(updatedBets));
    setPendingBets(updatedBets);
    setShowButtons(false);
    setTimeout(() => {
      setBetPending(false);
      setShowButtons(true);
    }, 2000);
  };

  if (showNamePrompt) {
    return <AuthNamePrompt playerName={playerName} setPlayerName={setPlayerName} savePlayerName={savePlayerName} />;
  }

  if (showPasswordPrompt) {
    return <AuthPasswordPrompt password={password} setPassword={setPassword} savePasswordAndRegister={savePasswordAndRegister} />;
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-gray-900 text-white">
      <HeaderMenu menuOpen={menuOpen} toggleMenu={() => setMenuOpen(!menuOpen)} pendingBetsCount={pendingBets.length} />

      <button className="fixed bottom-6 right-6 bg-gray-700 hover:bg-gray-600 p-4 rounded-full shadow-md">
        <Wallet className="w-7 h-7" />
      </button>

      <div className="flex flex-col flex-1 items-center justify-center px-6 w-full max-w-2xl mx-auto space-y-14">
        <motion.div
          animate={{ opacity: betPending ? 1 : 0.8, scale: betPending ? 1.1 : 1 }}
          transition={{ duration: 0.5, repeat: betPending ? Infinity : 0, repeatType: "reverse" }}
          className="relative flex items-center justify-center w-64 h-64 bg-blue-700 rounded-full shadow-2xl text-5xl font-bold"
        >
          AoE2
          {betPending && <div className="absolute bottom-5 bg-red-500 text-white text-lg px-6 py-3 rounded-full shadow-md">${betAmount} Bet Pending</div>}
        </motion.div>

        <BetChallengeCard betPending={betPending} challenger={challenger} opponent={opponent} setOpponent={setOpponent} />

        {betStatus && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-2xl font-bold bg-gray-800 px-6 py-3 rounded-lg shadow-md">{betStatus}</motion.div>}

        <AnimatePresence>
          {betPending && showButtons && (
            <motion.div className="w-full flex gap-4 px-6 mt-6">
              <button className="bg-green-600 px-6 py-3 flex-grow" onClick={handleAccept}>Accept</button>
              <button className="bg-red-600 px-6 py-3 flex-grow" onClick={handleDecline}>Decline</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
