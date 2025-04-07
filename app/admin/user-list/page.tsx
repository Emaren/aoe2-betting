"use client";
import { useEffect, useState } from "react";

type User = {
  uid: string;
  email: string;
  in_game_name: string;
  verified: boolean;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/admin/users", {
      headers: {
        Authorization: "Bearer secretadmin",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(setUsers)
      .catch((err) => {
        console.error("Failed to fetch users:", err);
      });
  }, []);
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <table className="w-full table-auto border border-collapse border-gray-100">
        <thead>
          <tr className="bg-gray-900">
            <th className="border px-4 py-2">UID</th>
            <th className="border px-4 py-2">Email @</th>
            <th className="border px-4 py-2">In-Game Name</th>
            <th className="border px-4 py-2">Verified</th>
            <th className="border px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td className="border px-4 py-2">{u.uid}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{u.in_game_name}</td>
              <td className="border px-4 py-2">{u.verified ? "✅" : "❌"}</td>
              <td className="border px-4 py-2">{new Date(u.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
