// app/Providers.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { useChainId } from "@/hooks/useChainId";
import { woloChainConfig as baseConfig } from "@/lib/woloChain";

const queryClient = new QueryClient();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function Providers({ children }: { children: ReactNode }) {
  // 🔥 initialise exactly once on the client
  useEffect(() => {
    if (typeof window !== "undefined" && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("🔥 Firebase initialised");
      window.firebase = firebase as any;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <KeplrSuggest>{children}</KeplrSuggest>
    </QueryClientProvider>
  );
}

function KeplrSuggest({ children }: { children: ReactNode }) {
  const { data: chainId, isSuccess } = useChainId();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keplr = (window as any).keplr;
    if (!keplr || !isSuccess || !chainId) return;

    keplr.experimentalSuggestChain({ ...baseConfig, chainId }).catch((err: any) =>
      console.error("Keplr suggestChain failed:", err)
    );
  }, [chainId, isSuccess]);

  return <>{children}</>;
}
