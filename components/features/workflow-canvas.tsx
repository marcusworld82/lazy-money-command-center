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

  React.useEffect(() => {
    onChange(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onConnect = React.useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
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
        <div className="h-[520px] overflow-hidden rounded-2xl border border-glass-border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            colorMode={theme}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} color="rgba(255,255,255,0.08)" />
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
