import type { Workspace } from "@/lib/workspace";
import type { Project, ProjectStatus, Task, Note, Asset } from "@/lib/types";

export function projectsByWorkspace(projects: Project[], workspace: Workspace): Project[] {
  return projects.filter((p) => p.workspace === workspace);
}

export function tasksByWorkspace(tasks: Task[], workspace: Workspace): Task[] {
  return tasks.filter((t) => t.workspace === workspace);
}

export function notesByWorkspace(notes: Note[], workspace: Workspace): Note[] {
  return notes.filter((n) => n.workspace === workspace);
}

export function assetsByWorkspace(assets: Asset[], workspace: Workspace): Asset[] {
  return assets.filter((a) => a.workspace === workspace);
}

export function countProjectsByStatus(
  projects: Project[],
  workspace?: Workspace,
): Record<ProjectStatus, number> {
  const scoped = workspace ? projectsByWorkspace(projects, workspace) : projects;
  return {
    "not-started": scoped.filter((p) => p.status === "not-started").length,
    "in-progress": scoped.filter((p) => p.status === "in-progress").length,
    review: scoped.filter((p) => p.status === "review").length,
    done: scoped.filter((p) => p.status === "done").length,
  };
}

export function countTasksByStatus(tasks: Task[]) {
  return {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}
