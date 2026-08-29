"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type { Task, TaskStatus } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  project_id: string | null;
  workspace_id: string | null;
  due_date: string | null;
  created_at: string;
}

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    projectId: row.project_id ?? undefined,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listTasks(): Promise<Task[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TaskRow[]).map(mapRow);
}

export async function createTask(input: {
  title: string;
  workspace?: Workspace;
  projectId?: string;
  dueDate?: string;
}): Promise<Task> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      status: "todo",
      project_id: input.projectId ?? null,
      workspace_id: input.workspace ?? null,
      due_date: input.dueDate ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  const task = mapRow(data as TaskRow);
  await logActivity(supabase, {
    type: "task",
    action: "created",
    refId: task.id,
    label: "Task created",
    detail: task.title,
    workspaceId: task.workspace,
  });
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "createdAt">>,
): Promise<Task> {
  const supabase = getSupabaseServerClient();
  const updatePayload: Record<string, unknown> = {};
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.projectId !== undefined) updatePayload.project_id = patch.projectId ?? null;
  if (patch.workspace !== undefined) updatePayload.workspace_id = patch.workspace ?? null;
  if (patch.dueDate !== undefined) updatePayload.due_date = patch.dueDate ?? null;

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const task = mapRow(data as TaskRow);
  await logActivity(supabase, {
    type: "task",
    action: patch.status === "done" ? "completed" : "updated",
    refId: task.id,
    label: patch.status === "done" ? "Task completed" : "Task updated",
    detail: task.title,
    workspaceId: task.workspace,
  });
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("title, workspace_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;

  if (existing) {
    await logActivity(supabase, {
      type: "task",
      action: "deleted",
      refId: id,
      label: "Task deleted",
      detail: existing.title as string,
      workspaceId: (existing.workspace_id as Workspace | null) ?? undefined,
    });
  }
}
