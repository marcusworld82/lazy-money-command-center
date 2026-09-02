import { audit, createApproval, runtimeDb } from "../lib/runtime/repository";
import { decidePermission } from "./permissions";

const destructive = /\b(rm|rmdir|drop|truncate|delete|reset\s+--hard|force\s+push)\b/i;

/** CLI commands are delegated to the configured remote worker sandbox, never executed on this host. */
export async function executeSandboxedCli(input: { agentId: string; runId: string; runnerId: string; command: string; permissions: Record<string, unknown> }) {
  const db = runtimeDb();
  const { data: runner, error } = await db.from("cli_runners").select("*").eq("id", input.runnerId).eq("enabled", true).maybeSingle();
  if (error) throw error;
  if (!runner) throw new Error("This CLI runner is not enabled.");
  const decision = destructive.test(input.command) ? "ask" : decidePermission(input.permissions, "use_cli");
  const { data: log, error: logError } = await db.from("cli_command_log").insert({ runner_id: input.runnerId, agent_id: input.agentId, run_id: input.runId, command: input.command, status: decision === "always" ? "running" : "blocked" }).select("*").single();
  if (logError) throw logError;
  if (decision !== "always") { await createApproval({ runId: input.runId, agentId: input.agentId, action: "use_cli", target: String(runner.name), detail: { command: input.command, command_log_id: log.id } }); await audit({ agentId: input.agentId, runId: input.runId, action: "cli_command", target: String(runner.name), decision, detail: { command_log_id: log.id } }); return { status: "blocked" as const, logId: String(log.id) }; }
  const url = process.env.MARCO_CLI_SANDBOX_URL, secret = process.env.MARCO_WORKER_SECRET;
  if (!url || !secret) { await db.from("cli_command_log").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", log.id); throw new Error("No worker sandbox is configured for CLI execution."); }
  const response = await fetch(`${url.replace(/\/$/, "")}/execute`, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ runner: runner.kind, command: input.command, runId: input.runId, agentId: input.agentId }) });
  const result = await response.json().catch(() => ({})) as { exitCode?: number };
  const status = response.ok && typeof result.exitCode === "number" && result.exitCode === 0 ? "completed" : "failed";
  await db.from("cli_command_log").update({ status, exit_code: result.exitCode ?? null, completed_at: new Date().toISOString() }).eq("id", log.id);
  await audit({ agentId: input.agentId, runId: input.runId, action: "cli_command", target: String(runner.name), decision: status, detail: { command_log_id: log.id, exit_code: result.exitCode ?? null } });
  return { status, logId: String(log.id), exitCode: result.exitCode ?? null };
}
