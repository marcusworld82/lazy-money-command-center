export type RuntimeLane = "user" | "agent" | "automation" | "background";
export type RuntimeDispatch = { runId: string; agentId: string; lane: RuntimeLane; request: string };
