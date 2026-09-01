import type { Brand, MarcoAgent, Run, Thread, ThreadMessage } from "@/lib/marco-types";

export const demoBrands: Brand[] = [
  { id: "demo-coad", name: "COAD", slug: "coad", kind: "apparel", isActive: true, colors: null, voice: null, audience: "Streetwear collectors", offers: null, restrictions: null },
  { id: "demo-lmc", name: "Lazy Money", slug: "lazy-money", kind: "media", isActive: false, colors: null, voice: null, audience: "Creators", offers: null, restrictions: null },
  { id: "demo-client", name: "Client work", slug: "client-work", kind: "services", isActive: false, colors: null, voice: null, audience: "Client teams", offers: null, restrictions: null },
];

export const demoAgents: MarcoAgent[] = [
  { id: "demo-chief", slug: "chief", name: "Chief", tagline: "routes the work, reports back", instructions: null, avatarColor: "#7FD1B9", surfaces: ["chat"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 1 },
  { id: "demo-atelier", slug: "atelier", name: "Atelier", tagline: "apparel design and product", instructions: null, avatarColor: "#AD0000", surfaces: ["chat", "build", "canvas"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 2 },
  { id: "demo-studio", slug: "studio", name: "Studio", tagline: "images and video", instructions: null, avatarColor: "#FF3D8A", surfaces: ["chat", "build", "canvas"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 3 },
  { id: "demo-voice", slug: "voice", name: "Voice", tagline: "every word that ships", instructions: null, avatarColor: "#E8C468", surfaces: ["chat", "build"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 4 },
  { id: "demo-social", slug: "social", name: "Social", tagline: "scheduling and platforms", instructions: null, avatarColor: "#6FA8FF", surfaces: ["chat", "build", "canvas"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 5 },
  { id: "demo-builder", slug: "builder", name: "Builder", tagline: "planner plus executor for code", instructions: null, avatarColor: "#9B8CFF", surfaces: ["chat", "build"], modelReasoning: null, modelFast: null, modelRender: null, permissions: {}, canHandoffTo: [], status: "paused", sortOrder: 6 },
];

export const demoThreads: Thread[] = demoAgents.map((agent, index) => ({ id: `demo-thread-${agent.slug}`, agentId: agent.id, brandId: "demo-coad", title: `${agent.name} thread`, lastMessagePreview: ["routed the hoodie brief to Atelier", "3 hoodie directions up, voice handoff sent", "seedance queue ready, 41 assets in manifest", "campaign copy back to Atelier", "9 posts staged for next week", "PR open, waiting on your review"][index], unread: index === 1 || index === 4, updatedAt: new Date(Date.now() - index * 22 * 60_000).toISOString() }));

export const demoMessages: ThreadMessage[] = [
  { id: "demo-message-1", threadId: "demo-thread-atelier", runId: "demo-run-0114", role: "user", agentId: "demo-atelier", kind: "text", body: "Fall drop for COAD. Heavyweight hoodie, three directions. Same story as the last lookbook.", payload: null, createdAt: new Date().toISOString() },
  { id: "demo-message-2", threadId: "demo-thread-atelier", runId: "demo-run-0114", role: "agent", agentId: "demo-atelier", kind: "text", body: "Pulled the COAD brand record: palette, boxy fit block, and washed heavyweight fleece. Three directions below; copy belongs with Voice.", payload: null, createdAt: new Date().toISOString() },
  { id: "demo-message-3", threadId: "demo-thread-atelier", runId: "demo-run-0114", role: "agent", agentId: "demo-atelier", kind: "handoff", body: "Handoff to Voice: campaign lines for three hoodie directions. No hype language; keep it short.", payload: null, createdAt: new Date().toISOString() },
  { id: "demo-message-4", threadId: "demo-thread-atelier", runId: "demo-run-0114", role: "agent", agentId: "demo-voice", kind: "text", body: "Two lines per direction are back in the thread. One draft was flagged as too close to a June caption.", payload: null, createdAt: new Date().toISOString() },
];

export const demoRun: Run = { id: "demo-run-0114", shortId: "0114", agentId: "demo-atelier", brandId: "demo-coad", threadId: "demo-thread-atelier", title: "COAD heavyweight hoodie directions", inputs: {}, assetManifest: Array.from({ length: 41 }, (_, index) => ({ asset_id: `demo-asset-${index}`, role: "reference" as const, order: index })), steps: [{ n: 1, label: "Brief read, COAD context loaded", status: "done", cost: 0 }, { n: 2, label: "3 directions designed", status: "done", cost: 0 }, { n: 3, label: "Handoff to Voice, copy returned", status: "done", cost: 0 }, { n: 4, label: "Render, blocked on your approval", status: "blocked", cost: 0 }, { n: 5, label: "Stage to Social", status: "pending", cost: 0 }], outputs: Array.from({ length: 4 }, (_, index) => ({ id: `dir-${index + 1}`, label: `dir_0${index + 1}` })), status: "needs_approval", approvalState: "pending", cost: null };
