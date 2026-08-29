"use client";

import * as React from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Workspace } from "@/lib/workspace";
import type {
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  Note,
  Asset,
  ActivityItem,
  WorkflowCanvas,
} from "@/lib/types";
import * as projectActions from "@/lib/actions/projects";
import * as taskActions from "@/lib/actions/tasks";
import * as noteActions from "@/lib/actions/notes";
import * as assetActions from "@/lib/actions/assets";
import * as workflowActions from "@/lib/actions/workflows";
import { listActivity } from "@/lib/actions/activity";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

interface AppDataContextValue {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  assets: Asset[];
  workflows: WorkflowCanvas[];
  activity: ActivityItem[];
  loading: boolean;
  error: string | null;

  createProject: (input: {
    title: string;
    description: string;
    workspace: Workspace;
    status: ProjectStatus;
    dueDate?: string;
    notes?: string;
  }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  createTask: (input: {
    title: string;
    workspace?: Workspace;
    projectId?: string;
    dueDate?: string;
  }) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  createNote: (input: { content: string; workspace?: Workspace }) => Promise<Note>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  /** formData must contain a "file" entry and optionally a "workspace" entry. */
  addAsset: (formData: FormData) => Promise<Asset>;
  removeAsset: (id: string) => Promise<void>;

  saveWorkflow: (input: {
    id?: string;
    name: string;
    workspace?: Workspace;
    nodes: Node[];
    edges: Edge[];
  }) => Promise<WorkflowCanvas>;
  deleteWorkflow: (id: string) => Promise<void>;

  refresh: () => Promise<void>;
}

const AppDataContext = React.createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [workflows, setWorkflows] = React.useState<WorkflowCanvas[]>([]);
  const [activity, setActivity] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t, n, a, w, act] = await Promise.all([
        projectActions.listProjects(),
        taskActions.listTasks(),
        noteActions.listNotes(),
        assetActions.listAssets(),
        workflowActions.listWorkflows(),
        listActivity(),
      ]);
      setProjects(p);
      setTasks(t);
      setNotes(n);
      setAssets(a);
      setWorkflows(w);
      setActivity(act);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data from Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Deliberate: initial fetch-on-mount. Server Actions can't run during SSR
    // render, so the first load happens in a client-only pass after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Every mutator awaits its Server Action, then re-fetches all six lists so the
  // UI reflects authoritative server state (including the activity_log row the
  // action just inserted) — no optimistic/local-only updates this phase.

  const createProject = React.useCallback<AppDataContextValue["createProject"]>(
    async (input) => {
      const project = await projectActions.createProject(input);
      await refresh();
      return project;
    },
    [refresh],
  );

  const updateProject = React.useCallback<AppDataContextValue["updateProject"]>(
    async (id, patch) => {
      await projectActions.updateProject(id, patch);
      await refresh();
    },
    [refresh],
  );

  const deleteProject = React.useCallback<AppDataContextValue["deleteProject"]>(
    async (id) => {
      await projectActions.deleteProject(id);
      await refresh();
    },
    [refresh],
  );

  const createTask = React.useCallback<AppDataContextValue["createTask"]>(
    async (input) => {
      const task = await taskActions.createTask(input);
      await refresh();
      return task;
    },
    [refresh],
  );

  const updateTask = React.useCallback<AppDataContextValue["updateTask"]>(
    async (id, patch) => {
      await taskActions.updateTask(id, patch);
      await refresh();
    },
    [refresh],
  );

  const setTaskStatus = React.useCallback<AppDataContextValue["setTaskStatus"]>(
    (id, status) => updateTask(id, { status }),
    [updateTask],
  );

  const deleteTask = React.useCallback<AppDataContextValue["deleteTask"]>(
    async (id) => {
      await taskActions.deleteTask(id);
      await refresh();
    },
    [refresh],
  );

  const createNote = React.useCallback<AppDataContextValue["createNote"]>(
    async (input) => {
      const note = await noteActions.createNote(input);
      await refresh();
      return note;
    },
    [refresh],
  );

  const updateNote = React.useCallback<AppDataContextValue["updateNote"]>(
    async (id, content) => {
      await noteActions.updateNote(id, content);
      await refresh();
    },
    [refresh],
  );

  const deleteNote = React.useCallback<AppDataContextValue["deleteNote"]>(
    async (id) => {
      await noteActions.deleteNote(id);
      await refresh();
    },
    [refresh],
  );

  const addAsset = React.useCallback<AppDataContextValue["addAsset"]>(
    async (formData) => {
      const asset = await assetActions.addAsset(formData);
      await refresh();
      return asset;
    },
    [refresh],
  );

  const removeAsset = React.useCallback<AppDataContextValue["removeAsset"]>(
    async (id) => {
      await assetActions.removeAsset(id);
      await refresh();
    },
    [refresh],
  );

  const saveWorkflow = React.useCallback<AppDataContextValue["saveWorkflow"]>(
    async (input) => {
      const workflow = await workflowActions.saveWorkflow(input);
      await refresh();
      return workflow;
    },
    [refresh],
  );

  const deleteWorkflow = React.useCallback<AppDataContextValue["deleteWorkflow"]>(
    async (id) => {
      await workflowActions.deleteWorkflow(id);
      await refresh();
    },
    [refresh],
  );

  const value: AppDataContextValue = {
    projects,
    tasks,
    notes,
    assets,
    workflows,
    activity,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    setTaskStatus,
    deleteTask,
    createNote,
    updateNote,
    deleteNote,
    addAsset,
    removeAsset,
    saveWorkflow,
    deleteWorkflow,
    refresh,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = React.useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}

export { STATUS_LABEL };
