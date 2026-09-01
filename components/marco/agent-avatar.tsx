import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
export function AgentAvatar({ color, name, size = "md", className }: { color: string; name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return <span className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--agent-color)]", size === "sm" ? "size-6" : size === "lg" ? "size-10" : "size-7", className)} style={{ "--agent-color": color } as CSSProperties}><img src="/agent-mark.png" alt="" className="h-[78%] w-[78%] object-contain" /><span className="sr-only">{name}</span></span>;
}
