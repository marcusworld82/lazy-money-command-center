"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Brand, MarcoAgent, Run, Thread, ThreadMessage } from "@/lib/marco-types";
import { notifyWorker } from "@/lib/runtime/dispatch";
import { queueTurn } from "@/lib/runtime/repository";

const mapAgent = (r: Record<string, unknown>): MarcoAgent => ({ id: String(r.id), slug: String(r.slug ?? r.id), name: String(r.name), tagline: r.tagline as string | null, instructions: r.instructions as string | null, avatarColor: String(r.avatar_color ?? "#AD0000"), surfaces: (r.surfaces as MarcoAgent["surfaces"]) ?? ["chat"], modelReasoning: r.model_reasoning as string | null, modelFast: r.model_fast as string | null, modelRender: r.model_render as string | null, permissions: (r.permissions as MarcoAgent["permissions"]) ?? {}, canHandoffTo: (r.can_handoff_to as string[]) ?? [], status: String(r.status ?? "paused"), sortOrder: Number(r.sort_order ?? 0) });
const mapBrand = (r: Record<string, unknown>): Brand => ({ id: String(r.id), name: String(r.name), slug: String(r.slug), kind: r.kind as string | null, isActive: Boolean(r.is_active), colors: r.colors as Brand["colors"], voice: r.voice as Brand["voice"], audience: r.audience as string | null, offers: r.offers as string | null, restrictions: r.restrictions as string | null });
const mapThread = (r: Record<string, unknown>): Thread => ({ id: String(r.id), agentId: String(r.agent_id), brandId: r.brand_id as string | null, title: r.title as string | null, lastMessagePreview: r.last_message_preview as string | null, unread: Boolean(r.unread), updatedAt: String(r.updated_at) });
const mapRun = (r: Record<string, unknown>): Run => ({ id: String(r.id), shortId: String(r.short_id), agentId: r.agent_id as string | null, brandId: r.brand_id as string | null, threadId: r.thread_id as string | null, title: r.title as string | null, inputs: (r.inputs as Run["inputs"]) ?? {}, assetManifest: (r.asset_manifest as Run["assetManifest"]) ?? [], steps: (r.steps as Run["steps"]) ?? [], outputs: (r.outputs as Run["outputs"]) ?? [], status: r.status as Run["status"], approvalState: r.approval_state as Run["approvalState"], cost: r.cost == null ? null : Number(r.cost) });
const mapMessage = (r: Record<string, unknown>): ThreadMessage => ({ id: String(r.id), threadId: String(r.thread_id), runId: r.run_id as string | null, role: r.role as ThreadMessage["role"], agentId: r.agent_id as string | null, kind: r.kind as ThreadMessage["kind"], body: r.body as string | null, payload: r.payload as Record<string, unknown> | null, createdAt: String(r.created_at) });

export async function listMarcoAgents() { const { data, error } = await getSupabaseServerClient().from("agents").select("*").order("sort_order"); if (error) throw error; return (data ?? []).map((r) => mapAgent(r as Record<string, unknown>)); }
export async function getMarcoAgent(id: string) {
  const { data, error } = await getSupabaseServerClient().from("agents").select("*").eq("id", id).single();
  if (error) throw error;
  return mapAgent(data as Record<string, unknown>);
}
export async function listBrands() { const { data, error } = await getSupabaseServerClient().from("brands").select("*").order("is_active", { ascending: false }).order("name"); if (error) throw error; return (data ?? []).map((r) => mapBrand(r as Record<string, unknown>)); }
export async function setActiveBrand(id: string) {
  const supabase = getSupabaseServerClient();
  const { error: clearError } = await supabase.from("brands").update({ is_active: false }).neq("id", id);
  if (clearError) throw clearError;
  const { data, error } = await supabase.from("brands").update({ is_active: true }).eq("id", id).select("*").single();
  if (error) throw error;
  return mapBrand(data as Record<string, unknown>);
}
export async function listThreads() { const { data, error } = await getSupabaseServerClient().from("threads").select("*").order("updated_at", { ascending: false }); if (error) throw error; return (data ?? []).map((r) => mapThread(r as Record<string, unknown>)); }
export async function listMessages(threadId: string) { const { data, error } = await getSupabaseServerClient().from("messages").select("*").eq("thread_id", threadId).order("created_at"); if (error) throw error; return (data ?? []).map((r) => mapMessage(r as Record<string, unknown>)); }
export async function listRuns(threadId: string) { const { data, error } = await getSupabaseServerClient().from("runs").select("*").eq("thread_id", threadId).order("updated_at", { ascending: false }); if (error) throw error; return (data ?? []).map((r) => mapRun(r as Record<string, unknown>)); }

