import type { Workspace } from "@/lib/workspace";
import type { Node, Edge } from "@xyflow/react";

export type ProjectStatus = "not-started" | "in-progress" | "review" | "done";

export interface Project {
  id: string;
  title: string;
  description: string;
  workspace: Workspace;
  status: ProjectStatus;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  projectId?: string;
  workspace?: Workspace;
  dueDate?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  workspace?: Workspace;
  createdAt: string;
  updatedAt: string;
}

export type AssetType = "image" | "video" | "document";

export interface Asset {
  id: string;
  filename: string;
  type: AssetType;
  workspace?: Workspace;
  url: string;
  createdAt: string;
}

export type ActivityType = "project" | "task" | "note" | "asset" | "workflow";
export type ActivityAction = "created" | "updated" | "completed" | "deleted";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  refId: string;
  label: string;
  /** UI-only addition to the spec'd shape — lets the feed keep its two-line format. */
  detail?: string;
  timestamp: string;
}

export interface WorkflowCanvas {
  id: string;
  name: string;
  workspace?: Workspace;
  nodes: Node[];
  edges: Edge[];
  /** Templates are reusable starting points; instances are duplicated from one. */
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowRunStatus = "draft" | "in-progress" | "completed";

export type WorkflowRunEventType =
  | "created"
  | "node-updated"
  | "approved"
  | "rejected"
  | "completed";

export interface WorkflowRunEvent {
  type: WorkflowRunEventType;
  label: string;
  at: string;
}

export interface WorkflowRun {
  id: string;
  canvasId: string;
  status: WorkflowRunStatus;
  log: WorkflowRunEvent[];
  createdAt: string;
  updatedAt: string;
}
