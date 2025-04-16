"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const fetchUser = async () => {
    const uid = localStorage.getItem("uid");
    const fallbackEmail = localStorage.getItem("userEmail");

    try {
      const res = await fetch("/api/user/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email: fallbackEmail }),
      });

      if (res.status === 404) {
        console.log("No user found for UID or email (404)");
        return;
      }

      if (!res.ok) {
        console.error("Failed to fetch user:", res.status);
        return;
      }

      const data = await res.json();
      if (data.in_game_name) {
        setPlayerName(data.in_game_name);
        localStorage.setItem("playerName", data.in_game_name);
      }

      setIsVerified(!!data.verified);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    }
  };

  useEffect(() => {
    let uid = localStorage.getItem("uid");

    const registerAndFetch = async () => {
      if (!uid) {
        uid = `uid-${crypto.randomUUID()}`;
        localStorage.setItem("uid", uid);

        const email = localStorage.getItem("userEmail") || "";
        const in_game_name = localStorage.getItem("playerName") || "";

        try {
          await fetch("/api/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, email, in_game_name }),
          });
          console.log("🆕 User registered:", uid);
        } catch (err) {
          console.error("❌ Failed to register user:", err);
        }
      }

      await fetchUser();
    };

    registerAndFetch();

    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
  };

  const handleSaveName = async () => {
    const trimmed = playerName.trim();
    if (!trimmed) return alert("Enter a valid name.");

    const uid = localStorage.getItem("uid") || "";
    localStorage.setItem("playerName", trimmed);

    try {
      const res = await fetch("/api/user/update_name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, in_game_name: trimmed }),
      });

      if (res.status === 404) {
        alert("Please register first or check your UID.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Update name failed: ${res.status}`);
      }

      const result = await res.json();
      alert(`Saved! Verified: ${result.verified}`);
      setIsVerified(result.verified);
    } catch (err) {
      console.error("❌ Update error:", err);
      alert("Name update likely worked, but verification check failed.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <p className="mb-4">Manage your account details and preferences here.</p>

      <div className="mb-6">
        <label htmlFor="playerName" className="block text-lg mb-2">
          Player Name{" "}
          {playerName && (
            <span className={isVerified ? "text-green-400" : "text-yellow-400"}>
              {isVerified ? "✅ Verified" : "❌ Unverified"}
            </span>
          )}
        </label>
        <Input
          id="playerName"
          value={playerName}
          onChange={handleNameChange}
          className="w-full px-4 py-3 text-lg rounded-md text-black"
          placeholder="Enter your in-game name"
        />
      </div>

      <Button
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3"
        onClick={handleSaveName}
      >
        Save Name
      </Button>

      <Button
        className="mt-6 bg-gray-600 hover:bg-gray-700 px-6 py-3 ml-4"
        onClick={() => router.push("/")}
      >
        ⬅️ Back to Home
      </Button>
    </div>
  );
}