export async function createAgent(input: Partial<MarcoAgent> & Pick<MarcoAgent, "name">) {
  const supabase = getSupabaseServerClient();
  const slug = input.slug || input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data, error } = await supabase.from("agents").insert({ slug, name: input.name, tagline: input.tagline ?? null, instructions: input.instructions ?? null, avatar_color: input.avatarColor ?? "#AD0000", surfaces: input.surfaces ?? ["chat"], model_reasoning: input.modelReasoning ?? null, model_fast: input.modelFast ?? null, model_render: input.modelRender ?? null, permissions: input.permissions ?? { generate: "ask", publish: "never", write_knowledge: "ask", use_cli: "never", mcp_write: "ask", budget_cap_per_run: 5 }, can_handoff_to: input.canHandoffTo ?? [], status: "paused", sort_order: input.sortOrder ?? 999 }).select("*").single();
  if (error) throw error; return mapAgent(data as Record<string, unknown>);
}
export async function updateAgent(id: string, input: Partial<MarcoAgent>) { const { data, error } = await getSupabaseServerClient().from("agents").update({ name: input.name, tagline: input.tagline, instructions: input.instructions, avatar_color: input.avatarColor, surfaces: input.surfaces, model_reasoning: input.modelReasoning, model_fast: input.modelFast, model_render: input.modelRender, permissions: input.permissions, can_handoff_to: input.canHandoffTo }).eq("id", id).select("*").single(); if (error) throw error; return mapAgent(data as Record<string, unknown>); }
export async function createThread(agentId: string, brandId: string | null) { const { data, error } = await getSupabaseServerClient().from("threads").insert({ agent_id: agentId, brand_id: brandId, title: null }).select("*").single(); if (error) throw error; return mapThread(data as Record<string, unknown>); }
export async function sendThreadMessage(input: { threadId: string; agentId: string; body: string }) { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("messages").insert({ thread_id: input.threadId, agent_id: input.agentId, role: "user", kind: "text", body: input.body }).select("*").single(); if (error) throw error; await supabase.from("threads").update({ last_message_preview: input.body.slice(0, 140), updated_at: new Date().toISOString(), unread: false }).eq("id", input.threadId); return mapMessage(data as Record<string, unknown>); }
export async function createRuntimeTurn(input: { threadId: string; agentId: string; brandId?: string | null; request: string; title?: string }) {
  const supabase = getSupabaseServerClient();
  const { data: message, error: messageError } = await supabase.from("messages").insert({ thread_id: input.threadId, agent_id: input.agentId, role: "user", kind: "text", body: input.request }).select("*").single(); if (messageError) throw messageError;
  const shortId = `RUN-${Date.now().toString().slice(-6)}`;
  const { data: run, error: runError } = await supabase.from("runs").insert({ short_id: shortId, agent_id: input.agentId, thread_id: input.threadId, brand_id: input.brandId ?? null, title: input.title ?? input.request.slice(0, 80), inputs: { request: input.request }, status: "queued" }).select("*").single(); if (runError) throw runError;
  await supabase.from("threads").update({ last_message_preview: input.request.slice(0, 140), updated_at: new Date().toISOString(), unread: false }).eq("id", input.threadId);
  const dispatch = { runId: String(run.id), agentId: input.agentId, threadId: input.threadId, lane: "user" as const, request: input.request, sourceMessageId: String(message.id) };
  await queueTurn(dispatch); const worker = await notifyWorker(dispatch);
  return { message: mapMessage(message as Record<string, unknown>), run: mapRun(run as Record<string, unknown>), worker };
}
export async function saveBrand(input: Partial<Brand> & Pick<Brand, "name" | "slug">) { const supabase = getSupabaseServerClient(); const payload = { name: input.name, slug: input.slug, kind: input.kind ?? null, colors: input.colors ?? null, voice: input.voice ?? null, audience: input.audience ?? null, offers: input.offers ?? null, restrictions: input.restrictions ?? null, is_active: input.isActive ?? false }; const query = input.id ? supabase.from("brands").update(payload).eq("id", input.id) : supabase.from("brands").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; return mapBrand(data as Record<string, unknown>); }
