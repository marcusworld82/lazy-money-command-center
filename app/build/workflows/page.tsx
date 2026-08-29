"use client";

import * as React from "react";
import type { Node, Edge } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Workflow, Plus, Trash2, Save } from "lucide-react";
import { useAppData } from "@/lib/providers/app-data-provider";
import { WorkflowCanvas } from "@/components/features/workflow-canvas";

export default function WorkflowsPage() {
  const { workflows, saveWorkflow, deleteWorkflow, loading, error } = useAppData();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const [pendingNodes, setPendingNodes] = React.useState<Node[]>([]);
  const [pendingEdges, setPendingEdges] = React.useState<Edge[]>([]);

  const active = workflows.find((w) => w.id === activeId) ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    const canvas = await saveWorkflow({ name: nameDraft.trim(), nodes: [], edges: [] });
    setNameDraft("");
    setCreating(false);
    setActiveId(canvas.id);
  }

  function handleSave() {
    if (!active) return;
    saveWorkflow({ id: active.id, name: active.name, nodes: pendingNodes, edges: pendingEdges });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
            Build
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Workflows
          </h1>
          <p className="max-w-xl text-sm text-foreground/60">
            Visual shell for chaining steps into a reusable canvas. Nodes are placeholders —
            real node logic arrives in a later phase.
          </p>
        </div>
        {!creating && (
          <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> New Workflow
          </Button>
        )}
      </header>

      {creating && (
        <GlassPanel className="p-4">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Name this workflow…"
              autoFocus
            />
            <Button type="submit" size="sm">
              Create
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </form>
        </GlassPanel>
      )}

      {error && (
        <PlaceholderEmptyState icon={Workflow} title="Couldn't load workflows" description={error} />
      )}

      {loading && <ListSkeleton count={3} />}

      {!loading && !error && workflows.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {workflows.map((w) => (
            <Button
              key={w.id}
              size="sm"
              variant={activeId === w.id ? "secondary" : "ghost"}
              onClick={() => setActiveId(w.id)}
              className="gap-1.5"
            >
              <Workflow className="size-3.5" />
              {w.name}
            </Button>
          ))}
        </div>
      )}

      {!loading && !error && (active ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold">{active.name}</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleSave}>
                <Save className="size-3.5" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive"
                onClick={() => {
                  deleteWorkflow(active.id);
                  setActiveId(null);
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
          <WorkflowCanvas
            initialNodes={active.nodes}
            initialEdges={active.edges}
            onChange={(nodes, edges) => {
              setPendingNodes(nodes);
              setPendingEdges(edges);
            }}
          />
        </div>
      ) : (
        <PlaceholderEmptyState
          icon={Workflow}
          title={workflows.length === 0 ? "No workflows yet" : "Pick a workflow above"}
          description="Workflows let you chain steps like Brief → Shot List → Delivery into a reusable, repeatable canvas."
          action={
            !creating &&
            workflows.length === 0 && (
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => setCreating(true)}>
                New Workflow
              </Button>
            )
          }
        />
      ))}
    </div>
  );
}
