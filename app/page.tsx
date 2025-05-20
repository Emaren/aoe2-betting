// app/page.tsx
"use client";

import React, { useState } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import AuthNamePrompt from "@/components/AuthNamePrompt";
import AuthPasswordPrompt from "@/components/AuthPasswordPrompt";
import MainBetUI from "@/components/MainBetUI";
import AdminUserList from "@/components/AdminUserList"; // ✅ Add this import

export default function Page() {
  const {
    uid,
    playerName,
    setPlayerName,
    setUid,
    loading,
  } = useUserAuth();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [opponent, setOpponent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const savePlayerName = () => {
    if (playerName.trim()) {
      setShowPasswordPrompt(true);
    }
  };

  const savePasswordAndRegister = async () => {
    if (!password.trim()) return;

    const newUid = crypto.randomUUID();
    const email = `${newUid}@aoe2hdbets.com`;

    localStorage.setItem("uid", newUid);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPass", password);
    localStorage.setItem("playerName", playerName.trim());

    try {
      const methods = await window.firebase.auth().fetchSignInMethodsForEmail(email);
      if (methods.length === 0) {
        await window.firebase.auth().createUserWithEmailAndPassword(email, password);
      } else {
        await window.firebase.auth().signInWithEmailAndPassword(email, password);
      }

      await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: newUid, email, in_game_name: playerName.trim() }),
      });

      setUid(newUid);
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("❌ Registration failed:", err);
      alert("Registration failed.");
    }
  };

  if (!uid && !showPasswordPrompt) {
    return (
      <AuthNamePrompt
        playerName={playerName}
        setPlayerName={setPlayerName}
        savePlayerName={savePlayerName}
        loading={loading}
      />
    );
  }

  if (!uid && showPasswordPrompt) {
    return (
      <AuthPasswordPrompt
        password={password}
        setPassword={setPassword}
        savePasswordAndRegister={savePasswordAndRegister}
        loading={loading}
      />
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto p-4 bg-gray-900 text-white min-h-screen space-y-8">
      <MainBetUI
        opponent={opponent}
        setOpponent={setOpponent}
        betPending={false}
        betAmount={0}
        challenger=""
        betStatus=""
        showButtons={false}
        handleAccept={() => {}}
        handleDecline={() => {}}
        handleChallenge={() => alert(`Challenged ${opponent}`)}
        pendingBets={[]}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        router={null}
        playerName={playerName}
      />

      {/* ✅ Show Admin Panel if you're the admin */}
      {uid === "c30291ce-32f5-43a1-aa74-0dfb920a9923" && <AdminUserList />}
    </main>
  );
}
