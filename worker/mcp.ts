import { audit, runtimeDb } from "../lib/runtime/repository";

/** Resolves a scoped MCP grant. Transport calls must go through a configured worker proxy. */
export async function resolveMcpGrant(input: { agentId: string; runId: string; serverId: string; write: boolean }) {
  const { data, error } = await runtimeDb().from("agent_mcp_grants").select("can_read, can_write, mcp_servers(name, enabled, status, tools)").eq("agent_id", input.agentId).eq("server_id", input.serverId).maybeSingle();
  if (error) throw error;
  const server = (data?.mcp_servers as { name: string; enabled: boolean; status: string; tools: unknown[] }[] | null)?.[0];
  const allowed = Boolean(data && server?.enabled && server.status === "connected" && (input.write ? data.can_write : data.can_read));
  await audit({ agentId: input.agentId, runId: input.runId, action: "mcp_access", target: server?.name ?? input.serverId, decision: allowed ? "granted" : "denied", detail: { write: input.write } });
  if (!allowed) throw new Error("This agent does not have the required MCP grant.");
  return server;
}
