"use client";

import type { Prompt } from "@/lib/types";

const TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  move: { bg: "bg-green-50 border-green-300", icon: "🏃" },
  talk: { bg: "bg-blue-50 border-blue-300", icon: "💬" },
  create: { bg: "bg-purple-50 border-purple-300", icon: "🎨" },
  wildcard: { bg: "bg-yellow-50 border-yellow-300", icon: "⭐" },
};

interface PromptCardProps {
  prompt: Prompt | null;
  spaceType: string | null;
}

export default function PromptCard({ prompt, spaceType }: PromptCardProps) {
  if (!prompt) return null;

  const style = TYPE_STYLES[spaceType || prompt.type] || TYPE_STYLES.wildcard;

  return (
    <div className={`rounded-xl border-2 p-6 ${style.bg} shadow-lg`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{style.icon}</span>
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          {spaceType || prompt.type}
        </span>
      </div>
      <p className="text-lg font-medium text-gray-800 leading-relaxed">
        {prompt.text}
      </p>
    </div>
  );
}
