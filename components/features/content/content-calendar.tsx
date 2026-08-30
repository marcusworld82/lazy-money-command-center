"use client";

import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PLATFORM_RULES } from "@/lib/content/platforms";
import type { ContentVersion, ScheduledPost } from "@/lib/types";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "month";

const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Month/week/today views over the same scheduled_posts data the Kanban board
 * uses — built with plain date math rather than pulling in a calendar library.
 */
export function ContentCalendar({
  scheduled,
  versions,
}: {
  scheduled: ScheduledPost[];
  versions: ContentVersion[];
}) {
  const [range, setRange] = React.useState<Range>("month");
  const [cursor, setCursor] = React.useState(() => startOfDay(new Date()));

  const byDay = React.useMemo(() => {
    const map = new Map<string, { post: ScheduledPost; version?: ContentVersion }[]>();
    for (const post of scheduled) {
      if (!post.scheduledFor) continue;
      const key = startOfDay(new Date(post.scheduledFor)).toDateString();
      const entry = {
        post,
        version: versions.find((v) => v.id === post.versionId),
      };
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [scheduled, versions]);

  const days = React.useMemo(() => {
    if (range === "today") return [cursor];
    if (range === "week") {
      const start = new Date(cursor.getTime() - cursor.getDay() * DAY_MS);
      return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(first.getTime() - first.getDay() * DAY_MS);
    return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * DAY_MS));
  }, [range, cursor]);

  function shift(direction: -1 | 1) {
    if (range === "today") setCursor((c) => new Date(c.getTime() + direction * DAY_MS));
    else if (range === "week")
      setCursor((c) => new Date(c.getTime() + direction * 7 * DAY_MS));
    else setCursor((c) => new Date(c.getFullYear(), c.getMonth() + direction, 1));
  }

  const today = startOfDay(new Date()).toDateString();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-subtle bg-surface-card p-1">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "secondary" : "ghost"}
              onClick={() => setRange(r)}
              className="capitalize"
            >
              {r}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="ghost" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">
            {cursor.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
              ...(range !== "month" ? { day: "numeric" } : {}),
            })}
          </span>
          <Button size="icon-sm" variant="ghost" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Panel className="p-3">
        {range === "month" && (
          <div className="mb-1 grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span
                key={d}
                className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
              >
                {d}
              </span>
            ))}
          </div>
        )}
        <div
          className={cn(
            "grid gap-1",
            range === "month" && "grid-cols-7",
            range === "week" && "grid-cols-7",
            range === "today" && "grid-cols-1",
          )}
        >
          {days.map((day) => {
            const entries = byDay.get(day.toDateString()) ?? [];
            const inMonth = day.getMonth() === cursor.getMonth();
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex min-h-20 flex-col gap-1 rounded-md border border-subtle p-1.5",
                  range === "today" && "min-h-40",
                  !inMonth && range === "month" && "opacity-35",
                  day.toDateString() === today && "border-accent-brand/60",
                )}
              >
                <span className="text-[10px] text-foreground/45">{day.getDate()}</span>
                {entries.map(({ post, version }) => (
                  <div
                    key={post.id}
                    className="truncate rounded bg-accent-brand/20 px-1 py-0.5 text-[10px] text-accent-brand"
                    title={version ? PLATFORM_RULES[version.platform].label : undefined}
                  >
                    {version ? PLATFORM_RULES[version.platform].label : "Scheduled"}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>

      {scheduled.length === 0 && (
        <p className="text-xs text-foreground/45">
          Nothing scheduled yet. Approve a version, then schedule it from the Approvals tab.
        </p>
      )}
    </div>
  );
}
