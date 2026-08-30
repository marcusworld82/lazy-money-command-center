import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { getWorkspaceMeta } from "@/lib/workspace";
import { STATUS_LABEL } from "@/lib/providers/app-data-provider";

export function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick?: () => void;
}) {
  const workspace = getWorkspaceMeta(project.workspace);
  return (
    <Panel
      as={onClick ? "button" : "div"}
      interactive
      onClick={onClick}
      className="flex w-full flex-col gap-3 p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold leading-snug">{project.title}</h3>
        <Badge variant="secondary" className="shrink-0">
          {STATUS_LABEL[project.status]}
        </Badge>
      </div>
      <p className="text-xs text-foreground/60">{project.description}</p>
      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-foreground/50">
        <span>{workspace.shortLabel}</span>
        {project.dueDate ? <span>Due {project.dueDate}</span> : <span />}
      </div>
    </Panel>
  );
}
