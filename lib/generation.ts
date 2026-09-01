import "server-only";

import { complete } from "@/lib/openrouter";
import { queueGeneration } from "@/lib/fal";
import type { AssetManifestItem, Run, RunStep } from "@/lib/marco-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type BuildOverride = { model?: string; aspectRatio?: string; duration?: number; variations?: number; mode?: "text" | "image" | "video" };

function asSteps(value: unknown): RunStep[] { return Array.isArray(value) ? value as RunStep[] : []; }
function withRunningStep(steps: RunStep[], label: string) { return [...steps.map((step) => ({ ...step, status: step.status === "running" ? "done" : step.status })), { n: steps.length + 1, label, status: "running" as const, cost: 0 }]; }
function withFailedStep(steps: RunStep[], error: string) { return steps.map((step, index) => index === steps.length - 1 ? { ...step, status: "failed" as const, blocked_on: error } : step); }

async function resolveModel(agentId: string, override: BuildOverride) {
  const supabase = getSupabaseServerClient();
  if (override.model) return override.model;
  const { data: agent, error: agentError } = await supabase.from("agents").select("model_reasoning, model_fast, model_render, permissions").eq("id", agentId).single();
  if (agentError) throw agentError;
  const { data: defaults } = await supabase.from("settings").select("value").eq("key", "generation_defaults").maybeSingle();
  const defaultValues = (defaults?.value ?? {}) as Record<string, string | null>;
  const mode = override.mode ?? "image";
  const slot = mode === "text" ? "model_reasoning" : "model_render";
  const model = agent?.[slot] ?? defaultValues[slot];
  if (!model) throw new Error(`No ${mode} model is configured for this agent or globally.`);
  return model;
}

async function enforceBudget(agentId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("agents").select("permissions").eq("id", agentId).single();
  if (error) throw error;
  const cap = Number((data?.permissions as Record<string, unknown> | null)?.budget_cap_per_run);
  if (!Number.isFinite(cap) || cap <= 0) return;
  const { data: usage, error: usageError } = await supabase.from("model_usage_log").select("cost").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1);
  if (usageError) throw usageError;
  const latestCost = Number(usage?.[0]?.cost ?? 0);
  if (latestCost >= cap) throw new Error(`This agent's per-Run budget cap ($${cap.toFixed(2)}) has already been reached.`);
}

export async function executeRun(runId: string, override: BuildOverride) {
  const supabase = getSupabaseServerClient();
  const { data: rawRun, error: runError } = await supabase.from("runs").select("*").eq("id", runId).single();
  if (runError) throw runError;
  const run = rawRun as unknown as Run;
  if (!run.agentId) throw new Error("A Run needs an agent before it can execute.");
  const steps = withRunningStep(asSteps(rawRun.steps), "Generation requested");
  await supabase.from("runs").update({ status: "running", steps, inputs: { ...(rawRun.inputs as Record<string, unknown>), build_override: override } }).eq("id", runId);
  try {
    await enforceBudget(run.agentId);
    const model = await resolveModel(run.agentId, override);
    if (override.mode === "text") {
      const result = await complete({ model, runId, agentId: run.agentId, messages: [{ role: "user", content: run.title ?? "Complete this Run." }] });
      const completedSteps = steps.map((step, index) => index === steps.length - 1 ? { ...step, status: "done" as const, cost: result.usage.cost ?? 0 } : step);
      const outputs = [...(Array.isArray(rawRun.outputs) ? rawRun.outputs : []), { type: "text", content: result.content, model: result.model, cost: result.usage.cost }];
      await supabase.from("runs").update({ status: "completed", steps: completedSteps, outputs, cost: result.usage.cost }).eq("id", runId);
      return { status: "completed" as const, cost: result.usage.cost, outputs };
    }
    const result = await queueGeneration({ modelId: model, prompt: run.title ?? "", manifest: rawRun.asset_manifest as AssetManifestItem[], aspectRatio: override.aspectRatio, duration: override.duration, variations: override.variations, runId, agentId: run.agentId });
    const { error: jobError } = await supabase.from("generation_jobs").insert({ run_id: runId, agent_id: run.agentId, provider: "fal", model_name: model, fal_request_id: result.jobId, status: result.status, prompt: run.title, manifest: rawRun.asset_manifest });
    if (jobError) throw jobError;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    await supabase.from("runs").update({ status: "failed", steps: withFailedStep(steps, message) }).eq("id", runId);
    throw error;
  }
}
