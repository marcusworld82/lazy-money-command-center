"use client";

import * as React from "react";
import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ProjectCard } from "@/components/ui/project-card";
import { SAMPLE_PROJECTS, type SampleProject } from "@/lib/sample-data";
import { getWorkspaceMeta } from "@/lib/workspace";
import { cn } from "@/lib/utils";

const STATUSES: SampleProject["status"][] = ["Not Started", "In Progress", "Review", "Done"];

export default function ProjectsPage() {
  const [view, setView] = React.useState<"list" | "board">("board");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
            Build
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Projects
          </h1>
          <p className="max-w-xl text-sm text-foreground/60">
            Sample projects across every workspace. Full CRUD arrives in Phase 2.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-glass-border bg-glass p-1">
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => setView("list")}
            className="gap-1.5"
          >
            <List className="size-3.5" /> List
          </Button>
          <Button
            size="sm"
            variant={view === "board" ? "secondary" : "ghost"}
            onClick={() => setView("board")}
            className="gap-1.5"
          >
            <LayoutGrid className="size-3.5" /> Board
          </Button>
        </div>
      </header>

      {view === "board" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                {status}
                <span className="ml-1.5 text-foreground/30">
                  {SAMPLE_PROJECTS.filter((p) => p.status === status).length}
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {SAMPLE_PROJECTS.filter((p) => p.status === status).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <GlassPanel className="flex flex-col divide-y divide-glass-border">
          {SAMPLE_PROJECTS.map((project) => {
            const workspace = getWorkspaceMeta(project.workspace);
            return (
              <div
                key={project.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{project.title}</span>
                  <span className="truncate text-xs text-foreground/50">
                    {workspace.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{project.status}</Badge>
                  <span className="text-xs text-foreground/50">Due {project.dueDate}</span>
                </div>
              </div>
            );
          })}
        </GlassPanel>
      )}
    </div>
  );
}
