import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, detail, icon: Icon, className }: StatCardProps) {
  return (
    <Panel className={cn("flex flex-col gap-2 p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground/60">
          {label}
        </span>
        {Icon ? <Icon className="size-4 text-foreground/50" /> : null}
      </div>
      <span className="font-heading text-2xl font-semibold tracking-tight text-accent-brand">
        {value}
      </span>
      {detail ? <span className="text-xs text-foreground/55">{detail}</span> : null}
    </Panel>
  );
}
