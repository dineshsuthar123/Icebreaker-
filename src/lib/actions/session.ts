"use server";

import { supabase } from "@/lib/supabase";
import { TEAM_COLORS } from "@/lib/types";
import type { Session, Team, Participant } from "@/lib/types";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createSession(
  teamNames: string[],
  maxRounds: number = 10,
  boardSize: number = 30
): Promise<{ session: Session; teams: Team[] }> {
  // Server-side validation
  if (!teamNames || teamNames.length < 2 || teamNames.length > 8) {
    throw new Error("Must have between 2 and 8 teams");
  }
  if (teamNames.some((n) => !n || !n.trim())) {
    throw new Error("Team names cannot be empty");
  }
  maxRounds = Math.max(1, Math.min(50, maxRounds));
  boardSize = Math.max(10, Math.min(100, boardSize));

  const joinCode = generateJoinCode();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      join_code: joinCode,
      status: "lobby",
      max_rounds: maxRounds,
      board_size: boardSize,
    })
    .select()
    .single();

  if (sessionError) throw new Error(sessionError.message);

  const teamInserts = teamNames.map((name, i) => ({
    session_id: session.id,
    name,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    turn_order: i,
    position: 0,
  }));

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .insert(teamInserts)
    .select();

  if (teamsError) throw new Error(teamsError.message);

  return { session, teams };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  return data;
}

export async function getSessionByCode(
  joinCode: string
): Promise<Session | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("join_code", joinCode.toUpperCase())
    .single();
  return data;
}

export async function getTeams(sessionId: string): Promise<Team[]> {
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_order");
  return data || [];
}

export async function getParticipants(
  sessionId: string
): Promise<Participant[]> {
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");
  return data || [];
}

export async function joinSession(
  joinCode: string,
  playerName: string,
  teamId: string
): Promise<Participant> {
  // Server-side validation
  if (!playerName || !playerName.trim()) throw new Error("Name is required");
  if (playerName.trim().length > 30) throw new Error("Name too long");

  const session = await getSessionByCode(joinCode);
  if (!session) throw new Error("Session not found");
  if (session.status === "ended") throw new Error("Session has ended");

  // Check if there is already a captain for this team
  const { data: existingParticipants } = await supabase
    .from("participants")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_captain", true);

  const isCaptain = !existingParticipants || existingParticipants.length === 0;

  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      session_id: session.id,
      team_id: teamId,
      name: playerName,
      is_captain: isCaptain,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return participant;
}

export async function startGame(sessionId: string): Promise<void> {
  const teams = await getTeams(sessionId);
  if (teams.length === 0) throw new Error("No teams found");

  // Create the first turn
  await supabase.from("turns").insert({
    session_id: sessionId,
    team_id: teams[0].id,
    round_number: 1,
    status: "waiting",
  });

  await supabase
    .from("sessions")
    .update({ status: "playing", current_team_index: 0, current_round: 1 })
    .eq("id", sessionId);
}

export async function endGame(sessionId: string): Promise<void> {
  await supabase
    .from("sessions")
    .update({ status: "ended" })
    .eq("id", sessionId);
}
