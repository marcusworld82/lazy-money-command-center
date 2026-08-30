"use client";

import * as React from "react";
import { MessageSquare, CalendarClock } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ContentCreate } from "@/components/features/content/content-create";
import { AgentChatPanel } from "@/components/features/agent-dock";
import { SchedulePanel } from "@/components/features/social/schedule-panel";
import { listBrandVoices } from "@/lib/actions/content";
import { getLLMKeyStatus } from "@/lib/actions/settings";
import type { BrandVoiceProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type RightMode = "agent" | "schedule";

/**
 * Social → New Post.
 *
 * Centre is the real draft editor (source content in, analyzer + per-platform
 * adapters out — the working Content Command pipeline from Phase 4). The right
 * panel toggles between the Social Agent chat and schedule mode, per the
 * Blotato pattern.
 */
export default function NewPostPage() {
  const [voices, setVoices] = React.useState<BrandVoiceProfile[]>([]);
  const [llmConfigured, setLlmConfigured] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<RightMode>("agent");

  const refresh = React.useCallback(async () => {
    try {
      const [v, k] = await Promise.all([listBrandVoices(), getLLMKeyStatus()]);
      setVoices(v);
      setLlmConfigured(k.configured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brand voices.");
    }
  }, []);

  React.useEffect(() => {
    // Deliberate: initial fetch-on-mount; Server Actions can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Social
        </span>
        <h1 className="text-display-sm uppercase">New Post</h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          One source of truth in, a native version out for every platform. Talk to the Social
          Agent to shape the hook, then switch to Schedule to queue it.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {error ? (
            <PlaceholderEmptyState
              icon={MessageSquare}
              title="Couldn't load brand voices"
              description={error}
            />
          ) : (
            <ContentCreate
              brandVoices={voices}
              llmConfigured={llmConfigured}
              onCreated={refresh}
            />
          )}
        </div>

        <Panel className="flex h-[36rem] flex-col overflow-hidden p-0 xl:sticky xl:top-20">
          <div className="flex gap-0.5 border-b border-subtle p-1">
            {(
              [
                { id: "agent", label: "AI chat", icon: MessageSquare },
                { id: "schedule", label: "Schedule", icon: CalendarClock },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  mode === id
                    ? "bg-accent-brand text-surface-white"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {mode === "agent" ? (
            <AgentChatPanel agentId="social" className="flex-1" />
          ) : (
            <SchedulePanel />
          )}
        </Panel>
      </div>
    </div>
  );
}
