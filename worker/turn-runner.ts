import { appendMessage, audit, completeRun, createApproval, failRun, getAgent, getTurn, saveContext, setLaneStatus } from "../lib/runtime/repository";
import { buildContext } from "./context";
import { completeRuntimeTurn } from "./openrouter";
import { decidePermission } from "./permissions";
import { activeSkills } from "./skills";

function systemPrompt(context: Awaited<ReturnType<typeof buildContext>>) { return `${context.identity.name}\n${context.identity.instructions ?? ""}\n\nBrand: ${JSON.stringify(context.brand)}\nBrief: ${JSON.stringify(context.brief)}\nRecent transcript: ${JSON.stringify(context.recent_chat)}\nMemory: ${JSON.stringify(context.memory)}\nRespond directly and concisely. Do not claim tools were used unless the host executed them.`; }

export async function runTurn(lane: Record<string, unknown>) {
  const runId = String(lane.run_id), agentId = String(lane.agent_id), threadId = String(lane.thread_id), request = String(lane.request);
  const [run, agent] = await Promise.all([getTurn(runId), getAgent(agentId)]);
  if (String(run.status) === "cancelled") { await setLaneStatus(String(lane.id), "cancelled", { interruptReason: "run_cancelled" }); return; }
  const context = await buildContext({ agentId, brandId: run.brand_id ? String(run.brand_id) : null, threadId, runId, request });
  const skills = await activeSkills({ agentId, runId, request });
  await saveContext(runId, context);
  const permissions = (agent.permissions as Record<string, unknown> | null) ?? {};
  const requestedAction = request.startsWith("/generate") ? "generate" : null;
  if (requestedAction) {
    const decision = decidePermission(permissions, requestedAction);
    if (decision === "never") { await audit({ agentId, runId, action: requestedAction, decision: "never" }); await appendMessage({ threadId, agentId, runId, role: "agent", body: "That action is blocked by this agent’s permissions." }); await setLaneStatus(String(lane.id), "done"); return; }
    if (decision === "ask") { await createApproval({ runId, agentId, action: requestedAction, detail: { request, thread_id: threadId } }); await setLaneStatus(String(lane.id), "paused"); return; }
  }
  const model = typeof agent.model_reasoning === "string" && agent.model_reasoning ? agent.model_reasoning : typeof agent.model_fast === "string" && agent.model_fast ? agent.model_fast : null;
  if (!model) { const reason = "This agent has no reasoning or fast model selected in its settings."; await failRun(runId, reason); await appendMessage({ threadId, agentId, runId, role: "agent", body: reason }); await setLaneStatus(String(lane.id), "failed", { error: reason }); return; }
  await audit({ agentId, runId, action: "model_call", target: model, decision: "user_requested" });
  const skillInstructions = skills.length ? `\n\nActive skills:\n${skills.map((skill) => skill.instruction).join("\n\n")}` : "";
  const result = await completeRuntimeTurn({ model, system: `${systemPrompt(context)}${skillInstructions}`, request, runId, agentId });
  await appendMessage({ threadId, agentId, runId, role: "agent", body: result.content });
  await completeRun(runId, result.content, result.cost);
  await setLaneStatus(String(lane.id), "done");
  await audit({ agentId, runId, action: "publish_transcript", decision: "committed" });
}
