"use client";

import * as React from "react";
import { Plus, Mic, ArrowUp, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { PageHero } from "@/components/layout/page-hero";
import { AGENTS, AGENT_PHASE_LABEL } from "@/lib/agents";

/** Placeholder session history. Phase 6 replaces this with real sessions. */
const SESSIONS: { id: string; title: string; editedAt: string; badge?: string }[] = [
  { id: "s1", title: "Fall drop launch film", editedAt: "Edited 2 hours ago", badge: "New" },
  { id: "s2", title: "Money Gap explainer — 60s", editedAt: "Edited yesterday" },
  { id: "s3", title: "Listing walkthrough, jet interior", editedAt: "Edited 3 days ago" },
  { id: "s4", title: "Week of shorts from one podcast", editedAt: "Edited last week" },
  { id: "s5", title: "Capsule lookbook stills", editedAt: "Edited 2 weeks ago" },
  { id: "s6", title: "Cold-open hook tests", editedAt: "Edited last month" },
];

/**
 * Super Agent — the platform's conversational entry point, modelled on OpenArt
 * Director and invideo's Agent 1 (Phase 4.5 Part E/F).
 *
 * Layout and shell only. The composer records what you typed and answers with
 * the agent's "not built yet" line rather than faking orchestration; Phase 6
 * builds the real cross-tool routing.
 */
export default function SuperAgentPage() {
  const agent = AGENTS.super;
  const [draft, setDraft] = React.useState("");
  const [sent, setSent] = React.useState<string[]>([]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSent((prev) => [...prev, trimmed]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHero
        align="center"
        eyebrow="Super Agent"
        title={agent.greeting}
        description={agent.scope}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="mt-2 flex w-full max-w-2xl items-center gap-1.5 rounded-2xl border border-subtle bg-surface-card p-2"
        >
          <Button type="button" variant="ghost" size="icon" aria-label="Attach" disabled>
            <Plus className="size-4" />
          </Button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Describe what you want to make…"
            className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-foreground/35"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Voice input" disabled>
            <Mic className="size-4" />
          </Button>
          <Button type="submit" size="icon" aria-label="Send">
            <ArrowUp className="size-4" />
          </Button>
        </form>

        <div className="flex flex-wrap justify-center gap-1.5">
          {agent.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-subtle bg-surface-card/60 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:border-accent-brand/60 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </PageHero>

      {sent.length > 0 && (
        <Panel className="flex flex-col gap-2 p-4">
          <Badge variant="tag" className="w-fit text-[10px]">
            {AGENT_PHASE_LABEL}
          </Badge>
          <p className="text-xs text-foreground/60">
            Super Agent isn&apos;t wired up yet, so nothing was generated. Your asks are kept
            here so the flow is testable:
          </p>
          <ul className="flex flex-col gap-1">
            {sent.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80">
                — {s}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-tight">
            Projects
          </h2>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="size-3.5" /> Create New
          </Button>
        </div>

        {/* Horizontal scroller — older sessions live off the right edge, the
            way Director's project strip does. */}
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {SESSIONS.map((session) => (
            <Panel
              key={session.id}
              interactive
              className="relative w-56 shrink-0 snap-start overflow-hidden"
            >
              {session.badge && (
                <Badge variant="tag" className="absolute top-2 right-2 z-10 text-[10px]">
                  {session.badge}
                </Badge>
              )}
              <div className="relative flex aspect-video items-center justify-center border-b border-subtle">
                <div
                  aria-hidden
                  className="bg-gradient-glow-subtle pointer-events-none absolute inset-0 opacity-60"
                />
                <Sparkles className="relative size-5 text-foreground/30" />
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="truncate text-xs font-medium">{session.title}</span>
                <span className="flex items-center gap-1 text-[11px] text-foreground/45">
                  <Clock className="size-3" />
                  {session.editedAt}
                </span>
              </div>
            </Panel>
          ))}
        </div>
        <p className="text-[11px] text-foreground/40">
          Placeholder sessions. Real Super Agent projects appear here in Phase 6.
        </p>
      </section>
    </div>
  );
}
