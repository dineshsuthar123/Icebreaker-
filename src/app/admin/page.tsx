"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  togglePrompt,
  deletePrompt,
} from "@/lib/actions/prompts";
import type { Prompt, PromptType } from "@/lib/types";

const TYPES: PromptType[] = ["move", "talk", "create", "wildcard"];

const TYPE_COLORS: Record<string, string> = {
  move: "bg-green-100 text-green-800",
  talk: "bg-blue-100 text-blue-800",
  create: "bg-purple-100 text-purple-800",
  wildcard: "bg-yellow-100 text-yellow-800",
};

export default function AdminPage() {
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [filterType, setFilterType] = useState<PromptType | "all">("all");
  const [loading, setLoading] = useState(true);

  // New prompt form
  const [newType, setNewType] = useState<PromptType>("move");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<PromptType>("move");
  const [editText, setEditText] = useState("");

  // Pending delete state (two-step: click Del > confirm inline)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPrompts();
    setAllPrompts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch from Supabase
    load();
  }, [load]);

  const prompts = filterType === "all"
    ? allPrompts
    : allPrompts.filter((p) => p.type === filterType);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    await createPrompt(newType, newText.trim());
    setNewText("");
    await load();
    setAdding(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await togglePrompt(id, !current);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deletePrompt(id);
    setPendingDeleteId(null);
    await load();
  };

  const startEdit = (prompt: Prompt) => {
    setEditId(prompt.id);
    setEditType(prompt.type);
    setEditText(prompt.text);
  };

  const handleUpdate = async () => {
    if (!editId || !editText.trim()) return;
    await updatePrompt(editId, { type: editType, text: editText.trim() });
    setEditId(null);
    await load();
  };

  const counts = {
    all: allPrompts.length,
    move: allPrompts.filter((p) => p.type === "move").length,
    talk: allPrompts.filter((p) => p.type === "talk").length,
    create: allPrompts.filter((p) => p.type === "create").length,
    wildcard: allPrompts.filter((p) => p.type === "wildcard").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🛠 Prompt Admin
            </h1>
            <p className="text-sm text-gray-500">
              Manage prompts for the icebreaker game
            </p>
          </div>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Back to Game
          </Link>
        </div>

        {/* Add new prompt */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Add New Prompt
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PromptType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter prompt text..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["all", ...TYPES] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              <span className="ml-1 opacity-60">
                ({type === "all" ? counts.all : counts[type]})
              </span>
            </button>
          ))}
        </div>

        {/* Prompts list */}
        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : prompts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No prompts found.</p>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`bg-white rounded-lg p-4 shadow-sm border flex items-start gap-3 ${
                  !prompt.enabled ? "opacity-50" : ""
                }`}
              >
                {editId === prompt.id ? (
                  // Edit mode
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <select
                      value={editType}
                      onChange={(e) =>
                        setEditType(e.target.value as PromptType)
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 font-medium"
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleUpdate}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                        TYPE_COLORS[prompt.type]
                      }`}
                    >
                      {prompt.type}
                    </span>
                    <p className="flex-1 text-sm text-gray-700">
                      {prompt.text}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(prompt.id, prompt.enabled)}
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          prompt.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {prompt.enabled ? "On" : "Off"}
                      </button>
                      <button
                        onClick={() => startEdit(prompt)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      {pendingDeleteId === prompt.id ? (
                        <span className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">Sure?</span>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(null)}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingDeleteId(prompt.id)}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          Del
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
