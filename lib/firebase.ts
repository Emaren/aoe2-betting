// lib/firebase.ts

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

// ------------------------------------------------------------------------
// Firebase configuration.
// Loads each value from NEXT_PUBLIC_ environment variables if available,
// otherwise falls back to literal credentials.
// ------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyC_7CGvSRBY2t3Riy5IMtrfTXcd2BZbdA8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aoe2hd.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aoe2hd",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "aoe2hd.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "640514020315",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:640514020315:web:0b2c5a3004f6d3be080dfe",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-8ZBRVXFDKV",
};

// ------------------------------------------------------------------------
// Initialize Firebase:
// Only initialize if there are no apps already initialized. This prevents
// issues during hot reloads or in SSR scenarios.
// ------------------------------------------------------------------------
const app: FirebaseApp =
  !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ------------------------------------------------------------------------
// Get Firebase Authentication instance.
// ------------------------------------------------------------------------
export const auth: Auth = getAuth(app);

// ------------------------------------------------------------------------
// Get Firebase Analytics instance (only in the browser).
// ------------------------------------------------------------------------
export const analytics: Analytics | null =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
