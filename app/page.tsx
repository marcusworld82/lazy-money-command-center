"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { ActivityFeedItem } from "@/components/ui/activity-feed-item";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton, ListSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lightbulb, ListChecks, StickyNote, Workflow, FolderPlus, ImagePlus } from "lucide-react";
import { useAppData } from "@/lib/providers/app-data-provider";
import { countTasksByStatus } from "@/lib/selectors";
import { getWorkspaceMeta, type Workspace } from "@/lib/workspace";

const PULSE_WORKSPACES: Workspace[] = ["clothing-brand", "ai-cinematic", "money-gap"];

export default function CommandCenterPage() {
  const router = useRouter();
  const { projects, tasks, assets, activity, createTask, createNote, loading, error } = useAppData();
  const [ideaDraft, setIdeaDraft] = React.useState("");
  const [taskDraft, setTaskDraft] = React.useState("");
  const [noteDraft, setNoteDraft] = React.useState("");

  const taskCounts = countTasksByStatus(tasks);

  const priorityProjects = [...projects]
    .sort((a, b) => {
      if (a.status === "in-progress" && b.status !== "in-progress") return -1;
      if (b.status === "in-progress" && a.status !== "in-progress") return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .slice(0, 4);

  function submitQuickCapture(kind: "idea" | "task" | "note", e: React.FormEvent) {
    e.preventDefault();
    if (kind === "idea" && ideaDraft.trim()) {
      createNote({ content: ideaDraft.trim() });
      setIdeaDraft("");
    }
    if (kind === "task" && taskDraft.trim()) {
      createTask({ title: taskDraft.trim() });
      setTaskDraft("");
    }
    if (kind === "note" && noteDraft.trim()) {
      createNote({ content: noteDraft.trim() });
      setNoteDraft("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col gap-2 p-6 md:p-8">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground/55">
          Daily Focus
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Run every business from one command center.
        </h1>
        <p className="max-w-2xl text-sm text-foreground/60 md:text-base">
          Backed by Supabase — everything here persists across sessions, devices, and
          deployments.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="flex flex-col gap-3 xl:col-span-2">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Priority Projects
          </h2>
          {error ? (
            <PlaceholderEmptyState title="Couldn't load projects" description={error} />
          ) : loading ? (
            <CardGridSkeleton count={4} />
          ) : priorityProjects.length === 0 ? (
            <PlaceholderEmptyState title="No projects yet" description="Create one from Build > Projects." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {priorityProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push("/build/projects")}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Task Progress
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="To Do" value={String(taskCounts.todo)} />
            <StatCard label="In Progress" value={String(taskCounts["in-progress"])} />
            <StatCard label="Done" value={String(taskCounts.done)} />
          </div>

          <h2 className="mt-2 font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Business Pulse
          </h2>
          <div className="flex flex-col gap-2">
            {PULSE_WORKSPACES.map((slug) => {
              const meta = getWorkspaceMeta(slug);
              const workspaceProjects = projects.filter((p) => p.workspace === slug);
              const inProgress = workspaceProjects.filter((p) => p.status === "in-progress").length;
              const assetCount = assets.filter((a) => a.workspace === slug).length;
              return (
                <Panel key={slug} className="flex flex-col gap-0.5 p-3">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className="text-xs text-foreground/55">
                    {workspaceProjects.length === 0
                      ? "No projects yet"
                      : `${inProgress} in progress`}
                  </span>
                  <span className="text-xs text-foreground/40">{assetCount} assets</span>
                </Panel>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Command Activity Feed
          </h2>
          {error ? (
            <PlaceholderEmptyState title="Couldn't load activity" description={error} />
          ) : loading ? (
            <ListSkeleton count={5} />
          ) : (
            <Panel className="p-4">
              {activity.length === 0 ? (
                <p className="p-2 text-sm text-foreground/55">No activity yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {activity.slice(0, 8).map((item) => (
                    <ActivityFeedItem key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Quick Capture
          </h2>
          <Panel className="flex flex-col gap-3 p-4">
            <form onSubmit={(e) => submitQuickCapture("idea", e)} className="flex items-center gap-2">
              <Lightbulb className="size-4 shrink-0 text-foreground/50" />
              <Input
                value={ideaDraft}
                onChange={(e) => setIdeaDraft(e.target.value)}
                placeholder="Capture an idea…"
                className="bg-transparent"
              />
              <Button type="submit" size="sm" variant="secondary">
                + Idea
              </Button>
            </form>
            <form onSubmit={(e) => submitQuickCapture("task", e)} className="flex items-center gap-2">
              <ListChecks className="size-4 shrink-0 text-foreground/50" />
              <Input
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                placeholder="Add a task…"
                className="bg-transparent"
              />
              <Button type="submit" size="sm" variant="secondary">
                + Task
              </Button>
            </form>
            <form onSubmit={(e) => submitQuickCapture("note", e)} className="flex items-center gap-2">
              <StickyNote className="size-4 shrink-0 text-foreground/50" />
              <Input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Jot a note…"
                className="bg-transparent"
              />
              <Button type="submit" size="sm" variant="secondary">
                + Note
              </Button>
            </form>
          </Panel>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Creative &amp; Workflow Studio
        </h2>
        <PlaceholderEmptyState
          icon={Workflow}
          title="Nothing in the studio yet"
          description="Start a new project, spin up a workflow, or add an asset to see it appear here."
          action={
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => router.push("/build/projects")}
              >
                <FolderPlus className="size-3.5" /> New Project
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => router.push("/build/workflows")}
              >
                <Workflow className="size-3.5" /> New Workflow
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => router.push("/build/assets")}
              >
                <ImagePlus className="size-3.5" /> Add Asset
              </Button>
            </div>
          }
        />
      </section>
    </div>
  );
}
