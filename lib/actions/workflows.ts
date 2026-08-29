"use server";

import type { Node, Edge } from "@xyflow/react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type { WorkflowCanvas } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

interface WorkflowRow {
  id: string;
  name: string;
  workspace_id: string | null;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

function mapRow(row: WorkflowRow): WorkflowCanvas {
  return {
    id: row.id,
    name: row.name,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    nodes: row.nodes,
    edges: row.edges,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkflows(): Promise<WorkflowCanvas[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workflow_canvases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as WorkflowRow[]).map(mapRow);
}

export async function saveWorkflow(input: {
  id?: string;
  name: string;
  workspace?: Workspace;
  nodes: Node[];
  edges: Edge[];
}): Promise<WorkflowCanvas> {
  const supabase = getSupabaseServerClient();

  if (input.id) {
    const { data, error } = await supabase
      .from("workflow_canvases")
      .update({
        name: input.name,
        workspace_id: input.workspace ?? null,
        nodes: input.nodes,
        edges: input.edges,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;

    const workflow = mapRow(data as WorkflowRow);
    await logActivity(supabase, {
      type: "workflow",
      action: "updated",
      refId: workflow.id,
      label: "Workflow saved",
      detail: workflow.name,
      workspaceId: workflow.workspace,
    });
    return workflow;
  }

  const { data, error } = await supabase
    .from("workflow_canvases")
    .insert({
      name: input.name,
      workspace_id: input.workspace ?? null,
      nodes: input.nodes,
      edges: input.edges,
    })
    .select("*")
    .single();
  if (error) throw error;

  const workflow = mapRow(data as WorkflowRow);
  await logActivity(supabase, {
    type: "workflow",
    action: "created",
    refId: workflow.id,
    label: "Workflow created",
    detail: workflow.name,
    workspaceId: workflow.workspace,
  });
  return workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("workflow_canvases")
    .select("name, workspace_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("workflow_canvases").delete().eq("id", id);
  if (error) throw error;

  if (existing) {
    await logActivity(supabase, {
      type: "workflow",
      action: "deleted",
      refId: id,
      label: "Workflow deleted",
      detail: existing.name as string,
      workspaceId: (existing.workspace_id as Workspace | null) ?? undefined,
    });
  }
}
