export const runtimeLanes = ["user", "agent", "automation", "background"] as const;
export type RuntimeLane = (typeof runtimeLanes)[number];
export type LaneStatus = "queued" | "running" | "paused" | "done" | "failed" | "cancelled";
export type PermissionMode = "always" | "ask" | "never";
export type ApprovalResolution = "allow_once" | "deny" | "always" | "never" | "expired";

export type HandoffPacket = { goal: string; state: string; evidence: string[]; constraints: string[]; acceptance: string[]; next_action: string; approval_required: boolean };
export type RuntimeDispatch = { runId: string; agentId: string; threadId: string; lane: RuntimeLane; request: string; sourceMessageId?: string };
export type ContextEnvelope = {
  identity: { id: string; name: string; tagline: string | null; instructions: string | null };
  brand: Record<string, unknown> | null;
  brief: Record<string, unknown>;
  recent_chat: { role: string; body: string | null; created_at: string }[];
  memory: { id: string; text: string; tier: "profile" | "log" | "note"; scope: string }[];
  manifest: unknown[];
  roster: { id: string; name: string; tagline: string | null }[];
  tools: { action: string; mode: PermissionMode }[];
  request: string;
  precedence: readonly string[];
};
