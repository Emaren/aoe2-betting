"use client";
import { UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  menuOpen: boolean;
  toggleMenu: () => void;
  pendingBetsCount: number;
}

export default function HeaderMenu({ menuOpen, toggleMenu, pendingBetsCount }: Props) {
  const router = useRouter();

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        className="bg-gray-700 hover:bg-gray-600 flex items-center gap-2 px-5 py-3 text-lg rounded-lg shadow-md"
        onClick={toggleMenu}
      >
        <UserCircle className="w-6 h-6" />
        My Account
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/profile")}>
            👤 Profile
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/admin/user-list")}>
            🛡️ Admin: User List
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/users")}>
            👥 Online Users
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/replay-parser")}>
            🧪 Parse Replay (Manual)
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/pending-bets")}>
            📌 Pending Bets ({pendingBetsCount})
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/upload")}>
            📤 Upload Replay
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/game-stats")}>
            📊 Game Stats
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/past-earnings")}>
            💰 Past Earnings
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => router.push("/settings")}>
            ⚙️ Settings
          </button>
        </div>
      )}
    </div>
  );
}
