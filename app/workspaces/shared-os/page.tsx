import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getWorkspaceMeta } from "@/lib/workspace";
import { SHARED_OS_ITEMS, SAMPLE_PROJECTS } from "@/lib/sample-data";
import { ProjectCard } from "@/components/ui/project-card";

export default function SharedOsPage() {
  const projects = SAMPLE_PROJECTS.filter((p) => p.workspace === "shared-os");

  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("shared-os")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Research &amp; Dev
        </h2>
        <div className="flex flex-col gap-2">
          {SHARED_OS_ITEMS.map((item) => (
            <GlassPanel key={item.id} className="flex items-center justify-between p-3">
              <span className="text-sm">{item.title}</span>
              <span className="text-xs text-foreground/50">{item.kind}</span>
            </GlassPanel>
          ))}
        </div>
      </section>

      {projects.length > 0 && (
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
      )}
    </WorkspaceDashboard>
  );
}
