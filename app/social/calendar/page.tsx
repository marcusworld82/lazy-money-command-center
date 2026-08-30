"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { PLATFORM_RULES } from "@/lib/content/platforms";
import { listScheduledPosts, listVersions } from "@/lib/actions/content";
import type { ScheduledPost, ContentVersion } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
/** Posting slots the week grid is divided into. */
const SLOTS = ["08:00", "12:00", "17:00", "20:00"] as const;

function startOfWeek(d: Date) {
  const copy = new Date(d);
  // getDay(): 0 = Sunday. Shift so Monday is column 0.
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Social → Calendar.
 *
 * A weekly grid of posting slots, per Phase 4.5. Scheduled posts are real rows
 * from Supabase — an empty week is an empty week, not filler.
 */
export default function SocialCalendarPage() {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [scheduled, setScheduled] = React.useState<ScheduledPost[]>([]);
  const [versions, setVersions] = React.useState<ContentVersion[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([listScheduledPosts(), listVersions()])
      .then(([s, v]) => {
        if (cancelled) return;
        setScheduled(s);
        setVersions(v);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load the schedule.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const weekStart = React.useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const days = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  /** Bucket a scheduled post into the nearest slot at or before its time. */
  function slotFor(iso: string): string {
    const hour = new Date(iso).getHours();
    let chosen: string = SLOTS[0];
    for (const s of SLOTS) {
      if (Number(s.slice(0, 2)) <= hour) chosen = s;
    }
    return chosen;
  }

  function postsAt(day: Date, slot: string) {
    return scheduled.filter((p) => {
      // scheduledFor is optional on the row; an unscheduled post has no slot.
      if (!p.scheduledFor) return false;
      const when = new Date(p.scheduledFor);
      return (
        when.getFullYear() === day.getFullYear() &&
        when.getMonth() === day.getMonth() &&
        when.getDate() === day.getDate() &&
        slotFor(p.scheduledFor) === slot
      );
    });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const rangeLabel = `${weekStart.toLocaleDateString(undefined, fmt)} – ${weekEnd.toLocaleDateString(undefined, fmt)}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Social
          </span>
          <h1 className="text-display-sm uppercase">Calendar</h1>
          <p className="max-w-2xl text-sm text-foreground/60">
            Queued posting slots by day and time, across every platform.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Previous week"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-xs tabular-nums text-foreground/70">
            {rangeLabel}
          </span>
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Next week"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      {error ? (
        <PlaceholderEmptyState
          icon={CalendarDays}
          title="Couldn't load the schedule"
          description={error}
        />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <div className="min-w-[52rem]">
            <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-subtle">
              <div />
              {days.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={cn(
                      "border-l border-subtle px-2 py-2 text-center",
                      isToday && "bg-gradient-glow-subtle",
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-foreground/45">
                      {DAY_LABELS[i]}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        isToday && "text-accent-brand",
                      )}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {SLOTS.map((slot) => (
              <div
                key={slot}
                className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-subtle last:border-b-0"
              >
                <div className="px-2 py-3 text-[10px] tabular-nums text-foreground/40">
                  {slot}
                </div>
                {days.map((day, i) => {
                  const posts = postsAt(day, slot);
                  return (
                    <div
                      key={i}
                      className="min-h-16 border-l border-subtle p-1.5"
                    >
                      {posts.map((p) => {
                        const version = versions.find((v) => v.id === p.versionId);
                        return (
                          <div
                            key={p.id}
                            className="mb-1 rounded-md border border-accent-brand/40 bg-accent-brand/10 px-1.5 py-1"
                          >
                            <span className="block truncate text-[10px] font-medium">
                              {version
                                ? PLATFORM_RULES[version.platform].label
                                : "Scheduled"}
                            </span>
                            <span className="block text-[10px] text-foreground/50">
                              {new Date(p.scheduledFor!).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {!error && scheduled.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-foreground/45">
          <Badge variant="secondary" className="text-[10px]">
            Empty
          </Badge>
          Nothing is queued yet. Approve a version in Published → Approvals and schedule it.
        </div>
      )}
    </div>
  );
}
