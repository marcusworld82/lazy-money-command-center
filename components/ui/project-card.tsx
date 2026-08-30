import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/providers/app-data-provider";

export function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick?: () => void;
}) {
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
      {project.dueDate && (
        <div className="mt-auto pt-1 text-xs text-foreground/50">
          Due {project.dueDate}
        </div>
      )}
    </Panel>
  );
}
