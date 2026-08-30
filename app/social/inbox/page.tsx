"use client";

import * as React from "react";
import { Send, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { PLATFORM_RULES } from "@/lib/content/platforms";
import type { ContentPlatform } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  platform: ContentPlatform;
  kind: "comment" | "dm";
  author: string;
  preview: string;
  when: string;
  unread?: boolean;
  messages: { from: "them" | "you"; text: string; when: string }[];
}

/**
 * Placeholder threads. No Meta/X/LinkedIn connector exists, so nothing here is
 * real — it demonstrates the two-pane shape the live inbox will fill.
 */
const THREADS: Thread[] = [
  {
    id: "t1",
    platform: "instagram",
    kind: "comment",
    author: "@hvac_dan",
    preview: "Does this work if I only do residential?",
    when: "12m",
    unread: true,
    messages: [
      { from: "them", text: "Does this work if I only do residential?", when: "12m" },
    ],
  },
  {
    id: "t2",
    platform: "instagram",
    kind: "dm",
    author: "@shop_mercer",
    preview: "GUIDE",
    when: "1h",
    unread: true,
    messages: [
      { from: "them", text: "GUIDE", when: "1h" },
      {
        from: "you",
        text: "Sent automatically by the \"GUIDE\" flow (simulated).",
        when: "1h",
      },
    ],
  },
  {
    id: "t3",
    platform: "facebook",
    kind: "comment",
    author: "Marla P.",
    preview: "Where do I sign up for the walkthrough?",
    when: "4h",
    messages: [
      { from: "them", text: "Where do I sign up for the walkthrough?", when: "4h" },
    ],
  },
  {
    id: "t4",
    platform: "x",
    kind: "comment",
    author: "@buildinpublic",
    preview: "The $997 number — is that per location?",
    when: "yesterday",
    messages: [
      { from: "them", text: "The $997 number — is that per location?", when: "yesterday" },
    ],
  },
];

export default function SocialInboxPage() {
  const [activeId, setActiveId] = React.useState(THREADS[0]!.id);
  const active = THREADS.find((t) => t.id === activeId) ?? THREADS[0]!;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Social
        </span>
        <h1 className="text-display-sm uppercase">Inbox</h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          Comments and DMs from every connected account in one queue.
        </p>
      </header>

      <Panel className="flex items-start gap-3 p-3">
        <PlugZap className="mt-0.5 size-4 shrink-0 text-accent-brand" />
        <p className="text-xs text-foreground/60">
          Placeholder threads — no social account is connected, so nothing here is live and
          replies are not sent anywhere.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left: thread list */}
        <Panel className="flex max-h-[32rem] flex-col overflow-y-auto p-0">
          {THREADS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={cn(
                "relative flex flex-col gap-1 border-b border-subtle px-3 py-2.5 text-left transition-colors last:border-b-0",
                t.id === activeId
                  ? "bg-gradient-glow-subtle"
                  : "hover:bg-white/5",
              )}
            >
              {t.id === activeId && (
                <span
                  aria-hidden
                  className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent-brand"
                />
              )}
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-medium">{t.author}</span>
                {t.unread && (
                  <span className="size-1.5 shrink-0 rounded-full bg-accent-brand" />
                )}
                <span className="ml-auto shrink-0 text-[10px] text-foreground/40">
                  {t.when}
                </span>
              </div>
              <span className="truncate text-[11px] text-foreground/55">{t.preview}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {PLATFORM_RULES[t.platform].label}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {t.kind}
                </Badge>
              </div>
            </button>
          ))}
        </Panel>

        {/* Right: active thread */}
        <Panel className="flex max-h-[32rem] min-h-[24rem] flex-col p-0">
          <header className="flex items-center gap-2 border-b border-subtle px-4 py-3">
            <span className="font-heading text-sm font-semibold">{active.author}</span>
            <Badge variant="secondary" className="text-[10px]">
              {PLATFORM_RULES[active.platform].label}
            </Badge>
          </header>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {active.messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2 text-xs",
                  m.from === "you"
                    ? "ml-auto bg-accent-brand text-surface-white"
                    : "border border-subtle bg-surface-raised text-foreground/80",
                )}
              >
                {m.text}
                <span
                  className={cn(
                    "mt-1 block text-[10px]",
                    m.from === "you" ? "text-surface-white/70" : "text-foreground/40",
                  )}
                >
                  {m.when}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-t border-subtle p-3">
            <input
              disabled
              placeholder="Replying needs a connected account"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-foreground/35"
            />
            <Button size="icon-sm" aria-label="Send reply" disabled>
              <Send className="size-3.5" />
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
