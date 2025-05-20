// components/WalletConnector.tsx
"use client";

import { useState } from "react";
// 👇 point to the kebab-cased filename:
import { useKeplr } from "@/hooks/use-keplr";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";

export default function WalletConnector() {
  const { status, address, connect, disconnect } = useKeplr();
  const [open, setOpen] = useState(false);

  const onButtonClick = () => {
    if (status === "connected") {
      disconnect();
    } else {
      setOpen(true);
    }
  };

  const onConnect = async () => {
    try {
      await connect();
      setOpen(false);
    } catch (err) {
      console.error("Keplr connect failed:", err);
    }
  };

  return (
    <>
      <Button onClick={onButtonClick}>
        {status === "connected"
          ? `${address.slice(0, 6)}…${address.slice(-4)}`
          : "Connect Wallet"}
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <ModalHeader>Connect Your Keplr Wallet</ModalHeader>
        <ModalBody>
          <p>To place bets you need to connect your Keplr wallet.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onConnect}>Connect Keplr</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
