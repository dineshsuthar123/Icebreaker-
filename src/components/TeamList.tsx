"use client";

import type { Team, Participant } from "@/lib/types";

interface TeamListProps {
  teams: Team[];
  participants: Participant[];
  currentTeamIndex: number;
  isPlaying: boolean;
}

export default function TeamList({
  teams,
  participants,
  currentTeamIndex,
  isPlaying,
}: TeamListProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
        Teams
      </h3>
      <div className="space-y-3">
        {teams.map((team, i) => {
          const teamParticipants = participants.filter(
            (p) => p.team_id === team.id
          );
          const captain = teamParticipants.find((p) => p.is_captain);
          const isActive = isPlaying && i === currentTeamIndex;

          return (
            <div
              key={team.id}
              className={`rounded-lg p-3 border-2 transition-all ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-semibold text-gray-800 text-sm">
                  {team.name}
                </span>
                {isActive && (
                  <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full ml-auto">
                    Active
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  Pos: {team.position}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {captain && (
                  <span className="font-medium text-indigo-600">
                    👑 {captain.name}
                  </span>
                )}
                {teamParticipants.length > 1 && (
                  <span>
                    {" "}
                    + {teamParticipants.length - 1} member
                    {teamParticipants.length - 1 > 1 ? "s" : ""}
                  </span>
                )}
                {teamParticipants.length === 0 && (
                  <span className="text-gray-400 italic">No members yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
