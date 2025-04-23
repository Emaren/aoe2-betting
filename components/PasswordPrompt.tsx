"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PasswordPrompt({ password, setPassword, onRegister }: any) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <Card className="bg-gray-800 shadow-xl w-full max-w-md">
        <CardContent className="p-8 flex flex-col space-y-6">
          <h1 className="text-xl font-bold text-center">Set your Password</h1>
          <Input
            className="text-black px-4 py-3 text-lg rounded-md"
            placeholder="Choose a password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={onRegister} className="w-full bg-blue-600 hover:bg-blue-700 py-3">
            Register & Start Betting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}