"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Team, Participant, Turn } from "@/lib/types";

export interface GameState {
  session: Session | null;
  teams: Team[];
  participants: Participant[];
  currentTurn: Turn | null;
  loading: boolean;
}

export function useGameState(sessionId: string): GameState & { refresh: () => void } {
  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    const [sessionRes, teamsRes, participantsRes, turnRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
      supabase.from("teams").select("*").eq("session_id", sessionId).order("turn_order"),
      supabase.from("participants").select("*").eq("session_id", sessionId).order("created_at"),
      supabase
        .from("turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (sessionRes.data) setSession(sessionRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (participantsRes.data) setParticipants(participantsRes.data);
    setCurrentTurn(turnRes.data);
    setLoading(false);
  }, [sessionId]);

  // Debounced refresh to prevent thundering herd on rapid realtime events
  const debouncedFetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchAll(), 200);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`game-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `session_id=eq.${sessionId}` },
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "turns", filter: `session_id=eq.${sessionId}` },
        () => debouncedFetch()
      )
      .subscribe();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchAll, debouncedFetch]);

  return { session, teams, participants, currentTurn, loading, refresh: fetchAll };
}
