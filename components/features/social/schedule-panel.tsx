"use client";

import * as React from "react";
import { Send, Clock, FastForward, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ALL_PLATFORMS, PLATFORM_RULES } from "@/lib/content/platforms";
import type { ContentPlatform } from "@/lib/types";

/**
 * Schedule mode for the New Post right panel.
 *
 * The account checklist is grouped by platform and every account reads "Not
 * connected", because no connector has a live publish path — the same rule the
 * rest of Content Command enforces. Publish Now / Pick a time / Next Free Slot
 * are therefore disabled rather than silently doing nothing.
 */
export function SchedulePanel() {
  const [selected, setSelected] = React.useState<ContentPlatform[]>([]);

  function toggle(p: ContentPlatform) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <header className="border-b border-subtle px-4 py-3">
        <span className="font-heading text-sm font-semibold">Schedule</span>
        <p className="text-[11px] text-foreground/50">
          Pick the accounts, then publish or queue.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-subtle bg-surface-raised p-3">
          <PlugZap className="mt-0.5 size-3.5 shrink-0 text-accent-brand" />
          <p className="text-[11px] text-foreground/60">
            No accounts are connected yet, so nothing can actually be posted. Approved
            versions land on <strong>Ready to Post</strong> with a full manual-post pack
            instead.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Accounts
          </span>
          {ALL_PLATFORMS.map((p) => (
            <label
              key={p}
              className="flex items-center gap-2.5 rounded-lg border border-subtle px-2.5 py-2"
            >
              <Checkbox
                checked={selected.includes(p)}
                onCheckedChange={() => toggle(p)}
                aria-label={PLATFORM_RULES[p].label}
              />
              <Label className="flex-1 text-xs font-medium">
                {PLATFORM_RULES[p].label}
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                Not connected
              </Badge>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-subtle p-3">
        <Button className="w-full gap-2" disabled>
          <Send className="size-3.5" /> Publish Now
        </Button>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" className="flex-1 gap-1.5" disabled>
            <Clock className="size-3.5" /> Pick a time
          </Button>
          <Button variant="secondary" size="sm" className="flex-1 gap-1.5" disabled>
            <FastForward className="size-3.5" /> Next Free Slot
          </Button>
        </div>
        <p className="text-[10px] text-foreground/40">
          Enabled once a platform connector is live.
        </p>
      </div>
    </div>
  );
}
