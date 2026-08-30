"use client";

import * as React from "react";
import {
  MousePointer2,
  Hand,
  Scissors,
  StickyNote,
  MessageSquare,
  Undo2,
  Redo2,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type CanvasTool = "select" | "pan" | "cut" | "note" | "comment";

const TOOLS: { id: CanvasTool; label: string; icon: LucideIcon }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "cut", label: "Cut", icon: Scissors },
  { id: "note", label: "Note", icon: StickyNote },
  { id: "comment", label: "Comment", icon: MessageSquare },
];

/** Hoisted so it isn't redefined on every render of the toolbar. */
function ToolButton({
  label,
  icon: Icon,
  isActive,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={isActive}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors",
            isActive
              ? "bg-accent-brand text-surface-white"
              : "text-foreground/60 hover:bg-white/10 hover:text-foreground",
            disabled && "pointer-events-none opacity-35",
          )}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Icon-only vertical strip floating over the canvas.
 *
 * Select and Pan drive real React Flow interaction. Cut / Note / Comment are
 * reserved slots — they render and can be selected, but deliberately carry no
 * behavior yet rather than pretending to work.
 */
export function CanvasToolbar({
  active,
  onSelect,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  active: CanvasTool;
  onSelect: (tool: CanvasTool) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-xl border border-subtle bg-surface-raised p-1">
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          icon={tool.icon}
          isActive={active === tool.id}
          onClick={() => onSelect(tool.id)}
        />
      ))}
      <div className="my-0.5 h-px bg-subtle" />
      <ToolButton label="Undo" icon={Undo2} disabled={!canUndo} onClick={onUndo} />
      <ToolButton label="Redo" icon={Redo2} disabled={!canRedo} onClick={onRedo} />
      <div className="my-0.5 h-px bg-subtle" />
      <ToolButton label="Canvas settings" icon={Settings2} disabled />
    </div>
  );
}
