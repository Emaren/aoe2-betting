import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8002";
  
  export async function loginOrRegister(playerName: string, password: string): Promise<string> {
    const trimmed = playerName.trim();
    const emailLocal = trimmed.toLowerCase().replace(/\s+/g, "");
    const email = `${emailLocal}.${crypto.randomUUID().slice(-6)}@aoe2hd.app`;
  
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPassword", password);
  
    try {
      // Try Firebase login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      localStorage.setItem("uid", uid); // ✅ Store correct UID
      console.log("✅ Logged in existing Firebase user");
  
      const dbRes = await fetch(`${API}/api/user/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
  
      if (dbRes.status === 404) {
        // Register in backend if not found
        await fetch(`${API}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            email,
            in_game_name: trimmed,
          }),
        });
        console.log("✅ Registered user in backend");
      }
  
      return uid;
  
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        // Create new Firebase user
        const newUser = await createUserWithEmailAndPassword(auth, email, password);
        const uid = newUser.user.uid;
        localStorage.setItem("uid", uid); // ✅ Store correct UID
        console.log("✅ Created new Firebase user");
  
        await fetch(`${API}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            email,
            in_game_name: trimmed,
          }),
        });
  
        return uid;
      }
  
      console.error("❌ Firebase error:", err);
      throw err;
    }
  }
  