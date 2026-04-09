"use client";

import { getSpaceType, type Team } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  move: "bg-green-400",
  talk: "bg-blue-400",
  create: "bg-purple-400",
  wildcard: "bg-yellow-400",
};

const TYPE_ICONS: Record<string, string> = {
  move: "🏃",
  talk: "💬",
  create: "🎨",
  wildcard: "⭐",
};

interface GameBoardProps {
  boardSize: number;
  teams: Team[];
}

export default function GameBoard({ boardSize, teams }: GameBoardProps) {
  const spaces = Array.from({ length: boardSize + 1 }, (_, i) => i);

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
        Board
      </h3>
      <div className="flex flex-wrap gap-1">
        {spaces.map((pos) => {
          const type = getSpaceType(pos);
          const teamsHere = teams.filter((t) => t.position === pos);

          return (
            <div
              key={pos}
              className={`relative w-11 h-11 rounded-md flex items-center justify-center text-sm font-bold ${
                pos === 0
                  ? "bg-gray-200 text-gray-600"
                  : pos === boardSize
                  ? "bg-red-400 text-white"
                  : TYPE_COLORS[type]
              } ${pos === 0 ? "" : "text-white"}`}
              title={pos === 0 ? "Start" : pos === boardSize ? "End" : `${type} (space ${pos})`}
            >
              {pos === 0 ? "GO" : pos === boardSize ? "🏁" : TYPE_ICONS[type]}

              {/* Team tokens */}
              {teamsHere.length > 0 && (
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {teamsHere.map((t) => (
                    <div
                      key={t.id}
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: t.color }}
                      title={t.name}
                      aria-label={`${t.name} token`}
                    />
                  ))}
                </div>
              )}

              {/* Position number */}
              <span className="absolute bottom-0 right-0.5 text-[8px] opacity-50">
                {pos}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>🏃 Move</span>
        <span>💬 Talk</span>
        <span>🎨 Create</span>
        <span>⭐ Wildcard</span>
      </div>
    </div>
  );
}
