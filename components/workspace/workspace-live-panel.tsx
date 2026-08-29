"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { ProjectFormDialog } from "@/components/features/project-form-dialog";
import { ProjectDetailSheet } from "@/components/features/project-detail-sheet";
import { TaskTab } from "@/components/features/task-tab";
import { useAppData } from "@/lib/providers/app-data-provider";
import type { Workspace } from "@/lib/workspace";
import type { Project } from "@/lib/types";
import { FolderKanban } from "lucide-react";

export function WorkspaceLivePanel({ workspace }: { workspace: Workspace }) {
  const { projects, loading, error } = useAppData();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | undefined>(undefined);
  const [detailProject, setDetailProject] = React.useState<Project | null>(null);

  const scoped = projects.filter((p) => p.workspace === workspace);

  function openEdit(project: Project) {
    setDetailProject(null);
    setEditingProject(project);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Projects
          </h2>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={() => {
              setEditingProject(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" /> New Project
          </Button>
        </div>
        {error ? (
          <PlaceholderEmptyState icon={FolderKanban} title="Couldn't load projects" description={error} />
        ) : loading ? (
          <CardGridSkeleton count={3} />
        ) : scoped.length === 0 ? (
          <PlaceholderEmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create the first project for this workspace."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {scoped.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setDetailProject(project)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Tasks
        </h2>
        <TaskTab workspace={workspace} />
      </section>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        defaultWorkspace={workspace}
      />
      <ProjectDetailSheet
        project={detailProject}
        onOpenChange={(open) => !open && setDetailProject(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
