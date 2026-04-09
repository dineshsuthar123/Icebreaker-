"use client";

import { useState } from "react";

interface DiceRollerProps {
  onRoll: () => Promise<number>;
  disabled: boolean;
  lastValue: number | null;
}

const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceRoller({ onRoll, disabled, lastValue }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(lastValue);

  const handleRoll = async () => {
    if (rolling || disabled) return;
    setRolling(true);

    // Animate
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      await new Promise((r) => setTimeout(r, 80));
    }

    const result = await onRoll();
    setDisplayValue(result);
    setRolling(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRoll}
        disabled={disabled || rolling}
        aria-label={rolling ? "Rolling dice" : displayValue ? `Dice shows ${displayValue}` : "Roll the dice"}
        className={`w-24 h-24 rounded-2xl text-5xl flex items-center justify-center transition-all shadow-lg focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:outline-none ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : rolling
            ? "bg-indigo-400 text-white animate-bounce"
            : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 cursor-pointer"
        }`}
      >
        {displayValue ? DICE_FACES[displayValue] : "🎲"}
      </button>
      {!disabled && !rolling && !displayValue && (
        <span className="text-sm text-gray-500">Tap to roll</span>
      )}
      {displayValue && !rolling && (
        <span className="text-lg font-bold text-gray-700">Rolled: {displayValue}</span>
      )}
    </div>
  );
}
