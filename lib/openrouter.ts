import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const CATALOG_TTL_MS = 60 * 60 * 1000;
let catalogCache: { expiresAt: number; models: OpenRouterModel[] } | null = null;

export type CompletionRequest = {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  runId?: string;
  agentId?: string;
  jsonMode?: boolean;
};

export type CompletionResult = {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number; cost: number | null };
  model: string;
};

export type OpenRouterModel = { id: string; name: string; description?: string; contextLength?: number };

type CompletionPayload = {
  choices?: { message?: { content?: string | null } }[];
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number | null };
  error?: { message?: string };
};

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter is not configured. Add OPENROUTER_API_KEY on the server.");
  return key;
}

async function writeUsage(input: { runId?: string; agentId?: string; model: string; tokens?: number; cost?: number | null; status: "ok" | "failed"; error?: string; latencyMs: number }) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("model_usage_log").insert({ provider: "openrouter", model_name: input.model, tokens_used: input.tokens ?? null, cost: input.cost ?? null, request_type: "text", run_id: input.runId ?? null, agent_id: input.agentId ?? null, status: input.status, error: input.error ?? null, latency_ms: input.latencyMs });
  if (error) throw error;
}

export async function listOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.models;
  const response = await fetch(`${OPENROUTER_URL}/models`, { headers: { Authorization: `Bearer ${apiKey()}` }, next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`OpenRouter model catalog failed (${response.status}).`);
  const data = await response.json() as { data?: { id: string; name?: string; description?: string; context_length?: number }[] };
  const models = (data.data ?? []).filter((model) => /claude|gpt|gemini|grok|kimi/i.test(`${model.id} ${model.name ?? ""}`)).map((model) => ({ id: model.id, name: model.name ?? model.id, description: model.description, contextLength: model.context_length }));
  catalogCache = { models, expiresAt: Date.now() + CATALOG_TTL_MS };
  return models;
}

export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  const startedAt = Date.now();
  let lastError = "OpenRouter request failed.";
  let retryable = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${OPENROUTER_URL}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", "X-OpenRouter-Metadata": "enabled" }, body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens, response_format: request.jsonMode ? { type: "json_object" } : undefined }) });
      const payload = await response.json() as CompletionPayload;
      if (!response.ok) {
        lastError = payload.error?.message ?? `OpenRouter request failed (${response.status}).`;
        retryable = response.status === 429 || response.status >= 500;
        if (attempt === 0 && retryable) { await new Promise((resolve) => setTimeout(resolve, 500)); continue; }
        throw new Error(lastError);
      }
      const usage = payload.usage ?? {};
      const result: CompletionResult = { content: payload.choices?.[0]?.message?.content ?? "", model: payload.model ?? request.model, usage: { promptTokens: usage.prompt_tokens ?? 0, completionTokens: usage.completion_tokens ?? 0, totalTokens: usage.total_tokens ?? 0, cost: usage.cost ?? null } };
      await writeUsage({ runId: request.runId, agentId: request.agentId, model: result.model, tokens: result.usage.totalTokens, cost: result.usage.cost, status: "ok", latencyMs: Date.now() - startedAt });
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (attempt === 0 && retryable) continue;
    }
  }
  await writeUsage({ runId: request.runId, agentId: request.agentId, model: request.model, status: "failed", error: lastError, latencyMs: Date.now() - startedAt });
  throw new Error(lastError);
}
