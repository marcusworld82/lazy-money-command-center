"use server";

import type { Node, Edge } from "@xyflow/react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type {
  WorkflowCanvas,
  WorkflowRun,
  WorkflowRunEvent,
  WorkflowRunEventType,
  WorkflowRunStatus,
} from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

interface WorkflowRow {
  id: string;
  name: string;
  workspace_id: string | null;
  nodes: Node[];
  edges: Edge[];
  is_template: boolean;
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
    isTemplate: row.is_template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface WorkflowRunRow {
  id: string;
  canvas_id: string;
  status: string;
  log: WorkflowRunEvent[];
  created_at: string;
  updated_at: string;
}

function mapRunRow(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    status: row.status as WorkflowRunStatus,
    log: row.log ?? [],
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
  isTemplate?: boolean;
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
      is_template: input.isTemplate ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;

  const workflow = mapRow(data as WorkflowRow);
  await logActivity(supabase, {
    type: "workflow",
    action: "created",
    refId: workflow.id,
    label: workflow.isTemplate ? "Workflow template created" : "Workflow created",
    detail: workflow.name,
    workspaceId: workflow.workspace,
  });

  // Instances (not templates) get a run to track their history from the start.
  if (!workflow.isTemplate) {
    await openRun(workflow.id, `${workflow.name} created`);
  }
  return workflow;
}

/**
 * Deep-copies a template into a brand-new instance canvas. The template row is
 * never touched, which is the whole point — you start from it without editing it.
 */
export async function duplicateWorkflow(
  canvasId: string,
  name?: string,
): Promise<WorkflowCanvas> {
  const supabase = getSupabaseServerClient();
  const { data: source, error: sourceError } = await supabase
    .from("workflow_canvases")
    .select("*")
    .eq("id", canvasId)
    .single();
  if (sourceError) throw sourceError;

  const src = source as WorkflowRow;
  const { data, error } = await supabase
    .from("workflow_canvases")
    .insert({
      name: name?.trim() || `${src.name} (copy)`,
      workspace_id: src.workspace_id,
      // structuredClone so the new row never shares object identity with the template.
      nodes: structuredClone(src.nodes),
      edges: structuredClone(src.edges),
      is_template: false,
    })
    .select("*")
    .single();
  if (error) throw error;

  const workflow = mapRow(data as WorkflowRow);
  await logActivity(supabase, {
    type: "workflow",
    action: "created",
    refId: workflow.id,
    label: "Workflow duplicated",
    detail: `${workflow.name} (from ${src.name})`,
    workspaceId: workflow.workspace,
  });
  await openRun(workflow.id, `Duplicated from template "${src.name}"`);
  return workflow;
}

export async function setWorkflowTemplate(
  id: string,
  isTemplate: boolean,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("workflow_canvases")
    .update({ is_template: isTemplate, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
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

/* ------------------------------------------------------------------ */
/* Run history                                                         */
/* ------------------------------------------------------------------ */

export async function openRun(canvasId: string, label: string): Promise<WorkflowRun> {
  const supabase = getSupabaseServerClient();
  const firstEvent: WorkflowRunEvent = {
    type: "created",
    label,
    at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({ canvas_id: canvasId, status: "draft", log: [firstEvent] })
    .select("*")
    .single();
  if (error) throw error;
  return mapRunRow(data as WorkflowRunRow);
}

export async function listRuns(canvasId: string): Promise<WorkflowRun[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("canvas_id", canvasId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as WorkflowRunRow[]).map(mapRunRow);
}

/**
 * Appends one event to a run's log. Reads the current log and writes the
 * extended array back — jsonb has no native append, and at single-user scale
 * there is no concurrent-writer risk to design around.
 */
export async function appendRunEvent(
  runId: string,
  event: { type: WorkflowRunEventType; label: string },
): Promise<WorkflowRun> {
  const supabase = getSupabaseServerClient();
  const { data: current, error: readError } = await supabase
    .from("workflow_runs")
    .select("log, status")
    .eq("id", runId)
    .single();
  if (readError) throw readError;

  const log = [
    ...((current.log as WorkflowRunEvent[]) ?? []),
    { ...event, at: new Date().toISOString() },
  ];

  // First real activity moves a draft run into progress; completing closes it.
  let status = current.status as WorkflowRunStatus;
  if (event.type === "completed") status = "completed";
  else if (status === "draft") status = "in-progress";

  const { data, error } = await supabase
    .from("workflow_runs")
    .update({ log, status, updated_at: new Date().toISOString() })
    .eq("id", runId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRunRow(data as WorkflowRunRow);
}
