"use client";

import * as React from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
  CheckCircle2,
  XCircle,
  Package,
  CircleDashed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Asset } from "@/lib/types";
import {
  GenerationBar,
  DEFAULT_GENERATION_SETTINGS,
  type GenerationModel,
  type GenerationSettings,
} from "@/components/features/generation-bar";
import type { WorkflowRunEventType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type WorkflowNodeKind =
  | "text"
  | "image"
  | "video"
  | "prompt"
  | "approval"
  | "output";

export const NODE_KINDS: {
  kind: WorkflowNodeKind;
  label: string;
  icon: LucideIcon;
}[] = [
  { kind: "text", label: "Text", icon: FileText },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "video", label: "Video", icon: Video },
  { kind: "prompt", label: "Prompt", icon: Sparkles },
  { kind: "approval", label: "Approval", icon: CheckCircle2 },
  { kind: "output", label: "Output", icon: Package },
];

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface WorkflowNodeData extends Record<string, unknown> {
  kind: WorkflowNodeKind;
  label: string;
  /** text + prompt nodes */
  content?: string;
  /** image + video nodes — reference into the Assets library */
  assetId?: string;
  assetName?: string;
  assetUrl?: string;
  /** approval nodes */
  status?: ApprovalStatus;
  /** prompt nodes — model/ratio/resolution/count, persisted with the canvas */
  generation?: GenerationSettings;
}

/** Placeholder model list for the in-node bar; Phase 5 supplies the real one. */
const NODE_MODELS: GenerationModel[] = [
  { id: "m1", name: "Image Model A", description: "Fast stills", costPerRun: 0.02 },
  { id: "m2", name: "Image Model B", description: "Higher fidelity", costPerRun: 0.08 },
  { id: "m4", name: "Video Model A", description: "Image-to-video", costPerRun: 0.35 },
];

/**
 * Canvas-scoped context so node components can reach the asset library and
 * report semantic events (approve/reject) up to the page that owns the run log,
 * without prop-drilling through React Flow's internal node rendering.
 */
interface WorkflowCanvasContextValue {
  assets: Asset[];
  onNodeEvent?: (event: { type: WorkflowRunEventType; label: string }) => void;
}

const WorkflowCanvasContext = React.createContext<WorkflowCanvasContextValue>({
  assets: [],
});

export const WorkflowCanvasProvider = WorkflowCanvasContext.Provider;

function useWorkflowCanvasContext() {
  return React.useContext(WorkflowCanvasContext);
}

function NodeShell({
  kind,
  selected,
  children,
  wide,
}: {
  kind: WorkflowNodeKind;
  selected: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const meta = NODE_KINDS.find((n) => n.kind === kind) ?? NODE_KINDS[0];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        // Flat dark node card: thin border, medium radius, no blur or shadow.
        "flex flex-col gap-2 rounded-xl border bg-surface-raised px-3 py-2.5",
        wide ? "w-64" : "min-w-40",
        selected ? "border-accent-brand" : "border-subtle",
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent-brand" />
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-brand/15 text-accent-brand">
          <Icon className="size-4" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/45">
          {meta.label}
        </span>
      </div>
      {children}
      <Handle type="source" position={Position.Bottom} className="!bg-accent-brand" />
    </div>
  );
}

