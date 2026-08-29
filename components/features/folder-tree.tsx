"use client";

import * as React from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import type { KnowledgeNode } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

function TreeNode({ node, depth }: { node: KnowledgeNode; depth: number }) {
  const [open, setOpen] = React.useState(depth === 0);
  const hasChildren = !!node.children?.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5",
          !hasChildren && "cursor-default",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn("size-3.5 shrink-0 text-foreground/40 transition-transform", open && "rotate-90")}
          />
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {open && hasChildren ? (
          <FolderOpen className="size-4 shrink-0 text-foreground/60" />
        ) : (
          <Folder className="size-4 shrink-0 text-foreground/60" />
        )}
        <span className="truncate">{node.label}</span>
      </button>
      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ nodes }: { nodes: KnowledgeNode[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
