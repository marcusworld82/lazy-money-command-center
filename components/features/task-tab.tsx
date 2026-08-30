"use client";

import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Plus, ListChecks, Trash2 } from "lucide-react";
import type { TaskStatus } from "@/lib/types";
import { useAppData } from "@/lib/providers/app-data-provider";
import { getWorkspaceMeta, type Workspace } from "@/lib/workspace";

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

export function TaskTab({ workspace }: { workspace?: Workspace }) {
  const { tasks, projects, createTask, updateTask, deleteTask, loading, error } = useAppData();
  const [title, setTitle] = React.useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask({ title: title.trim(), workspace });
    setTitle("");
  }

  const scoped = workspace ? tasks.filter((t) => t.workspace === workspace) : tasks;
  const sorted = [...scoped].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a standalone task…"
        />
        <Button type="submit" variant="secondary" className="gap-1.5 shrink-0">
          <Plus className="size-4" /> Add Task
        </Button>
      </form>

      {error ? (
        <PlaceholderEmptyState icon={ListChecks} title="Couldn't load tasks" description={error} />
      ) : loading ? (
        <ListSkeleton />
      ) : sorted.length === 0 ? (
        <PlaceholderEmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add one above, or link a task to a project from its detail panel."
        />
      ) : (
        <Panel className="flex flex-col divide-y divide-subtle p-0">
          {sorted.map((task) => {
            const project = task.projectId
              ? projects.find((p) => p.id === task.projectId)
              : undefined;
            return (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={(checked) =>
                    updateTask(task.id, { status: checked ? "done" : "todo" })
                  }
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={
                      task.status === "done"
                        ? "truncate text-sm text-foreground/45 line-through"
                        : "truncate text-sm"
                    }
                  >
                    {task.title}
                  </span>
                  {(project || task.workspace) && (
                    <span className="truncate text-xs text-foreground/45">
                      {project ? project.title : getWorkspaceMeta(task.workspace!).label}
                    </span>
                  )}
                </div>
                {task.dueDate && (
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    Due {task.dueDate}
                  </Badge>
                )}
                <Select
                  value={task.status}
                  onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}
                >
                  <SelectTrigger size="sm" className="w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {TASK_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
}
