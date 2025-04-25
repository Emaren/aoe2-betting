// lib/firebase-admin.ts

import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

// Safely parse the FIREBASE_ADMIN_KEY env variable
const serviceAccount = process.env.FIREBASE_ADMIN_KEY
  ? JSON.parse(process.env.FIREBASE_ADMIN_KEY)
  : null;

if (!serviceAccount) {
  throw new Error("FIREBASE_ADMIN_KEY environment variable is missing or invalid.");
}

// Only initialize if no apps exist yet
const adminApp: App =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

// Export Admin Auth instance
export const adminAuth: Auth = getAuth(adminApp);
