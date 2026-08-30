"use client";

import * as React from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, RefreshCw, CalendarClock, Send, AlertTriangle } from "lucide-react";
import { PLATFORM_RULES } from "@/lib/content/platforms";
import type { ContentVersion, VersionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<VersionStatus, string> = {
  draft: "Draft",
  ready_for_review: "Ready for Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  ready_to_post: "Ready to Post",
};

export function VersionCard({
  version,
  onApprove,
  onReject,
  onRegenerate,
  onSchedule,
  onPublish,
  compact,
}: {
  version: ContentVersion;
  onApprove?: () => void;
  onReject?: () => void;
  onRegenerate?: () => void;
  onSchedule?: (when: string) => void;
  onPublish?: () => void;
  compact?: boolean;
}) {
  const [scheduleAt, setScheduleAt] = React.useState("");
  const rules = PLATFORM_RULES[version.platform];
  const p = version.payload;
  const needsReview = p.notes?.includes("REVIEW NEEDED");

  return (
    <GlassPanel className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-sm font-semibold">{rules.label}</span>
        <Badge
          variant="secondary"
          className={cn(
            "shrink-0 text-[10px]",
            version.status === "approved" && "text-accent-green",
          )}
        >
          {STATUS_LABEL[version.status]}
        </Badge>
      </div>

      {p.subject && (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-foreground/40">
            Subject
          </span>
          <span className="text-sm">{p.subject}</span>
        </div>
      )}
      {p.title && (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-foreground/40">
            Title
          </span>
          <span className="text-sm">{p.title}</span>
        </div>
      )}
      {p.caption && (
        <p className={cn("whitespace-pre-wrap text-xs text-foreground/75", compact && "line-clamp-4")}>
          {p.caption}
        </p>
      )}
      {p.script && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-foreground/40">
            Script
          </span>
          <p className={cn("whitespace-pre-wrap text-xs text-foreground/75", compact && "line-clamp-4")}>
            {p.script}
          </p>
        </div>
      )}
      {p.body && !compact && (
        <p className="whitespace-pre-wrap text-xs text-foreground/75">{p.body}</p>
      )}
      {p.hashtags && p.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.hashtags.map((h) => (
            <span key={h} className="text-[11px] text-accent-green">
              #{h.replace(/^#/, "")}
            </span>
          ))}
        </div>
      )}

      {needsReview && (
        <div className="flex items-start gap-2 rounded-md border border-glass-border bg-white/5 p-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent-green" />
          <p className="text-[11px] text-foreground/70">{p.notes}</p>
        </div>
      )}
      {p.notes && !needsReview && !compact && (
        <p className="text-[11px] text-foreground/50">{p.notes}</p>
      )}

      {version.status === "ready_to_post" && p.manualPostPack && (
        <div className="flex flex-col gap-1.5 rounded-md border border-glass-border bg-white/5 p-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Manual post pack
          </span>
          {p.manualPostPack.mediaSpec && (
            <span className="text-[11px] text-foreground/65">
              Media: {p.manualPostPack.mediaSpec}
            </span>
          )}
          {p.manualPostPack.suggestedTime && (
            <span className="text-[11px] text-foreground/65">
              Suggested time: {p.manualPostPack.suggestedTime}
            </span>
          )}
          {p.manualPostPack.steps && p.manualPostPack.steps.length > 0 && (
            <ol className="flex flex-col gap-0.5">
              {p.manualPostPack.steps.map((s, i) => (
                <li key={i} className="text-[11px] text-foreground/65">
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-glass-border pt-2">
          {onApprove && version.status !== "approved" && (
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={onApprove}>
              <Check className="size-3.5" /> Approve
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onReject}>
              <X className="size-3.5" /> Reject
            </Button>
          )}
          {onRegenerate && (
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onRegenerate}>
              <RefreshCw className="size-3.5" /> Regenerate
            </Button>
          )}
          {onSchedule && version.status === "approved" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="h-7 w-[190px] text-xs"
              />
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={!scheduleAt}
                onClick={() => onSchedule(new Date(scheduleAt).toISOString())}
              >
                <CalendarClock className="size-3.5" /> Schedule
              </Button>
            </div>
          )}
          {onPublish && version.status === "approved" && (
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onPublish}>
              <Send className="size-3.5" /> Publish
            </Button>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