/** Shared editable-text body for Text and Prompt nodes. */
function TextualNode({
  id,
  data,
  selected,
  placeholder,
  footer,
}: {
  id: string;
  data: WorkflowNodeData;
  selected: boolean;
  placeholder: string;
  footer?: React.ReactNode;
}) {
  const { updateNodeData } = useReactFlow();
  return (
    <NodeShell kind={data.kind} selected={!!selected} wide>
      <textarea
        // nodrag/nowheel keep typing and scrolling from panning the canvas.
        className="nodrag nowheel min-h-20 w-full resize-y rounded-md border border-subtle bg-transparent p-2 text-xs outline-none focus-visible:border-accent-brand/60"
        value={(data.content as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />
      {footer}
    </NodeShell>
  );
}

export function TextNode({ id, data, selected }: NodeProps) {
  return (
    <TextualNode
      id={id}
      data={data as WorkflowNodeData}
      selected={!!selected}
      placeholder="Write text content…"
    />
  );
}

/**
 * Prompt node. Carries the same GenerationBar the Generate page uses, in its
 * inline variant — so Phase 5 can wire one component in both places rather than
 * reimplementing model/ratio/count controls per surface. Settings live in node
 * data, so they persist with the canvas like any other node field.
 */
export function PromptNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const { updateNodeData } = useReactFlow();

  const settings: GenerationSettings = {
    ...DEFAULT_GENERATION_SETTINGS,
    modelId: NODE_MODELS[0].id,
    ...(nodeData.generation ?? {}),
  };

  return (
    <TextualNode
      id={id}
      data={nodeData}
      selected={!!selected}
      placeholder="Structured prompt…"
      footer={
        <div className="nodrag flex flex-col gap-1.5">
          <GenerationBar
            variant="inline"
            models={NODE_MODELS}
            value={settings}
            onChange={(next) => updateNodeData(id, { generation: next })}
            className="flex-col items-stretch gap-1.5 p-1.5"
          />
          <span className="text-[10px] text-foreground/40">
            Connects to models in Phase 5
          </span>
        </div>
      }
    />
  );
}

/** Shared asset-picker body for Image and Video nodes. */
function AssetNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const { updateNodeData } = useReactFlow();
  const { assets } = useWorkflowCanvasContext();

  const matching = assets.filter((a) =>
    nodeData.kind === "image" ? a.type === "image" : a.type === "video",
  );

  return (
    <NodeShell kind={nodeData.kind} selected={!!selected} wide>
      {nodeData.assetUrl && nodeData.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nodeData.assetUrl}
          alt={nodeData.assetName ?? ""}
          className="h-24 w-full rounded-md border border-subtle object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-md border border-subtle bg-white/5">
          {nodeData.assetName ? (
            <span className="px-2 text-center text-[11px] text-foreground/60">
              {nodeData.assetName}
            </span>
          ) : (
            <CircleDashed className="size-5 text-foreground/30" />
          )}
        </div>
      )}
      <select
        className="nodrag w-full rounded-md border border-subtle bg-transparent p-1.5 text-xs outline-none focus-visible:border-accent-brand/60"
        value={nodeData.assetId ?? ""}
        onChange={(e) => {
          const asset = matching.find((a) => a.id === e.target.value);
          updateNodeData(id, {
            assetId: asset?.id,
            assetName: asset?.filename,
            assetUrl: asset?.url,
          });
        }}
      >
        <option value="">
          {matching.length === 0 ? "No assets yet" : "Select an asset…"}
        </option>
        {matching.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.filename}
          </option>
        ))}
      </select>
    </NodeShell>
  );
}

export function ImageNode(props: NodeProps) {
  return <AssetNode {...props} />;
}

export function VideoNode(props: NodeProps) {
  return <AssetNode {...props} />;
}

export function ApprovalNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const { updateNodeData } = useReactFlow();
  const { onNodeEvent } = useWorkflowCanvasContext();
  const status = (nodeData.status as ApprovalStatus) ?? "pending";

  function decide(next: ApprovalStatus) {
    updateNodeData(id, { status: next });
    onNodeEvent?.({
      type: next === "approved" ? "approved" : "rejected",
      label: `${nodeData.label ?? "Approval"} ${next}`,
    });
  }

  return (
    <NodeShell kind="approval" selected={!!selected}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => decide("approved")}
          className={cn(
            "nodrag flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
            status === "approved"
              ? "border-accent-brand bg-accent-brand/20 text-accent-brand"
              : "border-subtle text-foreground/60 hover:border-accent-brand/50",
          )}
        >
          <CheckCircle2 className="size-3" /> Approve
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          className={cn(
            "nodrag flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
            status === "rejected"
              ? "border-foreground/50 bg-white/10 text-foreground"
              : "border-subtle text-foreground/60 hover:border-foreground/40",
          )}
        >
          <XCircle className="size-3" /> Reject
        </button>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-foreground/40">
        {status}
      </span>
    </NodeShell>
  );
}

export function OutputNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const { updateNodeData } = useReactFlow();
  return (
    <NodeShell kind="output" selected={!!selected}>
      <input
        className="nodrag w-full rounded-md border border-subtle bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-accent-brand/60"
        value={(nodeData.content as string) ?? ""}
        placeholder="Deliverable name…"
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />
      <span className="text-[10px] text-foreground/40">End of workflow</span>
    </NodeShell>
  );
}

/**
 * Phase 2 shipped a single "stub" node type (including an Agent kind that Phase 4
 * drops — agents are Phase 6). Any canvas saved then still deserializes: it maps
 * to this generic renderer instead of crashing on an unknown node type.
 */
export function LegacyStubNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const known = NODE_KINDS.some((n) => n.kind === nodeData.kind);
  return (
    <NodeShell kind={known ? nodeData.kind : "text"} selected={!!selected}>
      <span className="text-sm font-medium">{nodeData.label ?? "Node"}</span>
    </NodeShell>
  );
}

export const NODE_TYPES = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  prompt: PromptNode,
  approval: ApprovalNode,
  output: OutputNode,
  stub: LegacyStubNode,
};
