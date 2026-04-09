"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useGameState } from "@/hooks/useGameState";
import { rollDice, selectPrompt } from "@/lib/actions/game";
import DiceRoller from "@/components/DiceRoller";
import PromptCard from "@/components/PromptCard";
import type { Prompt, Participant } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { session, teams, participants, currentTurn, loading, refresh } =
    useGameState(sessionId);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

  // Load participant from localStorage (keyed by session)
  useEffect(() => {
    const pid = localStorage.getItem(`participant_${sessionId}`);
    if (pid && participants.length > 0) {
      const p = participants.find((p) => p.id === pid);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring identity from localStorage
      if (p) setParticipant(p);
    }
  }, [participants, sessionId]);

  // Fetch prompt when turn has one
  const fetchPrompt = useCallback(async () => {
    if (currentTurn?.status === "prompted" && currentTurn.prompt_id) {
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .eq("id", currentTurn.prompt_id)
        .single();
      if (data) setCurrentPrompt(data);
    } else if (currentTurn?.status === "waiting") {
      setCurrentPrompt(null);
    }
  }, [currentTurn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching prompt from Supabase
    fetchPrompt();
  }, [fetchPrompt]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading game...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 gap-3">
        <span className="text-lg text-red-500">Session not found</span>
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Back to Home</Link>
      </div>
    );
  }

  const activeTeam = teams[session.current_team_index];
  const myTeam = participant
    ? teams.find((t) => t.id === participant.team_id)
    : null;
  const isMyTurn = myTeam && activeTeam && myTeam.id === activeTeam.id;
  const isCaptain = participant?.is_captain;
  const canRoll = isMyTurn && isCaptain && currentTurn?.status === "waiting";

  // ENDED
  if (session.status === "ended") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 Game Over!</h1>
          <p className="text-gray-600 mb-6">Thanks for playing!</p>
          {myTeam && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: myTeam.color }}
              />
              <span className="font-semibold text-lg">{myTeam.name}</span>
              <span className="text-gray-500">— Position {myTeam.position}</span>
            </div>
          )}
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // LOBBY
  if (session.status === "lobby") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">⏳ Waiting</h1>
          <p className="text-gray-500 mb-4">
            The host will start the game soon...
          </p>
          {myTeam && (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: myTeam.color }}
              />
              <span className="font-semibold">{myTeam.name}</span>
              {isCaptain && (
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                  Captain 👑
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            {participants.length} player{participants.length !== 1 ? "s" : ""}{" "}
            joined
          </p>
        </div>
      </div>
    );
  }

  // PLAYING
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Round {session.current_round} / {session.max_rounds}
          </p>
          {myTeam && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: myTeam.color }}
              />
              <span className="font-semibold text-sm">{myTeam.name}</span>
              {isCaptain && <span className="text-xs">👑</span>}
            </div>
          )}
        </div>

        {/* Identity not found */}
        {!participant && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3 text-center">
            Your identity was not found. <a href={`/join/${session.join_code}`} className="underline font-medium">Rejoin the game</a> to participate.
          </div>
        )}

        {/* Active team indicator */}
        {activeTeam && (
          <div
            className={`rounded-xl p-4 text-center shadow-lg ${
              isMyTurn ? "bg-indigo-600 text-white" : "bg-white text-gray-800"
            }`}
          >
            <p className="text-sm opacity-80">
              {isMyTurn ? "Your team's turn!" : "Current turn:"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: activeTeam.color }}
              />
              <span className="text-xl font-bold">{activeTeam.name}</span>
            </div>
          </div>
        )}

        {/* Dice for captain */}
        {canRoll && (
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-3">
              You&apos;re the captain! Roll the dice:
            </p>
            <DiceRoller
              onRoll={async () => {
                if (!currentTurn || !activeTeam) return 1;
                try {
                  const { diceValue } = await rollDice(
                    currentTurn.id,
                    sessionId,
                    activeTeam.id
                  );
                  refresh();
                  return diceValue;
                } catch {
                  refresh();
                  return 1;
                }
              }}
              disabled={false}
              lastValue={null}
            />
          </div>
        )}

        {/* Show dice result for non-captains or after roll */}
        {currentTurn?.status === "rolled" && currentTurn.dice_value && (
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <p className="text-3xl mb-2">
              {["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][currentTurn.dice_value]}
            </p>
            <p className="text-lg font-bold text-gray-800">
              Rolled: {currentTurn.dice_value}
            </p>
            <p className="text-sm text-gray-500 capitalize">
              Space: {currentTurn.space_type}
            </p>
            {isMyTurn && isCaptain && (
              <button
                onClick={async () => {
                  if (!currentTurn?.space_type) return;
                  try {
                    const prompt = await selectPrompt(
                      currentTurn.id,
                      sessionId,
                      currentTurn.space_type
                    );
                    setCurrentPrompt(prompt);
                    refresh();
                  } catch {
                    refresh();
                  }
                }}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Show Prompt
              </button>
            )}
          </div>
        )}

        {/* Prompt */}
        {currentTurn?.status === "prompted" && currentPrompt && (
          <PromptCard
            prompt={currentPrompt}
            spaceType={currentTurn.space_type}
          />
        )}

        {/* Team positions */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Positions
          </h3>
          <div className="space-y-2">
            {teams.map((team, i) => (
              <div
                key={team.id}
                className={`flex items-center gap-2 text-sm ${
                  i === session.current_team_index
                    ? "font-bold text-indigo-700"
                    : "text-gray-600"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="flex-1">{team.name}</span>
                <span className="font-mono">
                  {team.position}/{session.board_size}
                </span>
                {/* Progress bar */}
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(team.position / session.board_size) * 100}%`,
                      backgroundColor: team.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
