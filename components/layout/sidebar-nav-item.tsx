"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLeaf } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SidebarNavItem({
  item,
  collapsed,
  indent = false,
}: {
  item: NavLeaf;
  collapsed: boolean;
  indent?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Active state is the subtle glow gradient plus a red edge marker —
        // not a solid red block (Phase 4.5 Part D).
        active
          ? "bg-gradient-glow-subtle text-sidebar-foreground"
          : "text-sidebar-foreground/70",
        collapsed ? "justify-center" : indent && "ml-1",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent-brand"
        />
      )}
      <Icon
        className={cn("size-4 shrink-0", active && "text-accent-brand")}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <Badge variant="tag" className="ml-auto shrink-0 text-[10px]">
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
