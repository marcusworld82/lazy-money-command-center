import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

interface PlaceholderEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PlaceholderEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PlaceholderEmptyStateProps) {
  return (
    <GlassPanel
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-11 items-center justify-center rounded-full border border-glass-border bg-white/5">
          <Icon className="size-5 text-foreground/60" />
        </div>
      ) : null}
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-sm text-xs text-foreground/55">{description}</p>
      ) : null}
      {action}
    </GlassPanel>
  );
}
