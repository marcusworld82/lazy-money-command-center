"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Project } from "@/lib/types";
import { STATUS_LABEL, useAppData } from "@/lib/providers/app-data-provider";
import { getWorkspaceMeta } from "@/lib/workspace";

interface ProjectDetailSheetProps {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (project: Project) => void;
}

export function ProjectDetailSheet({ project, onOpenChange, onEdit }: ProjectDetailSheetProps) {
  const { tasks, updateProject, deleteProject, createTask, setTaskStatus, deleteTask } =
    useAppData();
  const [notes, setNotes] = React.useState("");
  const [newTask, setNewTask] = React.useState("");

  React.useEffect(() => {
    // Deliberate: syncs the draft textarea to whichever project the sheet opens for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(project?.notes ?? "");
  }, [project]);

  if (!project) return null;
  const workspace = getWorkspaceMeta(project.workspace);
  const linkedTasks = tasks.filter((t) => t.projectId === project.id);

  function handleNotesBlur() {
    if (project && notes !== (project.notes ?? "")) {
      updateProject(project.id, { notes });
    }
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !project) return;
    createTask({ title: newTask.trim(), projectId: project.id, workspace: project.workspace });
    setNewTask("");
  }

  return (
    <Sheet open={!!project} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{STATUS_LABEL[project.status]}</Badge>
            <Badge variant="secondary">{workspace.label}</Badge>
          </div>
          <SheetTitle>{project.title}</SheetTitle>
          <SheetDescription>
            {project.dueDate ? `Due ${project.dueDate}` : "No due date"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4">
          <Label className="text-xs uppercase tracking-wider text-foreground/50">
            Description
          </Label>
          <p className="text-sm text-foreground/75">
            {project.description || "No description."}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <Label htmlFor="project-notes" className="text-xs uppercase tracking-wider text-foreground/50">
            Notes
          </Label>
          <Textarea
            id="project-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes…"
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-2 px-4">
          <Label className="text-xs uppercase tracking-wider text-foreground/50">Tasks</Label>
          <div className="flex flex-col gap-1">
            {linkedTasks.length === 0 && (
              <p className="text-xs text-foreground/45">No tasks linked yet.</p>
            )}
            {linkedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={(checked) =>
                    setTaskStatus(task.id, checked ? "done" : "todo")
                  }
                />
                <span
                  className={
                    task.status === "done"
                      ? "flex-1 text-sm text-foreground/45 line-through"
                      : "flex-1 text-sm"
                  }
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-1">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task…"
              className="h-8"
            />
            <Button type="submit" size="icon" variant="secondary" aria-label="Add task">
              <Plus className="size-4" />
            </Button>
          </form>
        </div>

        <SheetFooter className="mt-auto flex-row justify-between gap-2">
          <Button
            variant="ghost"
            className="gap-1.5 text-destructive"
            onClick={() => {
              deleteProject(project.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button variant="secondary" className="gap-1.5" onClick={() => onEdit(project)}>
            <Pencil className="size-4" /> Edit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
