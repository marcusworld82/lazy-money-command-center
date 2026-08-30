"use client";

import * as React from "react";
import { MessageSquare, X, Send, Plus, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENTS, AGENT_PHASE_LABEL, type AgentId } from "@/lib/agents";
import { cn } from "@/lib/utils";

/**
 * Agent chat shell (Phase 4.5 Part F).
 *
 * The composer is deliberately inert — it records the ask, then answers with
 * the agent's own "not built yet" line rather than faking a reply, so the shell
 * reads as unfinished rather than broken (master spec §17). Phase 6 replaces
 * `send()` with real orchestration; nothing else here changes.
 */
export function AgentChatPanel({
  agentId,
  onClose,
  className,
}: {
  agentId: AgentId;
  onClose?: () => void;
  className?: string;
}) {
  const agent = AGENTS[agentId];
  const Icon = agent.icon;
  const [draft, setDraft] = React.useState("");
  const [thread, setThread] = React.useState<
    { from: "you" | "agent"; text: string }[]
  >([]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setThread((prev) => [
      ...prev,
      { from: "you", text: trimmed },
      {
        from: "agent",
        text: `${agent.name} isn't wired up yet — ${AGENT_PHASE_LABEL.toLowerCase()}. Your ask is kept here so the flow is testable.`,
      },
    ]);
    setDraft("");
  }

  return (
    <div
      className={cn("flex min-h-0 flex-col", className)}
      aria-label={`${agent.name} chat`}
    >
      <header className="relative flex items-center gap-2.5 overflow-hidden border-b border-subtle px-4 py-3">
        <div
          aria-hidden
          className="bg-gradient-glow-subtle pointer-events-none absolute inset-0"
        />
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-brand/15 text-accent-brand">
          <Icon className="size-4" />
        </div>
        <div className="relative flex min-w-0 flex-col">
          <span className="font-heading text-sm font-semibold">{agent.name}</span>
          <span className="truncate text-[11px] text-foreground/50">
            Modelled on {agent.behaviourModel}
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative ml-auto"
            aria-label="Close agent chat"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-raised p-3">
          <Badge variant="tag" className="w-fit text-[10px]">
            {AGENT_PHASE_LABEL}
          </Badge>
          <p className="text-xs text-foreground/70">{agent.greeting}</p>
          <p className="text-[11px] text-foreground/45">{agent.scope}</p>
        </div>

        {thread.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-xs",
              msg.from === "you"
                ? "ml-auto bg-accent-brand text-surface-white"
                : "border border-subtle bg-surface-raised text-foreground/75",
            )}
          >
            {msg.text}
          </div>
        ))}

        {thread.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {agent.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-subtle px-2.5 py-1 text-[11px] text-foreground/65 transition-colors hover:border-accent-brand/60 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-1.5 border-t border-subtle p-3"
      >
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach" disabled>
          <Plus className="size-4" />
        </Button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${agent.name}…`}
          className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-foreground/35"
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Voice input" disabled>
          <Mic className="size-4" />
        </Button>
        <Button type="submit" size="icon-sm" aria-label="Send">
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}

/**
 * Floating, dockable version used by Canvas and Apparel: a collapsed pill that
 * opens into a persistent right-hand panel.
 */
export function AgentDock({ agentId }: { agentId: AgentId }) {
  const agent = AGENTS[agentId];
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 h-11 gap-2 rounded-full px-4 shadow-lg"
      >
        <MessageSquare className="size-4" />
        Ask {agent.name}
      </Button>
    );
  }

  return (
    <AgentChatPanel
      agentId={agentId}
      onClose={() => setOpen(false)}
      className="fixed inset-y-0 right-0 z-40 w-full border-l border-subtle bg-surface-card sm:w-[380px]"
    />
  );
}
