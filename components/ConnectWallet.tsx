// components/ConnectWallet.tsx
"use client";

import React, { useState, useEffect } from "react";
import WalletConnect from "@walletconnect/client";
import { QRCodeCanvas } from "qrcode.react";
import { useKeplr } from "../hooks/use-keplr";
import { useWoloBalance } from "../hooks/useWoloBalance";
import HeaderMenu from "./HeaderMenu";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const { address, status, connect, disconnect } = useKeplr();
  const { data: rawBalance, isLoading: balanceLoading } = useWoloBalance(address);

  const [wc, setWc] = useState<WalletConnect | null>(null);
  const [wcUri, setWcUri] = useState<string>();
  const [wcAccounts, setWcAccounts] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const connector = new WalletConnect({ bridge: "https://bridge.walletconnect.org", qrcode: false });
    if (connector.connected) setWcAccounts(connector.accounts);
    connector.on("connect", (_err, { params }) => {
      setWcAccounts(params[0].accounts);
      setWcUri(undefined);
    });
    connector.on("disconnect", () => {
      setWcAccounts([]);
      setWcUri(undefined);
    });
    setWc(connector);
  }, []);

  if (!mounted) return null;

  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isLoggedIn = Boolean(localStorage.getItem("uid") && localStorage.getItem("playerName"));
  if (isLoggedIn) return <HeaderMenu />;
  if (isSafari) return null;

  const keplrAvailable = typeof (window as any).keplr !== "undefined";
  if (keplrAvailable) {
    if (status === "disconnected") {
      return (
        <button onClick={connect} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Connect Keplr
        </button>
      );
    }
    const balance =
      rawBalance != null
        ? `${(Number(rawBalance) / 1e6).toLocaleString()} Wolo`
        : balanceLoading
        ? "…"
        : "0 Wolo";

    return (
      <div className="space-y-2">
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Balance:</strong> {balance}</p>
        <button onClick={disconnect} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
          Disconnect
        </button>
      </div>
    );
  }

  if (wc && wcAccounts.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => wc.createSession().then(() => setWcUri(wc.uri))}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Connect via WalletConnect
        </button>
        {wcUri && (
          <div className="p-4 bg-gray-800 rounded space-y-2">
            <p className="text-sm">Scan with Keplr Mobile (or tap link):</p>
            <QRCodeCanvas value={wcUri} size={200} />
            <a
              href={wcUri}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-xs underline hover:text-green-400"
            >
              {wcUri}
            </a>
            <a
              href={`keplr://wc?uri=${encodeURIComponent(wcUri)}`}
              className="inline-block mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-white"
            >
              Open in Keplr Mobile
            </a>
          </div>
        )}
      </div>
    );
  } else if (wc && wcAccounts.length > 0) {
    return (
      <div className="space-y-2">
        <p><strong>WC Account:</strong> {wcAccounts.join(", ")}</p>
        <button onClick={() => wc.killSession()} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
          Disconnect WC
        </button>
      </div>
    );
  }

  return null;
}
