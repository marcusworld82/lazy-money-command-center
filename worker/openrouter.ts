import { runtimeDb } from "../lib/runtime/repository";

export async function completeRuntimeTurn(input: { model: string; system: string; request: string; runId: string; agentId: string }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured on the worker.");
  const startedAt = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: input.model, messages: [{ role: "system", content: input.system }, { role: "user", content: input.request }] }) });
  const payload = await response.json() as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number; cost?: number }; error?: { message?: string } };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const errorText = payload.error?.message ?? (!response.ok ? `OpenRouter request failed (${response.status}).` : "");
  const { error } = await runtimeDb().from("model_usage_log").insert({ provider: "openrouter", model_name: input.model, tokens_used: payload.usage?.total_tokens ?? null, cost: payload.usage?.cost ?? null, request_type: "text", run_id: input.runId, agent_id: input.agentId, status: response.ok ? "ok" : "failed", error: errorText || null, latency_ms: Date.now() - startedAt });
  if (error) throw new Error(error.message);
  if (!response.ok || !content) throw new Error(errorText || "OpenRouter returned no content.");
  return { content, cost: payload.usage?.cost ?? null };
}
