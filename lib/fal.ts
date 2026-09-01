import "server-only";

import { getFalModelAdapter } from "@/lib/fal-models";
import type { AssetManifestItem } from "@/lib/marco-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const FAL_QUEUE_URL = "https://queue.fal.run";
const CATALOG_TTL_MS = 60 * 60 * 1000;
let catalogCache: { expiresAt: number; models: { id: string; name: string }[] } | null = null;

export type GenerationRequest = { modelId: string; prompt: string; manifest?: AssetManifestItem[]; aspectRatio?: string; duration?: number; variations?: number; runId?: string; agentId?: string; };
export type GenerationResult = { jobId: string; status: "queued" | "running" | "completed" | "failed"; outputs: { url: string; type: "image" | "video"; width?: number; height?: number }[]; cost: number | null; };

function apiKey() { const key = process.env.FAL_KEY; if (!key) throw new Error("fal is not configured. Add FAL_KEY on the server."); return key; }

export async function listFalModels() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.models;
  const response = await fetch("https://fal.ai/api/models", { headers: { Authorization: `Key ${apiKey()}` }, next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`fal model catalog failed (${response.status}).`);
  const data = await response.json() as { models?: { id?: string; name?: string }[]; data?: { id?: string; name?: string }[] };
  const models = (data.models ?? data.data ?? []).flatMap((item) => item.id ? [{ id: item.id, name: item.name ?? item.id }] : []);
  catalogCache = { models, expiresAt: Date.now() + CATALOG_TTL_MS };
  return models;
}

async function resolveManifest(manifest: AssetManifestItem[]) {
  const supabase = getSupabaseServerClient();
  if (!manifest.length) return { references: [] as string[], documentText: "" };
  const ids = manifest.map((entry) => entry.asset_id);
  const { data, error } = await supabase.from("assets").select("id, type, storage_path, extracted_text").in("id", ids);
  if (error) throw error;
  const byId = new Map((data ?? []).map((asset) => [asset.id, asset]));
  const references: string[] = [];
  const documents: string[] = [];
  for (const entry of [...manifest].sort((a, b) => a.order - b.order)) {
    const asset = byId.get(entry.asset_id); if (!asset) continue;
    if (entry.role === "document" || asset.type === "document") { if (asset.extracted_text) documents.push(asset.extracted_text); continue; }
    const { data: signed, error: signedError } = await supabase.storage.from("assets").createSignedUrl(asset.storage_path, 60 * 60);
    if (signedError) throw signedError;
    if (signed?.signedUrl) references.push(signed.signedUrl);
  }
  return { references, documentText: documents.join("\n\n") };
}

export async function queueGeneration(request: GenerationRequest): Promise<GenerationResult> {
  const manifest = request.manifest ?? [];
  const adapter = getFalModelAdapter(request.modelId);
  const unsupported = manifest.filter((entry) => !adapter.accepts.includes(entry.role) && entry.role !== "document");
  if (unsupported.length) throw new Error(`This model cannot accept ${unsupported.length} selected manifest item(s). Retag or remove them before running.`);
  const referenceEntries = manifest.filter((entry) => entry.role !== "document");
  if (referenceEntries.length > adapter.referenceCap) throw new Error(`This model accepts ${adapter.referenceCap} references; ${referenceEntries.slice(adapter.referenceCap).map((entry) => entry.asset_id).join(", ")} would be dropped. Confirm a reduced manifest first.`);
  const resolved = await resolveManifest(manifest);
  const prompt = resolved.documentText ? `${request.prompt}\n\nDocument context:\n${resolved.documentText}` : request.prompt;
  const response = await fetch(`${FAL_QUEUE_URL}/${request.modelId}`, { method: "POST", headers: { Authorization: `Key ${apiKey()}`, "Content-Type": "application/json" }, body: JSON.stringify(adapter.mapInput({ prompt, aspectRatio: request.aspectRatio, duration: request.duration, references: resolved.references })) });
  if (!response.ok) throw new Error(`fal queue request failed (${response.status}).`);
  const data = await response.json() as { request_id?: string };
  if (!data.request_id) throw new Error("fal did not return a request ID.");
  return { jobId: data.request_id, status: "queued", outputs: [], cost: null };
}

export async function pollGeneration(modelId: string, requestId: string): Promise<GenerationResult> {
  const response = await fetch(`${FAL_QUEUE_URL}/${modelId}/requests/${requestId}/status`, { headers: { Authorization: `Key ${apiKey()}` } });
  if (!response.ok) throw new Error(`fal status request failed (${response.status}).`);
  const data = await response.json() as { status?: string; error?: string };
  const status = data.status === "COMPLETED" ? "completed" : data.status === "IN_PROGRESS" ? "running" : data.status === "IN_QUEUE" ? "queued" : "failed";
  if (status === "failed") throw new Error(data.error ?? "fal generation failed.");
  return { jobId: requestId, status, outputs: [], cost: null };
}
