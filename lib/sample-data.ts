// Placeholder content for pages/sections still out of scope (Content Command,
// Auto-Engage, Spend & Usage, Agents, Knowledge Library, and each workspace's
// bespoke non-Project sections). Projects/Tasks/Notes/Assets/Workflows are real
// data now — see lib/providers/app-data-provider.tsx and lib/actions/*.

export interface KnowledgeNode {
  id: string;
  label: string;
  children?: KnowledgeNode[];
}

export const KNOWLEDGE_TREE: KnowledgeNode[] = [
  {
    id: "my-businesses",
    label: "My Businesses",
    children: [
      { id: "kb-clothing", label: "Clothing Brand" },
      { id: "kb-cinematic", label: "AI-Cinematic" },
      { id: "kb-moneygap", label: "Money Gap System" },
    ],
  },
  { id: "client-businesses", label: "Client Businesses" },
  {
    id: "shared-playbooks",
    label: "Shared Playbooks",
    children: [
      { id: "pb-website", label: "Website Build" },
      { id: "pb-cinematic", label: "AI-Cinematic Production" },
      { id: "pb-content", label: "Content Creation" },
      { id: "pb-leadgen", label: "Lead Gen" },
      { id: "pb-sales", label: "Sales / Outreach" },
      { id: "pb-automation", label: "Automation SOPs" },
    ],
  },
  { id: "reference-vault", label: "Reference Vault" },
  {
    id: "design-system",
    label: "Design System",
    children: [
      { id: "ds-dna", label: "Design DNA Skills" },
      { id: "ds-recon", label: "Reconstruction Tests" },
      { id: "ds-inprogress", label: "In-Progress Codifications" },
    ],
  },
  { id: "templates", label: "Templates" },
];

export interface SampleAgent {
  id: string;
  name: string;
  role: string;
}

export const SAMPLE_AGENTS: SampleAgent[] = [
  { id: "ag1", name: "TBD", role: "Research & Intelligence" },
  { id: "ag2", name: "TBD", role: "Content Production" },
  { id: "ag3", name: "TBD", role: "Client Delivery" },
  { id: "ag4", name: "TBD", role: "Revenue Recovery" },
];

export const SPEND_USAGE = {
  openRouter: { balance: "$0.00", spend30d: "$0.00" },
  fal: { balance: "$0.00", spend30d: "$0.00" },
  modelUsage: [
    { model: "Claude", tokens: "0", cost: "$0.00" },
    { model: "GPT / Codex", tokens: "0", cost: "$0.00" },
    { model: "Gemini", tokens: "0", cost: "$0.00" },
    { model: "Grok", tokens: "0", cost: "$0.00" },
    { model: "Kimi", tokens: "0", cost: "$0.00" },
  ],
  mediaLog: [
    { job: "—", type: "—", cost: "—", date: "—" },
  ],
};

export const MONEY_GAP_MODULES = [
  { id: "gap-diagnostic", label: "Gap Diagnostic", detail: "0 new submissions" },
  { id: "revenue-recovery", label: "Revenue Recovery Board", detail: "Missed Call Recovery, Lead Nurturing, Reputation & Referral" },
  { id: "digital-storefront", label: "Digital Storefront", detail: "Website/listing status: not connected" },
  { id: "sales-improvement", label: "Sales Improvement", detail: "No active engagements" },
  { id: "growth-engine", label: "Growth Engine", detail: "No active engagements" },
  { id: "client-pipeline", label: "Client Pipeline", detail: "Setup call → 7-day live: 0 in pipeline" },
];

export const AUTO_ENGAGE_SECTIONS = [
  { id: "keyword-triggers", label: "Keyword Triggers", detail: "No triggers configured yet" },
  { id: "follow-gate", label: "Follow-Gate Rules", detail: "No rules configured yet" },
  { id: "flows", label: "Flows", detail: "No multi-step flows yet" },
  { id: "platform-rules", label: "Platform Rules", detail: "Instagram, Facebook" },
  { id: "automation-log", label: "Automation Log", detail: "No automations have run yet" },
];

export const SHARED_OS_ITEMS = [
  { id: "so1", title: "Competitor research — local service ad creative", kind: "Research" },
  { id: "so2", title: "Evaluate hermes-agent for Phase 6 runtime", kind: "Dev / Build" },
  { id: "so3", title: "Cross-business analytics rollup spec", kind: "Analytics" },
  { id: "so4", title: "Obsidian vault sync method — options review", kind: "Research" },
];

export const CLOTHING_CAMPAIGNS = [
  { id: "cc1", title: "Fall Drop — Street Luxury", status: "In Progress" },
  { id: "cc2", title: "Instagram Carousel — Gold Word Series", status: "Not Started" },
  { id: "cc3", title: "Lookbook Vol. 3", status: "Review" },
];

export const CONTENT_COMMAND_TABS = [
  { id: "create", label: "Create", detail: "Drop one post and generate every platform version." },
  { id: "library", label: "Content Library", detail: "All drafts, versions, and statuses." },
  { id: "calendar", label: "Calendar", detail: "Today / Week / Month — calendar and Kanban views." },
  { id: "approvals", label: "Approvals", detail: "DRAFT → READY_FOR_REVIEW → APPROVED → SCHEDULED → PUBLISHED." },
  { id: "platforms", label: "Platforms", detail: "YouTube, Instagram, TikTok, Threads, Facebook, X, Pinterest." },
  { id: "analytics", label: "Analytics", detail: "Per-platform performance and content memory insights." },
];
