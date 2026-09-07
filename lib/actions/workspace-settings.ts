"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProviderStatus = { id: string; last4: string | null; configured: boolean };
export type ConnectionRecord = { id: string; name: string; kind: "mcp" | "cli"; target: string };
export type SyncRecord = { obsidianPath: string; supabaseUrl: string };

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
