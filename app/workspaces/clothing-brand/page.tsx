import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/ui/project-card";
import { getWorkspaceMeta } from "@/lib/workspace";
import { CLOTHING_CAMPAIGNS, SAMPLE_PROJECTS } from "@/lib/sample-data";

export default function ClothingBrandPage() {
  const projects = SAMPLE_PROJECTS.filter((p) => p.workspace === "clothing-brand");

  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("clothing-brand")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Campaigns
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CLOTHING_CAMPAIGNS.map((c) => (
            <GlassPanel key={c.id} className="flex flex-col gap-2 p-4">
              <span className="text-sm font-medium">{c.title}</span>
              <Badge variant="secondary" className="w-fit">
                {c.status}
              </Badge>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Product Concepts &amp; Projects
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
