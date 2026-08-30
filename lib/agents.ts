import type { LucideIcon } from "lucide-react";
import { Workflow, Share2, Shirt, Sparkles } from "lucide-react";

export type AgentId = "canvas" | "social" | "apparel" | "super";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  icon: LucideIcon;
  /** Where in the app this agent is reachable. */
  livesIn: string;
  href: string;
  /** The product whose behaviour this agent is modelled on. */
  behaviourModel: string;
  /** One line describing what it will do once Phase 6 builds it. */
  scope: string;
  /** Placeholder opener shown in the docked chat shell. */
  greeting: string;
  /** Example asks, shown as clickable pills in the dock. */
  suggestions: string[];
}

/**
 * The four named agents (Phase 4.5 Part F).
 *
 * These are scoped placeholders. Nothing here reasons, calls a model, or holds
 * memory — Phase 6 builds the actual orchestration. They exist now so Phase 6
 * has concrete targets rather than inventing a roster from scratch, and so each
 * tool page has a real entry point to dock a chat into.
 */
export const AGENTS: Record<AgentId, AgentDefinition> = {
  canvas: {
    id: "canvas",
    name: "Canvas Agent",
    icon: Workflow,
    livesIn: "Canvas",
    href: "/canvas",
    behaviourModel: "Magnific Spaces",
    scope:
      "Builds and connects workflow nodes from a conversation instead of manual dragging.",
    greeting:
      "Describe the workflow you want and I'll lay out the nodes and wire them together.",
    suggestions: [
      "Build a brief → shot list → render → approval chain",
      "Add an approval step before the output node",
      "Wire the prompt node into two image nodes",
    ],
  },
  social: {
    id: "social",
    name: "Social Agent",
    icon: Share2,
    livesIn: "Social → New Post",
    href: "/social/new-post",
    behaviourModel: "Blotato's AI content agent",
    scope:
      "Drafts posts, revises hooks and wording via chat, and writes to a brand kit.",
    greeting:
      "Paste a draft or tell me the angle, and I'll shape the hook and caption to the brand kit.",
    suggestions: [
      "Rewrite this hook three ways",
      "Make the caption shorter and punchier",
      "Match the tone to my brand voice profile",
    ],
  },
  apparel: {
    id: "apparel",
    name: "Apparel Agent",
    icon: Shirt,
    livesIn: "Apparel",
    href: "/apparel",
    behaviourModel: "No direct model — original",
    scope: "Concepts, merchandising ideas, and design direction for drops.",
    greeting:
      "Tell me the drop you're planning and I'll work up concepts, colourways, and placements.",
    suggestions: [
      "Concept a 6-piece capsule around one graphic",
      "Suggest placements for this front print",
      "What colourways sell this silhouette?",
    ],
  },
  super: {
    id: "super",
    name: "Super Agent",
    icon: Sparkles,
    livesIn: "Super Agent",
    href: "/super-agent",
    behaviourModel: "invideo Agent 1 + OpenArt Director",
    scope:
      "Cross-tool orchestrator — the platform's main conversational entry point.",
    greeting: "What are we making today?",
    suggestions: [
      "Turn this idea into a 60-second video",
      "Plan a week of content from one long-form post",
      "Design a drop and the campaign around it",
    ],
  },
};

export const AGENT_LIST: AgentDefinition[] = [
  AGENTS.canvas,
  AGENTS.social,
  AGENTS.apparel,
  AGENTS.super,
];

/** Every agent lands in Phase 6; kept in one place so the label can't drift. */
export const AGENT_PHASE_LABEL = "Coming in Phase 6";
