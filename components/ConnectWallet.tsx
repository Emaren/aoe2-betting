// components/ConnectWallet.tsx
"use client";

import { useEffect, useState } from "react";
import WalletConnect from "@walletconnect/client";

export default function ConnectWallet() {
  const [wcAccounts, setWcAccounts] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
    });

    if (connector.connected) {
      setWcAccounts(connector.accounts);
    }

    connector.on("connect", (_err, { params }) => {
      setWcAccounts(params[0].accounts);
    });

    connector.on("disconnect", () => {
      setWcAccounts([]);
    });

    return () => {
      if (connector.connected) connector.killSession();
    };
  }, []);

  if (!mounted) return null;

  return (
    <button className="px-4 py-2 bg-blue-600 rounded-lg">
      {wcAccounts.length ? "Wallet Connected" : "Connect Wallet"}
    </button>
  );
}
