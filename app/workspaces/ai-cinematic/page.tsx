"use client";

import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { WorkspaceLivePanel } from "@/components/workspace/workspace-live-panel";
import { StatCard } from "@/components/ui/stat-card";
import { getWorkspaceMeta } from "@/lib/workspace";
import { STATUS_LABEL, useAppData } from "@/lib/providers/app-data-provider";
import { countProjectsByStatus } from "@/lib/selectors";
import { Clapperboard } from "lucide-react";

export default function AiCinematicPage() {
  const { projects } = useAppData();
  const counts = countProjectsByStatus(projects, "ai-cinematic");

  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("ai-cinematic")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Client Pipeline
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={STATUS_LABEL["not-started"]}
            value={String(counts["not-started"])}
            icon={Clapperboard}
          />
          <StatCard
            label={STATUS_LABEL["in-progress"]}
            value={String(counts["in-progress"])}
            icon={Clapperboard}
          />
          <StatCard label={STATUS_LABEL.review} value={String(counts.review)} icon={Clapperboard} />
          <StatCard label={STATUS_LABEL.done} value={String(counts.done)} icon={Clapperboard} />
        </div>
      </section>

      <WorkspaceLivePanel workspace="ai-cinematic" />
    </WorkspaceDashboard>
  );
}
