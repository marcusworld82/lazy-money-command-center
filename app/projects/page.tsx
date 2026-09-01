"use client";

import * as React from "react";
import { List, LayoutGrid, Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { ProjectCard } from "@/components/ui/project-card";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABEL, useAppData } from "@/lib/providers/app-data-provider";
import type { Project, ProjectStatus } from "@/lib/types";
import { ProjectFormDialog } from "@/components/features/project-form-dialog";
import { ProjectDetailSheet } from "@/components/features/project-detail-sheet";
import { TaskTab } from "@/components/features/task-tab";
import { NoteTab } from "@/components/features/note-tab";
import { cn } from "@/lib/utils";

const STATUSES: ProjectStatus[] = ["not-started", "in-progress", "review", "done"];

export default function ProjectsPage() {
  const { projects, loading, error } = useAppData();
  const [view, setView] = React.useState<"list" | "board">("board");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "all">("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | undefined>(undefined);
  const [detailProject, setDetailProject] = React.useState<Project | null>(null);

  const filtered = projects.filter(
    (p) => statusFilter === "all" || p.status === statusFilter,
  );

  function openCreate() {
    setEditingProject(undefined);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setDetailProject(null);
    setEditingProject(project);
    setFormOpen(true);
  }

  return (
    <div className="marco-library flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Work
        </span>
        <h1 className="text-display-sm uppercase">Projects</h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Organize work across every business — projects, tasks, and notes, saved to
          Supabase.
        </p>
      </header>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
              >
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-subtle bg-surface-card p-1">
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
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="size-3.5" /> New Project
              </Button>
            </div>
          </div>

          {error ? (
            <PlaceholderEmptyState
              icon={FolderKanban}
              title="Couldn't load projects"
              description={error}
            />
          ) : loading ? (
            <CardGridSkeleton />
          ) : filtered.length === 0 ? (
            <PlaceholderEmptyState
              icon={FolderKanban}
              title="No projects match"
              description="Try a different filter, or create a new project."
            />
          ) : view === "board" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STATUSES.map((status) => (
                <div key={status} className="flex flex-col gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {STATUS_LABEL[status]}
                    <span className="ml-1.5 text-foreground/30">
                      {filtered.filter((p) => p.status === status).length}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-3">
                    {filtered
                      .filter((p) => p.status === status)
                      .map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => setDetailProject(project)}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Panel className="flex flex-col divide-y divide-subtle">
              {filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setDetailProject(project)}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5",
                  )}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{project.title}</span>
                    {project.description && (
                      <span className="truncate text-xs text-foreground/50">
                        {project.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{STATUS_LABEL[project.status]}</Badge>
                    {project.dueDate && (
                      <span className="text-xs text-foreground/50">
                        Due {project.dueDate}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </Panel>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <TaskTab />
        </TabsContent>

        <TabsContent value="notes">
          <NoteTab />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editingProject} />
      <ProjectDetailSheet
        project={detailProject}
        onOpenChange={(open) => !open && setDetailProject(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
