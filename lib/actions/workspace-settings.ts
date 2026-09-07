"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProviderStatus = { id: string; last4: string | null; configured: boolean };
export type ConnectionRecord = { id: string; name: string; kind: "mcp" | "cli"; target: string };
export type SyncRecord = { obsidianPath: string; supabaseUrl: string };
export type ProviderModel = { id: string; name: string };

const FALLBACK_MODELS: Record<string, ProviderModel[]> = {
  OpenRouter: [
    { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6" },
    { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6" },
    { id: "openai/gpt-5", name: "GPT-5" },
    { id: "openai/gpt-4.1", name: "GPT-4.1" },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "x-ai/grok-4", name: "Grok 4" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick" },
  ],
  OpenAI: [
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "o3", name: "o3" },
  ],
  Anthropic: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
  ],
  fal: [
    { id: "fal-ai/flux/dev", name: "FLUX Dev" },
    { id: "fal-ai/kling-video/v2.1/standard/image-to-video", name: "Kling 2.1" },
    { id: "fal-ai/seedance", name: "Seedance" },
  ],
};

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await getSupabaseServerClient().from("settings").select("value").eq("key", key).maybeSingle();
    if (error || !data?.value) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}

async function writeSetting(key: string, value: unknown) {
  const { error } = await getSupabaseServerClient().from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function readSecret(id: string): Promise<string | null> {
  const value = await readSetting<{ key?: string }>(`secret:${id}`, {});
  return value.key ?? process.env[envName(id)] ?? null;
}

function envName(id: string) {
  if (id === "openai") return "OPENAI_API_KEY";
  if (id === "anthropic") return "ANTHROPIC_API_KEY";
  if (id === "fal") return "FAL_KEY";
  return "OPENROUTER_API_KEY";
}

export async function listProviderStatus(): Promise<ProviderStatus[]> {
  return readSetting<ProviderStatus[]>("provider_status", []);
}

export async function saveProviderKey(id: string, key: string) {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("Paste an API key first.");
  const last4 = trimmed.slice(-4);
  const status = await listProviderStatus();
  const next = [...status.filter((item) => item.id !== id), { id, last4, configured: true }];
  await writeSetting(`secret:${id}`, { key: trimmed, last4 });
  await writeSetting("provider_status", next);
  return { id, last4, configured: true };
}

export async function testProviderKey(id: string): Promise<{ ok: boolean; message: string; models?: number }> {
  const key = await readSecret(id);
  if (!key) return { ok: false, message: "No key saved for this provider." };
  if (id === "openrouter") {
    const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return { ok: false, message: `OpenRouter rejected the key (${response.status}).` };
    const payload = await response.json() as { data?: unknown[] };
    return { ok: true, message: "OpenRouter key is live.", models: payload.data?.length ?? 0 };
  }
  return { ok: true, message: "Key is saved. Live probe is only wired for OpenRouter right now." };
}

export async function listProviderModels(provider: string): Promise<{ configured: boolean; models: ProviderModel[] }> {
  const id = provider === "OpenAI" ? "openai" : provider === "Anthropic" ? "anthropic" : provider === "fal" ? "fal" : "openrouter";
  const fallback = FALLBACK_MODELS[provider] ?? FALLBACK_MODELS.OpenRouter;
  const key = await readSecret(id);
  if (provider !== "OpenRouter" || !key) return { configured: Boolean(key), models: fallback };
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return { configured: true, models: fallback };
    const payload = await response.json() as { data?: Array<{ id: string; name?: string }> };
    const models = (payload.data ?? []).map((item) => ({ id: item.id, name: item.name || item.id })).slice(0, 80);
    return { configured: true, models: models.length ? models : fallback };
  } catch {
    return { configured: Boolean(key), models: fallback };
  }
}

export async function listConnections(): Promise<ConnectionRecord[]> {
  return readSetting<ConnectionRecord[]>("connections", [
    { id: "openart-mcp", name: "OpenArt MCP", kind: "mcp", target: "" },
    { id: "higgsfield-cli", name: "Higgsfield CLI", kind: "cli", target: "" },
  ]);
}

export async function saveConnection(record: ConnectionRecord) {
  const current = await listConnections();
  const next = [...current.filter((item) => item.id !== record.id), record];
  await writeSetting("connections", next);
  return record;
}

export async function listSync(): Promise<SyncRecord> {
  return readSetting<SyncRecord>("sync", { obsidianPath: "", supabaseUrl: "" });
}

export async function saveSync(record: SyncRecord) {
  await writeSetting("sync", record);
  return record;
}
