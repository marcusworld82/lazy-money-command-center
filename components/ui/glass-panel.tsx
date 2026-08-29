import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  interactive?: boolean;
}

export function GlassPanel({
  as: Tag = "div",
  interactive = false,
  className,
  ...props
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-glass-border bg-glass backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]",
        className,
      )}
      {...props}
    />
  );
}
