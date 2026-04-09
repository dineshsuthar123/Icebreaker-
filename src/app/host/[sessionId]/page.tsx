"use client";

import { use, useState, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import { startGame, endGame } from "@/lib/actions/session";
import { rollDice, selectPrompt, completeTurn, resetTurn } from "@/lib/actions/game";
import GameBoard from "@/components/GameBoard";
import DiceRoller from "@/components/DiceRoller";
import PromptCard from "@/components/PromptCard";
import QRJoin from "@/components/QRJoin";
import TeamList from "@/components/TeamList";
import type { Prompt } from "@/lib/types";

export default function HostGamePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { session, teams, participants, currentTurn, loading, refresh } =
    useGameState(sessionId);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const joinUrl = session && typeof window !== "undefined" 
    ? `${window.location.origin}/join/${session.join_code}` 
    : "";

  // Fetch prompt when turn has a prompt_id
  useEffect(() => {
    if (currentTurn?.status === "prompted" && currentTurn.prompt_id) {
      import("@/lib/supabase").then(({ supabase }) => {
        supabase
          .from("prompts")
          .select("*")
          .eq("id", currentTurn.prompt_id!)
          .single()
          .then(({ data }) => {
            if (data) setCurrentPrompt(data);
          });
      });
    } else if (currentTurn?.status === "waiting") {
      setCurrentPrompt(null);
    }
  }, [currentTurn?.status, currentTurn?.prompt_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-red-500">Session not found</span>
      </div>
    );
  }

  const activeTeam = teams[session.current_team_index];

  const handleStartGame = async () => {
    setActionLoading(true);
    try {
      await startGame(sessionId);
      refresh();
    } catch (err) {
      alert("Failed to start: " + (err as Error).message);
    }
    setActionLoading(false);
  };

  const handleEndGame = async () => {
    setActionLoading(true);
    try {
      await endGame(sessionId);
      refresh();
    } catch (err) {
      alert("Failed to end game: " + (err as Error).message);
    }
    setActionLoading(false);
  };

  const handleRoll = async (): Promise<number> => {
    if (!currentTurn || !activeTeam) return 1;
    try {
      const { diceValue } = await rollDice(currentTurn.id, sessionId, activeTeam.id);
      refresh();
      return diceValue;
    } catch {
      refresh();
      return 1;
    }
  };

  const handleShowPrompt = async () => {
    if (!currentTurn || !currentTurn.space_type) return;
    setActionLoading(true);
    try {
      const prompt = await selectPrompt(currentTurn.id, sessionId, currentTurn.space_type);
      setCurrentPrompt(prompt);
      refresh();
    } catch (err) {
      alert("Failed to load prompt: " + (err as Error).message);
      refresh();
    }
    setActionLoading(false);
  };

  const handleCompleteTurn = async () => {
    if (!currentTurn) return;
    setActionLoading(true);
    setCurrentPrompt(null);
    try {
      await completeTurn(currentTurn.id, sessionId);
      refresh();
    } catch {
      refresh();
    }
    setActionLoading(false);
  };

  const handleResetTurn = async () => {
    if (!currentTurn || !activeTeam) return;
    setActionLoading(true);
    setCurrentPrompt(null);
    try {
      await resetTurn(currentTurn.id, sessionId, activeTeam.id);
      refresh();
    } catch {
      refresh();
    }
    setActionLoading(false);
  };

  // LOBBY
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎲 Lobby</h1>
          <p className="text-gray-500 mb-6">
            Waiting for participants to join...
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QRJoin joinCode={session.join_code} joinUrl={joinUrl} />
            <TeamList
              teams={teams}
              participants={participants}
              currentTeamIndex={0}
              isPlaying={false}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleStartGame}
              disabled={actionLoading || participants.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-8 rounded-xl text-lg transition-colors shadow-lg"
            >
              {actionLoading ? "Starting..." : "▶ Start Game"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ENDED
  if (session.status === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🎉 Game Over!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Great session! {Math.min(session.current_round, session.max_rounds)} rounds completed.
          </p>
          <div className="mb-8">
            <GameBoard boardSize={session.board_size} teams={teams} />
          </div>
          <TeamList
            teams={teams}
            participants={participants}
            currentTeamIndex={-1}
            isPlaying={false}
          />
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // PLAYING
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎲 Icebreaker</h1>
            <p className="text-sm text-gray-500">
              Round {session.current_round} / {session.max_rounds} · Code:{" "}
              <span className="font-mono font-bold text-indigo-600">
                {session.join_code}
              </span>
            </p>
          </div>
          <button
            onClick={handleEndGame}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            End Game
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Board */}
          <div className="lg:col-span-2 space-y-4">
            <GameBoard boardSize={session.board_size} teams={teams} />

            {/* Current Turn Info */}
            {activeTeam && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: activeTeam.color }}
                  />
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeTeam.name}&apos;s Turn
                  </h2>
                </div>

                <div className="flex flex-wrap items-start gap-6">
                  {/* Dice */}
                  {currentTurn?.status === "waiting" && (
                    <div className="flex flex-col items-center">
                      <DiceRoller
                        onRoll={handleRoll}
                        disabled={false}
                        lastValue={null}
                      />
                    </div>
                  )}

                  {/* After roll, before prompt */}
                  {currentTurn?.status === "rolled" && (
                    <div className="flex flex-col items-center gap-3">
                      <DiceRoller
                        onRoll={handleRoll}
                        disabled={true}
                        lastValue={currentTurn.dice_value}
                      />
                      <p className="text-sm text-gray-600">
                        Landed on:{" "}
                        <span className="font-semibold capitalize">
                          {currentTurn.space_type}
                        </span>{" "}
                        (space {activeTeam.position})
                      </p>
                      <button
                        onClick={handleShowPrompt}
                        disabled={actionLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        Show Prompt
                      </button>
                    </div>
                  )}

                  {/* Prompt displayed */}
                  {currentTurn?.status === "prompted" && currentPrompt && (
                    <div className="flex-1 space-y-4">
                      <PromptCard
                        prompt={currentPrompt}
                        spaceType={currentTurn.space_type}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleCompleteTurn}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          ✓ Done — Next Turn
                        </button>
                        <button
                          onClick={handleResetTurn}
                          disabled={actionLoading}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Reset Turn
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            <QRJoin joinCode={session.join_code} joinUrl={joinUrl} />
            <TeamList
              teams={teams}
              participants={participants}
              currentTeamIndex={session.current_team_index}
              isPlaying={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
