"use client";

import * as React from "react";
import { DEFAULT_WORKSPACE, type Workspace } from "@/lib/workspace";

const STORAGE_KEY = "lm-os:active-workspace";

interface WorkspaceContextValue {
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = React.useState<Workspace>(
    DEFAULT_WORKSPACE,
  );

  React.useEffect(() => {
    // Deliberate: localStorage isn't available during SSR, so the persisted
    // active workspace is applied in a client-only pass after mount.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Workspace | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setActiveWorkspaceState(stored);
  }, []);

  const setActiveWorkspace = React.useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    window.localStorage.setItem(STORAGE_KEY, workspace);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, setActiveWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
