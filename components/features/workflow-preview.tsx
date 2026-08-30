import type { Node, Edge } from "@xyflow/react";
import { cn } from "@/lib/utils";

/**
 * A tiny static map of a canvas, drawn from saved node positions. Deliberately
 * not a screenshot pipeline — no headless browser, no stored image, no extra
 * dependency; it just normalizes the node coordinates into a fixed viewBox.
 */
export function WorkflowPreview({
  nodes,
  edges,
  className,
}: {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}) {
  if (nodes.length === 0) {
    return (
      <div
        className={cn(
          "flex h-20 items-center justify-center rounded-lg border border-glass-border bg-white/5 text-[11px] text-foreground/35",
          className,
        )}
      >
        Empty canvas
      </div>
    );
  }

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  // Guard the single-node case, where the span would otherwise be 0.
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const W = 100;
  const H = 40;
  const PAD = 6;

  const points = new Map(
    nodes.map((n) => [
      n.id,
      {
        x: PAD + ((n.position.x - minX) / spanX) * (W - PAD * 2),
        y: PAD + ((n.position.y - minY) / spanY) * (H - PAD * 2),
      },
    ]),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn(
        "h-20 w-full rounded-lg border border-glass-border bg-white/5",
        className,
      )}
      aria-hidden
    >
      {edges.map((edge) => {
        const from = points.get(edge.source);
        const to = points.get(edge.target);
        if (!from || !to) return null;
        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-foreground/25"
          />
        );
      })}
      {nodes.map((node) => {
        const p = points.get(node.id)!;
        return (
          <circle
            key={node.id}
            cx={p.x}
            cy={p.y}
            r={2}
            className="fill-accent-green"
          />
        );
      })}
    </svg>
  );
}
