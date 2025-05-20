// app/Providers.tsx
"use client";

import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { woloChainConfig as baseConfig } from "@/lib/woloChain";
import { useChainId } from "@/hooks/useChainId";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// ✅ Firebase config from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ One React Query client for the whole app
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // 🔥 Initialize Firebase once on client
  useEffect(() => {
    if (typeof window !== "undefined" && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("🔥 Firebase initialized");
      window.firebase = firebase;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <InnerKeplrSetup>{children}</InnerKeplrSetup>
    </QueryClientProvider>
  );
}

function InnerKeplrSetup({ children }: { children: React.ReactNode }) {
  const { data: chainId, isSuccess } = useChainId();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).keplr &&
      isSuccess &&
      chainId
    ) {
      const cfg = { ...baseConfig, chainId };
      (window as any)
        .keplr.experimentalSuggestChain(cfg)
        .then(() => {
          console.log("✅ Wolochain suggested to Keplr with chainId:", chainId);
        })
        .catch((err: any) => {
          console.error("❌ suggestChain failed:", err);
        });
    }
  }, [chainId, isSuccess]);

  return <>{children}</>;
}
