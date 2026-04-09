export type PromptType = "move" | "talk" | "create" | "wildcard";

export type SessionStatus = "lobby" | "playing" | "ended";

export type TurnStatus = "waiting" | "rolled" | "prompted" | "completed";

export interface Prompt {
  id: string;
  type: PromptType;
  text: string;
  enabled: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  join_code: string;
  status: SessionStatus;
  current_team_index: number;
  current_round: number;
  max_rounds: number;
  board_size: number;
  created_at: string;
}

export interface Team {
  id: string;
  session_id: string;
  name: string;
  color: string;
  turn_order: number;
  position: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  team_id: string | null;
  name: string;
  is_captain: boolean;
  created_at: string;
}

export interface Turn {
  id: string;
  session_id: string;
  team_id: string;
  round_number: number;
  dice_value: number | null;
  prompt_id: string | null;
  space_type: PromptType | null;
  status: TurnStatus;
  created_at: string;
}

export interface PromptHistory {
  id: string;
  session_id: string;
  prompt_id: string;
  used_at: string;
}

// Board space types mapped by position
export const SPACE_TYPES: PromptType[] = ["move", "talk", "create", "wildcard"];

export function getSpaceType(position: number): PromptType {
  // Cycle through types: 1=move, 2=talk, 3=create, 4=wildcard, 5=move...
  // Position 0 is start
  if (position === 0) return "move";
  return SPACE_TYPES[(position - 1) % 4];
}

export const TEAM_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];
