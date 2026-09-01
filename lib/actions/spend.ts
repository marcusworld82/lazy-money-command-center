"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SpendRange = "today" | "7" | "30" | "all";
function fromRange(range: SpendRange) { if (range === "all") return null; const date = new Date(); date.setDate(date.getDate() - (range === "today" ? 1 : Number(range))); return date.toISOString(); }

export async function getSpendSummary(range: SpendRange) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("model_usage_log").select("provider, model_name, cost, created_at, agent_id, run_id, agents(name, avatar_color), runs(short_id, outputs)").order("created_at", { ascending: false });
  const from = fromRange(range); if (from) query = query.gte("created_at", from);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const total = rows.reduce((sum, row) => sum + Number(row.cost ?? 0), 0);
  const byProvider = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.provider]: (acc[row.provider] ?? 0) + Number(row.cost ?? 0) }), {});
  const byAgent = rows.reduce<Record<string, { name: string; cost: number }>>((acc, row) => { const agent = Array.isArray(row.agents) ? row.agents[0] : row.agents; const key = row.agent_id ?? "unknown"; acc[key] = { name: agent?.name ?? "Unassigned", cost: (acc[key]?.cost ?? 0) + Number(row.cost ?? 0) }; return acc; }, {});
  const byModel = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.model_name ?? "Unknown"]: (acc[row.model_name ?? "Unknown"] ?? 0) + Number(row.cost ?? 0) }), {});
  const { data: budgetRecord } = await supabase.from("settings").select("value").eq("key", "generation_budget").maybeSingle();
  return { total, byProvider, byAgent: Object.values(byAgent).sort((a, b) => b.cost - a.cost), byModel: Object.entries(byModel).map(([name, cost]) => ({ name, cost })).sort((a, b) => b.cost - a.cost), recent: rows.slice(0, 10), budget: (budgetRecord?.value ?? { monthly_cap: null, hard_stop: false }) as { monthly_cap: number | null; hard_stop: boolean } };
}
