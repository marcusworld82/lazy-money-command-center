import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Image as ImageIcon, Video, Bot, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StubNodeKind = "text" | "image" | "video" | "agent" | "approval";

export const NODE_KINDS: { kind: StubNodeKind; label: string; icon: LucideIcon }[] = [
  { kind: "text", label: "Text", icon: FileText },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "video", label: "Video", icon: Video },
  { kind: "agent", label: "Agent", icon: Bot },
  { kind: "approval", label: "Approval", icon: CheckCircle2 },
];

export interface StubNodeData extends Record<string, unknown> {
  kind: StubNodeKind;
  label: string;
}

export function StubNode({ data, selected }: NodeProps) {
  const nodeData = data as StubNodeData;
  const meta = NODE_KINDS.find((n) => n.kind === nodeData.kind) ?? NODE_KINDS[0];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex min-w-36 items-center gap-2 rounded-xl border px-3 py-2.5 shadow-md backdrop-blur-xl",
        selected ? "border-accent-green/70" : "border-glass-border",
      )}
      style={{ backgroundColor: "var(--glass-strong)" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent-green" />
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-foreground/45">
          {meta.label}
        </span>
        <span className="text-sm font-medium">{nodeData.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-accent-green" />
    </div>
  );
}

export const NODE_TYPES = { stub: StubNode };
