import type { ManifestRole } from "@/lib/manifest-roles";

export type AgentSurface = "chat" | "build";
export type PermissionMode = "always" | "ask" | "never";
export type RunStatus = "draft" | "running" | "needs_approval" | "completed" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "done" | "blocked" | "failed" | "skipped";
export type MessageKind = "text" | "handoff" | "approval" | "manifest" | "plan" | "status";

export interface MarcoAgent { id: string; slug: string; name: string; tagline: string | null; instructions: string | null; avatarColor: string; surfaces: AgentSurface[]; modelReasoning: string | null; modelFast: string | null; modelRender: string | null; permissions: Record<string, PermissionMode | number>; canHandoffTo: string[]; status: string; sortOrder: number; }
export interface Brand { id: string; name: string; slug: string; kind: string | null; isActive: boolean; colors: Record<string, string> | null; voice: Record<string, unknown> | null; audience: string | null; offers: string | null; restrictions: string | null; }
export interface Thread { id: string; agentId: string; brandId: string | null; title: string | null; lastMessagePreview: string | null; unread: boolean; updatedAt: string; }
export interface AssetManifestItem { asset_id: string; role: ManifestRole; order: number; extracted_text_ref?: string; }
export interface RunStep { n: number; label: string; status: StepStatus; cost: number; blocked_on?: string; }
export interface Run { id: string; shortId: string; agentId: string | null; brandId: string | null; threadId: string | null; title: string | null; inputs: Record<string, unknown>; assetManifest: AssetManifestItem[]; steps: RunStep[]; outputs: Record<string, unknown>[]; status: RunStatus; approvalState: "pending" | "approved" | "rejected" | null; cost: number | null; }
export interface ThreadMessage { id: string; threadId: string; runId: string | null; role: "user" | "agent" | "system"; agentId: string | null; kind: MessageKind; body: string | null; payload: Record<string, unknown> | null; createdAt: string; }
export interface MemoryFact { id: string; scope: "agent" | "brand" | "global"; scopeId: string | null; tier: "profile" | "log" | "note"; text: string; sourceType: string | null; learnedAt: string; lastUsedAt: string | null; active: boolean; }
export interface GenerationJob { id: string; runId: string | null; agentId: string | null; provider: "fal"; modelName: string; requestId: string | null; status: "queued" | "running" | "completed" | "failed"; outputs: Record<string, unknown>[]; cost: number | null; error: string | null; createdAt: string; completedAt: string | null; }
export interface GenerationDefaults { model_reasoning: string | null; model_fast: string | null; model_render: string | null; }
export interface GenerationBudget { monthly_cap: number | null; hard_stop: boolean; }
