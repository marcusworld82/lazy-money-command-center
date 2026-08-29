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
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/75",
        collapsed ? "justify-center" : indent && "ml-1",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
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
