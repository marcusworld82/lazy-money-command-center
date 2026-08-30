"use client";

import * as React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import {
  NODE_TYPES,
  NODE_KINDS,
  WorkflowCanvasProvider,
  type WorkflowNodeKind,
  type WorkflowNodeData,
} from "@/components/features/workflow-nodes";
import { WorkflowNodePalette } from "@/components/features/workflow-node-palette";
import { CanvasToolbar, type CanvasTool } from "@/components/features/canvas-toolbar";
import type { Asset, WorkflowRunEventType } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useTheme } from "@/lib/providers/theme-provider";

interface WorkflowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  assets: Asset[];
  onChange: (nodes: Node[], edges: Edge[]) => void;
  onNodeEvent?: (event: { type: WorkflowRunEventType; label: string }) => void;
}

function CanvasInner({
  initialNodes,
  initialEdges,
  assets,
  onChange,
  onNodeEvent,
}: WorkflowCanvasProps) {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [tool, setTool] = React.useState<CanvasTool>("select");

  // Lightweight undo stack over the node/edge graph. Every committed change
  // pushes a snapshot; undo/redo walk it without touching the persisted canvas.
  const [past, setPast] = React.useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = React.useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const snapshot = React.useCallback(() => {
    setPast((p) => [...p.slice(-24), { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  function undo() {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [{ nodes, edges }, ...f]);
      setNodes(previous.nodes);
      setEdges(previous.edges);
      return p.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, { nodes, edges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(1);
    });
  }

  React.useEffect(() => {
    onChange(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onConnect = React.useCallback(
    (connection: Connection) => {
      snapshot();
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, snapshot],
  );

  function handleAddNode(kind: WorkflowNodeKind) {
    const meta = NODE_KINDS.find((n) => n.kind === kind)!;
    const newNode: Node = {
      id: generateId(),
      type: kind,
      position: {
        x: 80 + Math.random() * 240,
        y: 60 + Math.random() * 240,
      },
      data: {
        kind,
        label: meta.label,
        ...(kind === "approval" ? { status: "pending" } : {}),
      } satisfies WorkflowNodeData,
    };
    snapshot();
    setNodes((nds) => [...nds, newNode]);
  }

  const contextValue = React.useMemo(
    () => ({ assets, onNodeEvent }),
    [assets, onNodeEvent],
  );

  return (
    <WorkflowCanvasProvider value={contextValue}>
      <div className="flex flex-col gap-3">
        <WorkflowNodePalette onAdd={handleAddNode} />
        <div className="relative h-[520px] overflow-hidden rounded-xl border border-subtle">
          <CanvasToolbar
            active={tool}
            onSelect={setTool}
            onUndo={undo}
            onRedo={redo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            colorMode={theme}
            // Soft curved connectors rather than straight or right-angled.
            defaultEdgeOptions={{
              type: "bezier",
              style: { stroke: "var(--accent-brand)", strokeWidth: 2 },
            }}
            connectionLineType={ConnectionLineType.Bezier}
            // Pan tool drags the viewport; select tool drags nodes.
            panOnDrag={tool === "pan"}
            nodesDraggable={tool === "select"}
            selectionOnDrag={tool === "select"}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} size={1} color="rgba(255,255,255,0.07)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </WorkflowCanvasProvider>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
