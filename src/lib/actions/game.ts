"use server";

import { supabase } from "@/lib/supabase";
import { getSpaceType } from "@/lib/types";
import type { Turn, Prompt } from "@/lib/types";

export async function getCurrentTurn(
  sessionId: string
): Promise<Turn | null> {
  const { data } = await supabase
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function rollDice(
  turnId: string,
  sessionId: string,
  teamId: string
): Promise<{ diceValue: number; newPosition: number; spaceType: string }> {
  // Guard: only allow rolling if turn is in "waiting" state (prevents double-roll race)
  const { data: turnCheck } = await supabase
    .from("turns")
    .select("status, team_id")
    .eq("id", turnId)
    .single();

  if (!turnCheck || turnCheck.status !== "waiting") {
    throw new Error("Turn already rolled");
  }
  if (turnCheck.team_id !== teamId) {
    throw new Error("Not this team's turn");
  }

  // Server-authoritative dice roll
  const diceValue = Math.floor(Math.random() * 6) + 1;

  // Get current team position
  const { data: team } = await supabase
    .from("teams")
    .select("position")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Team not found");

  // Get session for board size
  const { data: session } = await supabase
    .from("sessions")
    .select("board_size")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error("Session not found");

  // Calculate new position (cap at board size)
  const newPosition = Math.min(team.position + diceValue, session.board_size);
  const spaceType = getSpaceType(newPosition);

  // Atomically claim this turn (prevents race condition)
  const { data: claimed, error: claimError } = await supabase
    .from("turns")
    .update({
      dice_value: diceValue,
      space_type: spaceType,
      status: "rolled",
    })
    .eq("id", turnId)
    .eq("status", "waiting")
    .select();

  if (claimError || !claimed || claimed.length === 0) {
    throw new Error("Turn already rolled by another player");
  }

  // Update team position
  await supabase
    .from("teams")
    .update({ position: newPosition })
    .eq("id", teamId);

  return { diceValue, newPosition, spaceType };
}

export async function selectPrompt(
  turnId: string,
  sessionId: string,
  spaceType: string
): Promise<Prompt> {
  // Guard: only select prompt if turn is in "rolled" state
  const { data: turnGuard } = await supabase
    .from("turns")
    .select("status")
    .eq("id", turnId)
    .single();

  if (!turnGuard || turnGuard.status !== "rolled") {
    throw new Error("Prompt already selected for this turn");
  }

  // Get already used prompt IDs for this session
  const { data: usedPrompts } = await supabase
    .from("prompt_history")
    .select("prompt_id")
    .eq("session_id", sessionId);

  const usedIds = (usedPrompts || []).map((p) => p.prompt_id);

  // Try to find a prompt of the specific type that hasn't been used
  let query = supabase
    .from("prompts")
    .select("*")
    .eq("type", spaceType)
    .eq("enabled", true);

  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }

  let { data: prompts } = await query;
  let isReuse = false;

  // Fallback: try any enabled prompt not yet used
  if (!prompts || prompts.length === 0) {
    let fallbackQuery = supabase
      .from("prompts")
      .select("*")
      .eq("enabled", true);

    if (usedIds.length > 0) {
      fallbackQuery = fallbackQuery.not("id", "in", `(${usedIds.join(",")})`);
    }

    const { data: fallbackPrompts } = await fallbackQuery;
    prompts = fallbackPrompts;
  }

  // Last resort: reuse any enabled prompt (skip history insert to avoid UNIQUE violation)
  if (!prompts || prompts.length === 0) {
    const { data: anyPrompts } = await supabase
      .from("prompts")
      .select("*")
      .eq("enabled", true);
    prompts = anyPrompts;
    isReuse = true;
  }

  if (!prompts || prompts.length === 0) {
    throw new Error("No prompts available. Add prompts in the Admin panel.");
  }

  // Pick a random prompt from the available ones
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Atomically claim this turn for prompting (prevents race condition)
  const { data: claimed, error: claimError } = await supabase
    .from("turns")
    .update({ prompt_id: prompt.id, status: "prompted" })
    .eq("id", turnId)
    .eq("status", "rolled")
    .select();

  if (claimError || !claimed || claimed.length === 0) {
    throw new Error("Prompt already selected by another player");
  }

  // Record in history (skip on reuse to avoid UNIQUE constraint violation)
  if (!isReuse) {
    await supabase.from("prompt_history").insert({
      session_id: sessionId,
      prompt_id: prompt.id,
    });
  }

  return prompt;
}

export async function completeTurn(
  turnId: string,
  sessionId: string
): Promise<void> {
  // Guard: only complete if turn is in "prompted" state (prevents double-complete)
  const { data: completed, error: completeError } = await supabase
    .from("turns")
    .update({ status: "completed" })
    .eq("id", turnId)
    .eq("status", "prompted")
    .select();

  if (completeError || !completed || completed.length === 0) {
    throw new Error("Turn already completed");
  }

  // Get session state
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error("Session not found");

  // Get teams
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_order");

  if (!teams || teams.length === 0) throw new Error("No teams found");

  // Calculate next team index
  const nextIndex = (session.current_team_index + 1) % teams.length;
  const isNewRound = nextIndex === 0;
  const nextRound = isNewRound
    ? session.current_round + 1
    : session.current_round;

  // Check if game should end
  if (isNewRound && nextRound > session.max_rounds) {
    await supabase
      .from("sessions")
      .update({ status: "ended" })
      .eq("id", sessionId);
    return;
  }

  // Update session
  await supabase
    .from("sessions")
    .update({
      current_team_index: nextIndex,
      current_round: nextRound,
    })
    .eq("id", sessionId);

  // Create next turn
  await supabase.from("turns").insert({
    session_id: sessionId,
    team_id: teams[nextIndex].id,
    round_number: nextRound,
    status: "waiting",
  });
}

export async function resetTurn(
  turnId: string,
  sessionId: string,
  teamId: string
): Promise<void> {
  // Reset team position change
  const { data: turn } = await supabase
    .from("turns")
    .select("dice_value")
    .eq("id", turnId)
    .single();

  if (turn?.dice_value) {
    const { data: team } = await supabase
      .from("teams")
      .select("position")
      .eq("id", teamId)
      .single();

    if (team) {
      await supabase
        .from("teams")
        .update({ position: Math.max(0, team.position - turn.dice_value) })
        .eq("id", teamId);
    }
  }

  // Clean up prompt_history if a prompt was used
  const { data: fullTurn } = await supabase
    .from("turns")
    .select("prompt_id")
    .eq("id", turnId)
    .single();

  if (fullTurn?.prompt_id) {
    await supabase
      .from("prompt_history")
      .delete()
      .eq("session_id", sessionId)
      .eq("prompt_id", fullTurn.prompt_id);
  }

  // Reset turn
  await supabase
    .from("turns")
    .update({
      dice_value: null,
      prompt_id: null,
      space_type: null,
      status: "waiting",
    })
    .eq("id", turnId);
}
