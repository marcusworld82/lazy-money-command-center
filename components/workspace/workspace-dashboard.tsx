import type { ReactNode } from "react";
import type { WorkspaceMeta } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";

interface WorkspaceDashboardProps {
  workspace: WorkspaceMeta;
  children: ReactNode;
}

export function WorkspaceDashboard({ workspace, children }: WorkspaceDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Workspace
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {workspace.label}
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">{workspace.tagline}</p>
      </header>
      {children}
    </div>
  );
}
