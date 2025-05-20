// context/UserAuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
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
  isAdmin: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => Promise<void>;
};

const Ctx = createContext<UserAuth | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ─── keep LS ↔︎ state ───────────────────────────── */
  useEffect(() => {
    const sync = () => {
      setPlayerName(localStorage.getItem("playerName") ?? "");
      setUid(localStorage.getItem("uid"));
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  /* ─── 1) silent login if creds exist but Firebase signed-out ─── */
  useEffect(() => {
    const trySilentLogin = async () => {
      const auth = window.firebase?.auth?.();
      if (!auth) return;

      if (auth.currentUser) return;

      const email = localStorage.getItem("userEmail");
      const pass = localStorage.getItem("userPass");
      if (!email || !pass) return;

      try {
        await auth.signInWithEmailAndPassword(email, pass);
      } catch (e) {
        console.warn("🔑 Silent login failed:", e);
        ["userEmail", "userPass", "uid"].forEach((k) =>
          localStorage.removeItem(k)
        );
      }
    };

    trySilentLogin();
  }, []);

  /* ─── 2) Firebase auth listener ──────────────────── */
  useEffect(() => {
    const unsub = window.firebase
      ?.auth?.()
      ?.onAuthStateChanged(async (user) => {
        setIsLoggedIn(!!user);

        if (!user) {
          setUid(null);
          setIsAdmin(false);
          return;
        }

        const id = user.uid;
        setUid(id);

        const token = await user.getIdToken(true);
        const email =
          localStorage.getItem("userEmail") || `${id}@aoe2hdbets.com`;
        const name = localStorage.getItem("playerName") || "";

        try {
          console.log("🔍 Fetching user with:", {
            uid: id,
            email,
            in_game_name: name,
          });

          const res = await fetch("/api/user/me", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ uid: id, email, in_game_name: name }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.in_game_name) {
              setPlayerName(data.in_game_name);
              localStorage.setItem("playerName", data.in_game_name);
            }
            setIsAdmin(!!data.is_admin);
            localStorage.setItem("isAdmin", String(!!data.is_admin));
          } else {
            console.error("❌ Failed to fetch user:", res.status);
          }
        } catch (e) {
          console.warn("fetch /me failed:", e);
        }

        // ✅ Start ping loop to update last_seen
        const ping = async () => {
          try {
            const freshToken = await user.getIdToken();
            await fetch("/api/user/ping", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${freshToken}`,
              },
            });
          } catch (err) {
            console.warn("⚠️ Failed to ping /api/user/ping", err);
          }
        };

        ping(); // initial ping
        const interval = setInterval(ping, 60_000); // repeat every 60s
        return () => clearInterval(interval); // cleanup
      });

    return () => unsub?.();
  }, [playerName]);

  /* ─── logout (keep creds and admin flag) ──────────── */
  const logout = async () => {
    const auth = window.firebase?.auth?.();
    await auth?.signOut();

    const KEEP = [
      "uid",
      "userEmail",
      "userPass",
      "playerName",
      "isAdmin",
    ] as const;
    const stash: Record<string, string> = {};
    KEEP.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) stash[k] = v;
    });

    localStorage.clear();
    Object.entries(stash).forEach(([k, v]) => localStorage.setItem(k, v));

    setUid(null);
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <Ctx.Provider
      value={{
        playerName,
        setPlayerName: (n: string) => {
          setPlayerName(n);
          localStorage.setItem("playerName", n);
        },
        uid,
        setUid,
        isAdmin,
        isLoggedIn,
        loading,
        logout,
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
