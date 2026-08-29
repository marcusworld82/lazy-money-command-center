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
  AssetType,
  ActivityItem,
  ActivityType,
  ActivityAction,
  WorkflowCanvas,
} from "@/lib/types";
import { SAMPLE_PROJECTS, SAMPLE_ASSETS } from "@/lib/sample-data";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "lm-os:app-data";

interface AppDataState {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  assets: Asset[];
  workflows: WorkflowCanvas[];
  activity: ActivityItem[];
}

const EMPTY_STATE: AppDataState = {
  projects: [],
  tasks: [],
  notes: [],
  assets: [],
  workflows: [],
  activity: [],
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

function buildSeedState(): AppDataState {
  const now = Date.now();
  const projects: Project[] = SAMPLE_PROJECTS.map((p, i) => {
    const status = (
      { "Not Started": "not-started", "In Progress": "in-progress", Review: "review", Done: "done" } as const
    )[p.status];
    const createdAt = new Date(now - (SAMPLE_PROJECTS.length - i) * 3600_000).toISOString();
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      workspace: p.workspace,
      status,
      dueDate: p.dueDate,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const assets: Asset[] = SAMPLE_ASSETS.map((a, i) => ({
    id: a.id,
    filename: a.filename,
    type: a.type,
    workspace: a.workspace,
    url: "",
    createdAt: new Date(now - (SAMPLE_ASSETS.length - i) * 3600_000).toISOString(),
  }));
  const activity: ActivityItem[] = [...projects]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((p) => ({
      id: generateId(),
      type: "project",
      action: "created",
      refId: p.id,
      label: "Project created",
      detail: p.title,
      timestamp: p.createdAt,
    }));
  return { ...EMPTY_STATE, projects, assets, activity };
}

type Action =
  | { type: "HYDRATE"; state: AppDataState }
  | { type: "APPLY"; updater: (s: AppDataState) => AppDataState };

function reducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "APPLY":
      return action.updater(state);
    default:
      return state;
  }
}

function pushActivity(
  state: AppDataState,
  entry: Omit<ActivityItem, "id" | "timestamp"> & { timestamp?: string },
): AppDataState {
  const item: ActivityItem = {
    id: generateId(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    ...entry,
  };
  return { ...state, activity: [item, ...state.activity] };
}

interface AppDataContextValue {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  assets: Asset[];
  workflows: WorkflowCanvas[];
  activity: ActivityItem[];
  hydrated: boolean;

  createProject: (input: {
    title: string;
    description: string;
    workspace: Workspace;
    status: ProjectStatus;
    dueDate?: string;
    notes?: string;
  }) => Project;
  updateProject: (id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => void;
  deleteProject: (id: string) => void;

  createTask: (input: {
    title: string;
    workspace?: Workspace;
    projectId?: string;
    dueDate?: string;
  }) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;

  createNote: (input: { content: string; workspace?: Workspace }) => Note;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;

  addAsset: (input: {
    filename: string;
    type: AssetType;
    workspace?: Workspace;
    url: string;
  }) => Asset;
  removeAsset: (id: string) => void;

  saveWorkflow: (input: {
    id?: string;
    name: string;
    workspace?: Workspace;
    nodes: Node[];
    edges: Edge[];
  }) => WorkflowCanvas;
  deleteWorkflow: (id: string) => void;
}

const AppDataContext = React.createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, EMPTY_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Deliberate: localStorage isn't available during SSR, so hydration (real
    // stored data, or a first-run seed) happens in a client-only pass after mount.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = stored ? (JSON.parse(stored) as AppDataState) : buildSeedState();
    dispatch({ type: "HYDRATE", state: next });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const apply = React.useCallback((updater: (s: AppDataState) => AppDataState) => {
    dispatch({ type: "APPLY", updater });
  }, []);

  const activityEntry = React.useCallback(
    (
      type: ActivityType,
      action: ActivityAction,
      refId: string,
      label: string,
      detail?: string,
    ) => ({ type, action, refId, label, detail }),
    [],
  );

  const createProject = React.useCallback<AppDataContextValue["createProject"]>(
    (input) => {
      const now = new Date().toISOString();
      const project: Project = { id: generateId(), createdAt: now, updatedAt: now, ...input };
      apply((s) =>
        pushActivity(
          { ...s, projects: [project, ...s.projects] },
          activityEntry("project", "created", project.id, "Project created", project.title),
        ),
      );
      return project;
    },
    [apply, activityEntry],
  );

  const updateProject = React.useCallback<AppDataContextValue["updateProject"]>(
    (id, patch) => {
      apply((s) => {
        const target = s.projects.find((p) => p.id === id);
        if (!target) return s;
        const updated: Project = { ...target, ...patch, updatedAt: new Date().toISOString() };
        return pushActivity(
          { ...s, projects: s.projects.map((p) => (p.id === id ? updated : p)) },
          activityEntry(
            "project",
            patch.status === "done" ? "completed" : "updated",
            id,
            "Project updated",
            updated.title,
          ),
        );
      });
    },
    [apply, activityEntry],
  );

  const deleteProject = React.useCallback<AppDataContextValue["deleteProject"]>(
    (id) => {
      apply((s) => {
        const target = s.projects.find((p) => p.id === id);
        if (!target) return s;
        return pushActivity(
          {
            ...s,
            projects: s.projects.filter((p) => p.id !== id),
            tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
          },
          activityEntry("project", "deleted", id, "Project deleted", target.title),
        );
      });
    },
    [apply, activityEntry],
  );

  const createTask = React.useCallback<AppDataContextValue["createTask"]>(
    (input) => {
      const task: Task = {
        id: generateId(),
        status: "todo",
        createdAt: new Date().toISOString(),
        ...input,
      };
      apply((s) =>
        pushActivity(
          { ...s, tasks: [task, ...s.tasks] },
          activityEntry("task", "created", task.id, "Task created", task.title),
        ),
      );
      return task;
    },
    [apply, activityEntry],
  );

  const updateTask = React.useCallback<AppDataContextValue["updateTask"]>(
    (id, patch) => {
      apply((s) => {
        const target = s.tasks.find((t) => t.id === id);
        if (!target) return s;
        const updated: Task = { ...target, ...patch };
        return pushActivity(
          { ...s, tasks: s.tasks.map((t) => (t.id === id ? updated : t)) },
          activityEntry(
            "task",
            patch.status === "done" ? "completed" : "updated",
            id,
            patch.status === "done" ? "Task completed" : "Task updated",
            updated.title,
          ),
        );
      });
    },
    [apply, activityEntry],
  );

  const setTaskStatus = React.useCallback<AppDataContextValue["setTaskStatus"]>(
    (id, status) => updateTask(id, { status }),
    [updateTask],
  );

  const deleteTask = React.useCallback<AppDataContextValue["deleteTask"]>(
    (id) => {
      apply((s) => {
        const target = s.tasks.find((t) => t.id === id);
        if (!target) return s;
        return pushActivity(
          { ...s, tasks: s.tasks.filter((t) => t.id !== id) },
          activityEntry("task", "deleted", id, "Task deleted", target.title),
        );
      });
    },
    [apply, activityEntry],
  );

  const createNote = React.useCallback<AppDataContextValue["createNote"]>(
    (input) => {
      const now = new Date().toISOString();
      const note: Note = { id: generateId(), createdAt: now, updatedAt: now, ...input };
      apply((s) =>
        pushActivity(
          { ...s, notes: [note, ...s.notes] },
          activityEntry(
            "note",
            "created",
            note.id,
            "Note added",
            note.content.slice(0, 60),
          ),
        ),
      );
      return note;
    },
    [apply, activityEntry],
  );

  const updateNote = React.useCallback<AppDataContextValue["updateNote"]>(
    (id, content) => {
      apply((s) => {
        const target = s.notes.find((n) => n.id === id);
        if (!target) return s;
        const updated: Note = { ...target, content, updatedAt: new Date().toISOString() };
        return pushActivity(
          { ...s, notes: s.notes.map((n) => (n.id === id ? updated : n)) },
          activityEntry("note", "updated", id, "Note updated", content.slice(0, 60)),
        );
      });
    },
    [apply, activityEntry],
  );

  const deleteNote = React.useCallback<AppDataContextValue["deleteNote"]>(
    (id) => {
      apply((s) => {
        const target = s.notes.find((n) => n.id === id);
        if (!target) return s;
        return pushActivity(
          { ...s, notes: s.notes.filter((n) => n.id !== id) },
          activityEntry("note", "deleted", id, "Note deleted", target.content.slice(0, 60)),
        );
      });
    },
    [apply, activityEntry],
  );

  const addAsset = React.useCallback<AppDataContextValue["addAsset"]>(
    (input) => {
      const asset: Asset = { id: generateId(), createdAt: new Date().toISOString(), ...input };
      apply((s) =>
        pushActivity(
          { ...s, assets: [asset, ...s.assets] },
          activityEntry("asset", "created", asset.id, "Asset added", asset.filename),
        ),
      );
      return asset;
    },
    [apply, activityEntry],
  );

  const removeAsset = React.useCallback<AppDataContextValue["removeAsset"]>(
    (id) => {
      apply((s) => {
        const target = s.assets.find((a) => a.id === id);
        if (!target) return s;
        return pushActivity(
          { ...s, assets: s.assets.filter((a) => a.id !== id) },
          activityEntry("asset", "deleted", id, "Asset removed", target.filename),
        );
      });
    },
    [apply, activityEntry],
  );

  const saveWorkflow = React.useCallback<AppDataContextValue["saveWorkflow"]>(
    (input) => {
      // Computed up front (not inside the `apply` updater) — dispatch doesn't run
      // the updater synchronously, so a value assigned from within it isn't
      // available for the `return` below by the time this function returns.
      const now = new Date().toISOString();
      const existing = input.id ? state.workflows.find((w) => w.id === input.id) : undefined;
      const saved: WorkflowCanvas = existing
        ? { ...existing, ...input, updatedAt: now }
        : { id: generateId(), createdAt: now, updatedAt: now, ...input };

      apply((s) =>
        pushActivity(
          {
            ...s,
            workflows: existing
              ? s.workflows.map((w) => (w.id === saved.id ? saved : w))
              : [saved, ...s.workflows],
          },
          activityEntry(
            "workflow",
            existing ? "updated" : "created",
            saved.id,
            existing ? "Workflow saved" : "Workflow created",
            saved.name,
          ),
        ),
      );
      return saved;
    },
    [apply, activityEntry, state.workflows],
  );

  const deleteWorkflow = React.useCallback<AppDataContextValue["deleteWorkflow"]>(
    (id) => {
      apply((s) => {
        const target = s.workflows.find((w) => w.id === id);
        if (!target) return s;
        return pushActivity(
          { ...s, workflows: s.workflows.filter((w) => w.id !== id) },
          activityEntry("workflow", "deleted", id, "Workflow deleted", target.name),
        );
      });
    },
    [apply, activityEntry],
  );

  const value: AppDataContextValue = {
    ...state,
    hydrated,
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
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = React.useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}

export { STATUS_LABEL };
