"use server";

import { supabase } from "@/lib/supabase";
import type { Prompt, PromptType } from "@/lib/types";

export async function getPrompts(
  type?: PromptType
): Promise<Prompt[]> {
  let query = supabase.from("prompts").select("*").order("created_at", { ascending: false });
  if (type) {
    query = query.eq("type", type);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createPrompt(
  type: PromptType,
  text: string
): Promise<Prompt> {
  const { data, error } = await supabase
    .from("prompts")
    .insert({ type, text, enabled: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePrompt(
  id: string,
  updates: { type?: PromptType; text?: string; enabled?: boolean }
): Promise<Prompt> {
  const { data, error } = await supabase
    .from("prompts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function togglePrompt(
  id: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from("prompts")
    .update({ enabled })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from("prompts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
