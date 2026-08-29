import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import type { SampleProject } from "@/lib/sample-data";
import { getWorkspaceMeta } from "@/lib/workspace";

const STATUS_LABEL: Record<SampleProject["status"], string> = {
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  Review: "Review",
  Done: "Done",
};

export function ProjectCard({ project }: { project: SampleProject }) {
  const workspace = getWorkspaceMeta(project.workspace);
  return (
    <GlassPanel interactive className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold leading-snug">{project.title}</h3>
        <Badge variant="secondary" className="shrink-0">
          {STATUS_LABEL[project.status]}
        </Badge>
      </div>
      <p className="text-xs text-foreground/60">{project.description}</p>
      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-foreground/50">
        <span>{workspace.shortLabel}</span>
        <span>Due {project.dueDate}</span>
      </div>
    </GlassPanel>
  );
}
