"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKSPACES, type Workspace } from "@/lib/workspace";
import type { Project, ProjectStatus } from "@/lib/types";
import { STATUS_LABEL, useAppData } from "@/lib/providers/app-data-provider";

const STATUSES: ProjectStatus[] = ["not-started", "in-progress", "review", "done"];

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  defaultWorkspace?: Workspace;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  defaultWorkspace,
}: ProjectFormDialogProps) {
  const { createProject, updateProject } = useAppData();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [workspace, setWorkspace] = React.useState<Workspace>(
    defaultWorkspace ?? "shared-os",
  );
  const [status, setStatus] = React.useState<ProjectStatus>("not-started");
  const [dueDate, setDueDate] = React.useState("");

  React.useEffect(() => {
    // Deliberate: resets the form to the target project (or blank) each time it opens.
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle(project?.title ?? "");
    setDescription(project?.description ?? "");
    setWorkspace(project?.workspace ?? defaultWorkspace ?? "shared-os");
    setStatus(project?.status ?? "not-started");
    setDueDate(project?.dueDate ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, project, defaultWorkspace]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (project) {
      updateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        workspace,
        status,
        dueDate: dueDate.trim() || undefined,
      });
    } else {
      createProject({
        title: title.trim(),
        description: description.trim(),
        workspace,
        status,
        dueDate: dueDate.trim() || undefined,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Workspace</Label>
              <Select value={workspace} onValueChange={(v) => setWorkspace(v as Workspace)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSPACES.map((w) => (
                    <SelectItem key={w.slug} value={w.slug}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-due">Due date</Label>
            <Input
              id="project-due"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g. Sep 20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
