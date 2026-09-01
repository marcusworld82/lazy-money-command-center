"use server";

import { executeRun } from "@/lib/generation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function startGeneration(input: { runId: string; model?: string; aspectRatio?: string; duration?: number; variations?: number; mode?: "text" | "image" | "video" }) {
  return executeRun(input.runId, input);
}

export async function createRun(input: { agentId: string; threadId: string; brandId?: string | null; title: string }) {
  const supabase = getSupabaseServerClient();
  const shortId = `RUN-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase.from("runs").insert({ short_id: shortId, agent_id: input.agentId, thread_id: input.threadId, brand_id: input.brandId ?? null, title: input.title, status: "draft" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateRunManifest(runId: string, manifest: unknown[]) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("runs").update({ asset_manifest: manifest }).eq("id", runId).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveAssetBundle(input: { name: string; brandId?: string; manifest: unknown[] }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("asset_bundles").insert({ name: input.name, brand_id: input.brandId ?? null, manifest: input.manifest }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listAssetBundles(brandId?: string) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("asset_bundles").select("*").order("updated_at", { ascending: false });
  if (brandId) query = query.eq("brand_id", brandId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
