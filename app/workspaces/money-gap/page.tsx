import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { MoneyGapModules } from "@/components/workspace/money-gap-modules";
import { ProjectCard } from "@/components/ui/project-card";
import { getWorkspaceMeta } from "@/lib/workspace";
import { SAMPLE_PROJECTS } from "@/lib/sample-data";

export default function MoneyGapPage() {
  const projects = SAMPLE_PROJECTS.filter((p) => p.workspace === "money-gap");

  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("money-gap")}>
      <MoneyGapModules />

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
