"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MemoryFact } from "@/lib/marco-types";

const mapMemoryFact = (row: Record<string, unknown>): MemoryFact => ({
  id: String(row.id),
  scope: row.scope as MemoryFact["scope"],
  scopeId: row.scope_id as string | null,
  tier: row.tier as MemoryFact["tier"],
  text: String(row.text),
  sourceType: row.source_type as string | null,
  learnedAt: String(row.learned_at),
  lastUsedAt: row.last_used_at as string | null,
  active: Boolean(row.active),
});

/** Returns active runtime memory only. The browser never receives database credentials. */
export async function listMemoryFacts() {
  const { data, error } = await getSupabaseServerClient()
    .from("memory_facts")
    .select("id, scope, scope_id, tier, text, source_type, learned_at, last_used_at, active")
    .eq("active", true)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("learned_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => mapMemoryFact(row as Record<string, unknown>));
}
