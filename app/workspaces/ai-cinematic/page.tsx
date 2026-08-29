import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { getWorkspaceMeta } from "@/lib/workspace";
import { CINEMATIC_PIPELINE, SAMPLE_PROJECTS } from "@/lib/sample-data";
import { Clapperboard } from "lucide-react";

export default function AiCinematicPage() {
  const projects = SAMPLE_PROJECTS.filter((p) => p.workspace === "ai-cinematic");

  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("ai-cinematic")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Client Pipeline
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CINEMATIC_PIPELINE.map((stage) => (
            <StatCard
              key={stage.stage}
              label={stage.stage}
              value={String(stage.count)}
              icon={Clapperboard}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Projects
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </WorkspaceDashboard>
  );
}
