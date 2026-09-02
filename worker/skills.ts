import { runtimeDb, audit } from "../lib/runtime/repository";

/** Retrieves only enabled skills for this agent, budgets instructions, and records the active set. */
export async function activeSkills(input: { agentId: string; runId: string; request: string; maxChars?: number }) {
  const maxChars = input.maxChars ?? 6000;
  const { data, error } = await runtimeDb().from("agent_skills").select("skill_id, skills(id, instruction, triggers, status)").eq("agent_id", input.agentId).eq("enabled", true);
  if (error) throw error;
  const selected: { id: string; instruction: string; trigger: string | null }[] = [];
  let used = 0;
  for (const row of data ?? []) {
    const relation = row.skills as { id: string; instruction: string; triggers: string[]; status: string }[] | null;
    const skill = relation?.[0] ?? null;
    if (!skill || skill.status !== "installed") continue;
    const trigger = (skill.triggers ?? []).find((item) => input.request.toLowerCase().includes(item.toLowerCase())) ?? null;
    if ((skill.triggers ?? []).length && !trigger) continue;
    if (used + skill.instruction.length > maxChars) continue;
    used += skill.instruction.length; selected.push({ id: skill.id, instruction: skill.instruction, trigger });
  }
  if (selected.length) { const { error: activationError } = await runtimeDb().from("skill_activations").insert(selected.map((skill) => ({ run_id: input.runId, agent_id: input.agentId, skill_id: skill.id, matched_trigger: skill.trigger }))); if (activationError) throw activationError; await audit({ agentId: input.agentId, runId: input.runId, action: "skills_activated", decision: "committed", detail: { skill_ids: selected.map((skill) => skill.id) } }); }
  return selected;
}
