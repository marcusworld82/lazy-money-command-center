"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type { Project, ProjectStatus } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  workspace_id: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    workspace: row.workspace_id as Workspace,
    status: row.status as ProjectStatus,
    dueDate: row.due_date ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(): Promise<Project[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProjectRow[]).map(mapRow);
}

export async function createProject(input: {
  title: string;
  description: string;
  workspace: Workspace;
  status: ProjectStatus;
  dueDate?: string;
  notes?: string;
}): Promise<Project> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: input.title,
      description: input.description,
      workspace_id: input.workspace,
      status: input.status,
      due_date: input.dueDate ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  const project = mapRow(data as ProjectRow);
  await logActivity(supabase, {
    type: "project",
    action: "created",
    refId: project.id,
    label: "Project created",
    detail: project.title,
    workspaceId: project.workspace,
  });
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>,
): Promise<Project> {
  const supabase = getSupabaseServerClient();
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.description !== undefined) updatePayload.description = patch.description;
  if (patch.workspace !== undefined) updatePayload.workspace_id = patch.workspace;
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.dueDate !== undefined) updatePayload.due_date = patch.dueDate ?? null;
  if (patch.notes !== undefined) updatePayload.notes = patch.notes ?? null;

  const { data, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const project = mapRow(data as ProjectRow);
  await logActivity(supabase, {
    type: "project",
    action: patch.status === "done" ? "completed" : "updated",
    refId: project.id,
    label: "Project updated",
    detail: project.title,
    workspaceId: project.workspace,
  });
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("projects")
    .select("title, workspace_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;

  if (existing) {
    await logActivity(supabase, {
      type: "project",
      action: "deleted",
      refId: id,
      label: "Project deleted",
      detail: existing.title as string,
      workspaceId: existing.workspace_id as Workspace,
    });
  }
}
