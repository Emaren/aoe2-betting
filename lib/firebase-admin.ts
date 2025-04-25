// lib/firebase-admin.ts

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || "{}");

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminAuth = getAuth();
