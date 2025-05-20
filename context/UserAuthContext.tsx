// context/UserAuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type firebase from "firebase/compat/app";

declare global {
  interface Window {
    firebase: typeof firebase;
  }
}

type UserAuth = {
  playerName: string;
  setPlayerName: (n: string) => void;
  uid: string | null;
  setUid: (u: string | null) => void;
  finishLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
};

const Ctx = createContext<UserAuth | undefined>(undefined);

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  /* ─ Sync localStorage → state ─ */
  useEffect(() => {
    setPlayerName(localStorage.getItem("playerName") ?? "");
    setUid(localStorage.getItem("uid"));

    const sync = () => {
      setPlayerName(localStorage.getItem("playerName") ?? "");
      setUid(localStorage.getItem("uid"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  /* ─ Firebase auth state → logged-in flag ─ */
  useEffect(() => {
    const unsub = window.firebase?.auth?.()?.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setUid(null);
        setIsAdmin(false);
      }
    });
    return () => unsub?.();
  }, []);

  /* ─ Fetch /api/user/me when UID exists ─ */
  useEffect(() => {
    const fetchSelf = async () => {
      if (!uid) return;
      try {
        const res = await fetch("/api/user/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(!!data.is_admin);
          if (data.in_game_name) setPlayerName(data.in_game_name);
        }
      } catch (e) {
        console.warn("fetch /api/user/me failed:", e);
      }
    };
    fetchSelf();
  }, [uid]);

  /* ─ Finish login / register flow ─ */
  const finishLogin = async () => {
    if (!playerName.trim()) return;
    setLoading(true);

    try {
      let id = localStorage.getItem("uid");
      let email = localStorage.getItem("userEmail");
      let pass = localStorage.getItem("userPass");

      if (!id || !email || !pass) {
        id = crypto.randomUUID();
        email = `${id}@aoe2hdbets.com`;
        pass = crypto.randomUUID();
        localStorage.setItem("uid", id);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userPass", pass);
      }

      setUid(id);
      localStorage.setItem("playerName", playerName);

      const m = await window.firebase.auth().fetchSignInMethodsForEmail(email);
      if (m.length === 0)
        await window.firebase.auth().createUserWithEmailAndPassword(email, pass);
      else
        await window.firebase.auth().signInWithEmailAndPassword(email, pass);

      const r = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: id, email, in_game_name: playerName.trim() }),
      });

      const json = await r.json();
      setIsAdmin(!!json.is_admin);
      setIsLoggedIn(true);
    } catch (e) {
      console.error("login/register failed", e);
    } finally {
      setLoading(false);
    }
  };

  /* ─ Logout ─ */
  const logout = async () => {
    await window.firebase?.auth?.()?.signOut();
    localStorage.clear();
    setUid(null);
    setPlayerName("");
    setIsAdmin(false);
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <Ctx.Provider
      value={{
        playerName,
        setPlayerName,
        uid,
        setUid,
        finishLogin,
        logout,
        loading,
        isLoggedIn,
        isAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useUserAuth(): UserAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserAuth must be used inside UserAuthProvider");
  return ctx;
}
