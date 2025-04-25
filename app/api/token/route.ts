import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

const globalForApp = globalThis as unknown as { _firebaseApp?: ReturnType<typeof initializeApp> };

if (!globalForApp._firebaseApp) {
  const serviceAccountPath = path.resolve(process.cwd(), "firebase-admin-key.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

  globalForApp._firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
}

const app = globalForApp._firebaseApp;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await getAuth(app).verifyIdToken(idToken);

    return NextResponse.json({ uid: decoded.uid, token: idToken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
