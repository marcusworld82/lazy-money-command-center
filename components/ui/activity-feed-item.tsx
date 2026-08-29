import type { ActivityItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function ActivityFeedItem({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 border-b border-glass-border py-3 last:border-b-0">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/50" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{item.label}</span>
        {item.detail ? (
          <span className="truncate text-xs text-foreground/55">{item.detail}</span>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-foreground/40">
        {formatRelativeTime(item.timestamp)}
      </span>
    </li>
  );
}
