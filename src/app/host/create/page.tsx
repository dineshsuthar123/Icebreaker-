"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/actions/session";
import { TEAM_COLORS } from "@/lib/types";

export default function CreateSessionPage() {
  const router = useRouter();
  const [teamNames, setTeamNames] = useState(["Team Alpha", "Team Beta"]);
  const [maxRounds, setMaxRounds] = useState(10);
  const [boardSize, setBoardSize] = useState(30);
  const [loading, setLoading] = useState(false);

  const addTeam = () => {
    if (teamNames.length < 8) {
      setTeamNames([...teamNames, `Team ${teamNames.length + 1}`]);
    }
  };

  const removeTeam = (index: number) => {
    if (teamNames.length > 2) {
      setTeamNames(teamNames.filter((_, i) => i !== index));
    }
  };

  const updateTeamName = (index: number, name: string) => {
    const updated = [...teamNames];
    updated[index] = name;
    setTeamNames(updated);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { session } = await createSession(teamNames, maxRounds, boardSize);
      router.push(`/host/${session.id}`);
    } catch (err) {
      alert("Failed to create session: " + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-gray-500 hover:text-gray-700 mb-6 text-sm"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Session</h1>

        {/* Teams */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Teams</h2>
          <div className="space-y-3">
            {teamNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length] }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateTeamName(i, e.target.value)}
                  placeholder="Team name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {teamNames.length > 2 && (
                  <button
                    onClick={() => removeTeam(i)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {teamNames.length < 8 && (
            <button
              onClick={addTeam}
              className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              + Add Team
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Max Rounds
              </label>
              <input
                type="number"
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                min={1}
                max={50}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Board Spaces
              </label>
              <input
                type="number"
                value={boardSize}
                onChange={(e) => setBoardSize(Number(e.target.value))}
                min={10}
                max={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || teamNames.some((n) => !n.trim())}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl text-lg transition-colors shadow-lg"
        >
          {loading ? "Creating..." : "Create Session"}
        </button>
      </div>
    </div>
  );
}
