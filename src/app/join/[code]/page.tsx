"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionByCode, getTeams, joinSession } from "@/lib/actions/session";
import type { Session, Team } from "@/lib/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const s = await getSessionByCode(code);
        if (!s) {
          setError("Session not found. Check your code.");
          setLoading(false);
          return;
        }
        if (s.status === "ended") {
          setError("This session has ended.");
          setLoading(false);
          return;
        }
        setSession(s);
        const t = await getTeams(s.id);
        setTeams(t);
        if (t.length > 0) setSelectedTeam(t[0].id);
      } catch {
        setError("Failed to load session.");
      }
      setLoading(false);
    }
    load();
  }, [code]);

  const handleJoin = async () => {
    if (!playerName.trim() || !selectedTeam) return;
    setJoining(true);
    try {
      const participant = await joinSession(code, playerName.trim(), selectedTeam);
      // Store participant ID locally, keyed by session to support multiple tabs
      localStorage.setItem(`participant_${session!.id}`, participant.id);
      router.push(`/play/${session!.id}`);
    } catch (err) {
      setError((err as Error).message);
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <span className="text-lg text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-sm">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Join Game</h1>
        <p className="text-sm text-gray-500 mb-6">
          Code: <span className="font-mono font-bold text-indigo-600">{code}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 placeholder:text-gray-700 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Choose Team
            </label>
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedTeam === team.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-medium text-gray-800">{team.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={joining || !playerName.trim() || !selectedTeam}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
          >
            {joining ? "Joining..." : "Join Game 🎲"}
          </button>
        </div>
      </div>
    </div>
  );
}
