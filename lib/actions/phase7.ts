"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { importSkillFile, type ImportedSkill } from "@/lib/skills/import";

type Row = Record<string, unknown>;
const db = () => getSupabaseServerClient();
function uniqueSlug(value: string) { return `${value}-${Date.now().toString(36)}`; }

export async function listSkills() { const { data, error } = await db().from("skills").select("*, agent_skills(agent_id, enabled)").order("updated_at", { ascending: false }); if (error) throw error; return (data ?? []) as Row[]; }
export async function saveImportedSkill(input: ImportedSkill, agentIds: string[]) {
  const { data, error } = await db().from("skills").insert({ ...input, slug: uniqueSlug(input.slug), status: "draft" }).select("*").single();
  if (error) throw error;
  if (agentIds.length) { const { error: grantError } = await db().from("agent_skills").insert(agentIds.map((agentId) => ({ agent_id: agentId, skill_id: data.id, enabled: true }))); if (grantError) throw grantError; }
  return data as Row;
}
export async function importSkillFromText(input: { name: string; markdown: string; agentIds: string[] }) { return saveImportedSkill(importSkillFile({ name: input.name, text: input.markdown }), input.agentIds); }
export async function setSkillStatus(id: string, status: "draft" | "installed" | "disabled") { const { data, error } = await db().from("skills").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single(); if (error) throw error; return data as Row; }
export async function setAgentSkill(input: { agentId: string; skillId: string; enabled: boolean }) { const { error } = await db().from("agent_skills").upsert({ agent_id: input.agentId, skill_id: input.skillId, enabled: input.enabled }); if (error) throw error; }
export async function listLearningProposals() { const { data, error } = await db().from("learning_proposals").select("*, agents(name, avatar_color), runs(short_id)").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as Row[]; }
export async function resolveLearningProposal(id: string, status: "approved" | "rejected") { const { data, error } = await db().from("learning_proposals").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending").select("*").single(); if (error) throw error; return data as Row; }
export async function listMcpServers() { const { data, error } = await db().from("mcp_servers").select("*, agent_mcp_grants(agent_id, can_read, can_write)").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as Row[]; }
export async function saveMcpServer(input: { id?: string; name: string; url: string; transport: "http" | "stdio"; authRef?: string | null; tools?: unknown[]; enabled?: boolean; status?: string }) { const payload = { name: input.name, url: input.url, transport: input.transport, auth_ref: input.authRef ?? null, tools: input.tools ?? [], enabled: input.enabled ?? false, status: input.status ?? "disconnected" }; const query = input.id ? db().from("mcp_servers").update(payload).eq("id", input.id) : db().from("mcp_servers").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; return data as Row; }
export async function setMcpGrant(input: { agentId: string; serverId: string; canRead: boolean; canWrite: boolean }) { const { error } = await db().from("agent_mcp_grants").upsert({ agent_id: input.agentId, server_id: input.serverId, can_read: input.canRead, can_write: input.canWrite }); if (error) throw error; }
export async function listCliRunners() { const { data, error } = await db().from("cli_runners").select("*").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as Row[]; }
export async function saveCliRunner(input: { id?: string; name: string; kind: string; enabled: boolean }) { const payload = { name: input.name, kind: input.kind, enabled: input.enabled, status: input.enabled ? "connected" : "disconnected" }; const query = input.id ? db().from("cli_runners").update(payload).eq("id", input.id) : db().from("cli_runners").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; return data as Row; }
export async function getChiefStatus() {
  const [agents, runs, approvals] = await Promise.all([db().from("agents").select("id, name, status, role_key"), db().from("runs").select("agent_id, status, updated_at"), db().from("approval_requests").select("agent_id").is("resolved_at", null)]);
  if (agents.error || runs.error || approvals.error) throw agents.error ?? runs.error ?? approvals.error;
  const rows = (agents.data ?? []).filter((agent) => agent.role_key !== "chief").map((agent) => { const agentRuns = (runs.data ?? []).filter((run) => run.agent_id === agent.id); return { agentId: agent.id, name: agent.name, status: agent.status, activeRuns: agentRuns.filter((run) => ["queued", "running", "needs_approval"].includes(run.status)).length, blocked: agentRuns.filter((run) => run.status === "needs_approval").length, decisions: (approvals.data ?? []).filter((approval) => approval.agent_id === agent.id).length }; });
  return { agents: rows, summary: `${rows.reduce((sum, row) => sum + row.activeRuns, 0)} active runs, ${rows.reduce((sum, row) => sum + row.blocked, 0)} blocked, ${rows.reduce((sum, row) => sum + row.decisions, 0)} decisions waiting.` };
}
export async function getBrandImpactReport(brandId: string) { const [brand, runs] = await Promise.all([db().from("brands").select("id, name").eq("id", brandId).single(), db().from("runs").select("id, status, title").eq("brand_id", brandId)]); if (brand.error || runs.error) throw brand.error ?? runs.error; return { brand: brand.data, approvedArtifacts: (runs.data ?? []).filter((run) => run.status === "completed").length, pendingRuns: (runs.data ?? []).filter((run) => ["queued", "running", "needs_approval"].includes(run.status)).length, affectedRuns: (runs.data ?? []).map((run) => ({ id: run.id, title: run.title, status: run.status })), propagationRequired: false }; }
