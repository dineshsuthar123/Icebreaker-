"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">🎲 Icebreaker</h1>
        <p className="text-lg text-gray-600">
          Live facilitation board game for workshop icebreakers
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-sm">
        {/* Host: Create Session */}
        <button
          onClick={() => router.push("/host/create")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors shadow-lg"
        >
          🎯 Create Session (Host)
        </button>

        {/* Participant: Join */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Join a Game</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-center text-lg font-mono uppercase tracking-widest text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={() => {
                if (joinCode.length >= 4) router.push(`/join/${joinCode}`);
              }}
              disabled={joinCode.length < 4}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {/* Admin link */}
        <button
          onClick={() => router.push("/admin")}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          Admin Panel →
        </button>
      </div>
    </div>
  );
}
