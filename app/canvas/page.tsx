"use client";

import * as React from "react";
import type { Node, Edge } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  Workflow,
  Plus,
  Trash2,
  Save,
  Copy,
  ArrowLeft,
  CheckCheck,
  BookmarkPlus,
  Bookmark,
} from "lucide-react";
import { useAppData } from "@/lib/providers/app-data-provider";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";
import { WorkflowCanvas } from "@/components/features/workflow-canvas";
import { AgentDock } from "@/components/features/agent-dock";
import { PageHero } from "@/components/layout/page-hero";
import { WorkflowPreview } from "@/components/features/workflow-preview";
import { listRuns, appendRunEvent } from "@/lib/actions/workflows";
import type { WorkflowCanvas as Canvas, WorkflowRun, WorkflowRunEventType } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function WorkflowsPage() {
  const {
    workflows,
    assets,
    saveWorkflow,
    duplicateWorkflow,
    setWorkflowTemplate,
    deleteWorkflow,
    loading,
    error,
  } = useAppData();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState<null | { asTemplate: boolean }>(null);
  const [nameDraft, setNameDraft] = React.useState("");
  const [pendingNodes, setPendingNodes] = React.useState<Node[]>([]);
  const [pendingEdges, setPendingEdges] = React.useState<Edge[]>([]);
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  const [saving, setSaving] = React.useState(false);

  const active = workflows.find((w) => w.id === activeId) ?? null;
  const templates = workflows.filter((w) => w.isTemplate);
  const instances = workflows.filter((w) => !w.isTemplate);
  const activeRun = runs[0] ?? null;

  // Node edits (typing, asset picks, approvals) live in canvas state until Save
  // writes them to Postgres. Without this the run log could show "approved"
  // while the canvas still reloads as pending — so surface the gap explicitly.
  const dirty =
    !!active &&
    (JSON.stringify(pendingNodes) !== JSON.stringify(active.nodes) ||
      JSON.stringify(pendingEdges) !== JSON.stringify(active.edges));

  // Runs are canvas-detail data, so the page fetches them itself rather than
  // loading every run for every canvas into the global provider.
  React.useEffect(() => {
    if (!activeId) {
      // Deliberate: clearing stale runs when the selection closes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRuns([]);
      return;
    }
    let cancelled = false;
    listRuns(activeId)
      .then((r) => {
        if (!cancelled) setRuns(r);
      })
      .catch(() => {
        if (!cancelled) setRuns([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function logRunEvent(event: { type: WorkflowRunEventType; label: string }) {
    if (!activeRun) return;
    const updated = await appendRunEvent(activeRun.id, event);
    setRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nameDraft.trim() || !creating) return;
    const canvas = await saveWorkflow({
      name: nameDraft.trim(),
      workspace: DEFAULT_WORKSPACE,
      nodes: [],
      edges: [],
      isTemplate: creating.asTemplate,
    });
    setNameDraft("");
    setCreating(null);
    setActiveId(canvas.id);
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    try {
      await saveWorkflow({
        id: active.id,
        name: active.name,
        workspace: active.workspace,
        nodes: pendingNodes,
        edges: pendingEdges,
        isTemplate: active.isTemplate,
      });
      await logRunEvent({ type: "node-updated", label: "Canvas saved" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(canvas: Canvas) {
    const copy = await duplicateWorkflow(canvas.id);
    setActiveId(copy.id);
  }

  function CanvasCard({ canvas }: { canvas: Canvas }) {
    return (
      <Panel interactive className="flex flex-col gap-3 p-4">
        <button
          onClick={() => setActiveId(canvas.id)}
          className="flex flex-col gap-3 text-left"
        >
          <WorkflowPreview nodes={canvas.nodes} edges={canvas.edges} />
          <div className="flex flex-col">
            <span className="font-heading text-sm font-semibold">{canvas.name}</span>
            <span className="text-xs text-foreground/45">
              {canvas.nodes.length} node{canvas.nodes.length === 1 ? "" : "s"} ·{" "}
              {formatRelativeTime(canvas.updatedAt)}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1.5">
          {canvas.isTemplate ? (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => handleDuplicate(canvas)}
            >
              <Copy className="size-3.5" /> Use template
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => setWorkflowTemplate(canvas.id, true)}
            >
              <BookmarkPlus className="size-3.5" /> Save as template
            </Button>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHero
        eyebrow="Build"
        title="Canvas"
        description="Chain text, media, prompts, and approvals into reusable node graphs. Save one as a template, then duplicate it to start each run — or ask the Canvas Agent to wire it for you."
        actions={
          !creating && !active ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => setCreating({ asTemplate: true })}
              >
                <Bookmark className="size-3.5" /> New Template
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setCreating({ asTemplate: false })}
              >
                <Plus className="size-3.5" /> New Canvas
              </Button>
            </>
          ) : undefined
        }
      />

      {creating && (
        <Panel className="p-4">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={
                creating.asTemplate ? "Name this template…" : "Name this workflow…"
              }
              autoFocus
            />
            <Button type="submit" size="sm">
              Create
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCreating(null)}
            >
              Cancel
            </Button>
          </form>
        </Panel>
      )}

      {error && (
        <PlaceholderEmptyState
          icon={Workflow}
          title="Couldn't load workflows"
          description={error}
        />
      )}

      {loading && !error && <ListSkeleton count={3} />}

      {!loading &&
        !error &&
        (active ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft className="size-3.5" /> All workflows
                </Button>
                <h2 className="font-heading text-sm font-semibold">{active.name}</h2>
                {active.isTemplate && (
                  <Badge variant="secondary" className="text-[10px]">
                    Template
                  </Badge>
                )}
                {dirty && (
                  <span className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                    <span className="size-1.5 rounded-full bg-accent-brand" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="size-3.5" /> {saving ? "Saving…" : "Save"}
                </Button>
                {!active.isTemplate && activeRun?.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() =>
                      logRunEvent({ type: "completed", label: "Workflow completed" })
                    }
                  >
                    <CheckCheck className="size-3.5" /> Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-destructive"
                  onClick={async () => {
                    await deleteWorkflow(active.id);
                    setActiveId(null);
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_260px]">
              <WorkflowCanvas
                key={active.id}
                initialNodes={active.nodes}
                initialEdges={active.edges}
                assets={assets}
                onChange={(nodes, edges) => {
                  setPendingNodes(nodes);
                  setPendingEdges(edges);
                }}
                onNodeEvent={logRunEvent}
              />

              <Panel className="flex h-fit flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Run History
                  </h3>
                  {activeRun && (
                    <Badge variant="secondary" className="text-[10px]">
                      {activeRun.status}
                    </Badge>
                  )}
                </div>
                {!activeRun || activeRun.log.length === 0 ? (
                  <p className="text-xs text-foreground/45">
                    {active.isTemplate
                      ? "Templates don't track runs. Duplicate this to start one."
                      : "No events yet."}
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2.5">
                    {[...activeRun.log].reverse().map((event, i) => (
                      <li key={i} className="flex flex-col">
                        <span className="text-xs">{event.label}</span>
                        <span className="text-[10px] text-foreground/40">
                          {event.type} · {formatRelativeTime(event.at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>
          </div>
        ) : workflows.length === 0 ? (
          <PlaceholderEmptyState
            icon={Workflow}
            title="No workflows yet"
            description="Workflows let you chain steps like Brief → Shot List → Delivery into a reusable, repeatable canvas."
            action={
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => setCreating({ asTemplate: false })}
              >
                New Workflow
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {templates.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
                  Templates
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {templates.map((canvas) => (
                    <CanvasCard key={canvas.id} canvas={canvas} />
                  ))}
                </div>
              </section>
            )}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
                Workflows
              </h2>
              {instances.length === 0 ? (
                <p className="text-xs text-foreground/45">
                  No workflow instances yet — duplicate a template above to start one.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {instances.map((canvas) => (
                    <CanvasCard key={canvas.id} canvas={canvas} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ))}

      <AgentDock agentId="canvas" />
    </div>
  );
}
