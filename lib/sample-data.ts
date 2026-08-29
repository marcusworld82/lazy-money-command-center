// Placeholder content for pages/sections still out of scope (Content Command,
// Auto-Engage, Spend & Usage, Agents, Knowledge Library, and each workspace's
// bespoke non-Project sections). SAMPLE_PROJECTS/SAMPLE_ASSETS are also used as
// first-run seed data by AppDataProvider — see lib/providers/app-data-provider.tsx.

import type { Workspace } from "@/lib/workspace";

export interface SampleProject {
  id: string;
  title: string;
  workspace: Workspace;
  status: "Not Started" | "In Progress" | "Review" | "Done";
  dueDate: string;
  description: string;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "p1",
    title: "Fall lookbook shoot",
    workspace: "clothing-brand",
    status: "In Progress",
    dueDate: "Sep 12",
    description: "Sample product photography for the fall streetwear drop.",
  },
  {
    id: "p2",
    title: "Oceanview listing — cinematic package",
    workspace: "ai-cinematic",
    status: "Review",
    dueDate: "Sep 8",
    description: "Shot list approved, awaiting client sign-off on edit.",
  },
  {
    id: "p3",
    title: "HVAC audit funnel v2",
    workspace: "money-gap",
    status: "In Progress",
    dueDate: "Sep 15",
    description: "Rebuilding the 10-question Gap Diagnostic intake.",
  },
  {
    id: "p4",
    title: "Design DNA — carousel style codification",
    workspace: "shared-os",
    status: "Not Started",
    dueDate: "Sep 20",
    description: "Reserve the folder structure for the gold-word carousel skill.",
  },
  {
    id: "p5",
    title: "Client onboarding template refresh",
    workspace: "shared-os",
    status: "Done",
    dueDate: "Aug 30",
    description: "Updated Brand Kit intake form for new client businesses.",
  },
];

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

export interface SampleAsset {
  id: string;
  filename: string;
  type: "image" | "video" | "document";
  workspace: Workspace;
}

export const SAMPLE_ASSETS: SampleAsset[] = [
  { id: "as1", filename: "hero-frame-04.png", type: "image", workspace: "ai-cinematic" },
  { id: "as2", filename: "lookbook-cover.jpg", type: "image", workspace: "clothing-brand" },
  { id: "as3", filename: "listing-teaser.mp4", type: "video", workspace: "ai-cinematic" },
  { id: "as4", filename: "gap-audit-brief.pdf", type: "document", workspace: "money-gap" },
  { id: "as5", filename: "streetwear-flat-01.png", type: "image", workspace: "clothing-brand" },
  { id: "as6", filename: "onboarding-sop.pdf", type: "document", workspace: "shared-os" },
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
