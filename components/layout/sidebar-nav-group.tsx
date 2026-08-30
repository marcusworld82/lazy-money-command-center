"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { NavGroup } from "@/lib/nav-config";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Expandable parent with a persistent sub-list underneath — the Blotato
 * pattern. Social is the only nav entry that uses this.
 *
 * The group auto-opens whenever the current route is inside it, and the user
 * can still toggle it closed. When the rail is collapsed to icons the parent
 * becomes a plain link to its default child, since there's no room for a list.
 */
export function SidebarNavGroup({
  group,
  collapsed,
}: {
  group: NavGroup;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const withinGroup = pathname.startsWith(group.basePath);
  const [open, setOpen] = React.useState(withinGroup);
  const Icon = group.icon;

  // Navigating into the section from elsewhere should reveal it. Deliberate:
  // this reacts to a route change, which isn't knowable during render, and the
  // user's own toggle must survive re-renders — so it can't be derived state.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (withinGroup) setOpen(true);
  }, [withinGroup]);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={group.href}
            aria-current={withinGroup ? "page" : undefined}
            className={cn(
              "group relative flex items-center justify-center overflow-hidden rounded-lg px-2.5 py-2 transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              withinGroup
                ? "bg-gradient-glow-subtle text-sidebar-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {withinGroup && (
              <span
                aria-hidden
                className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent-brand"
              />
            )}
            <Icon
              className={cn("size-4 shrink-0", withinGroup && "text-accent-brand")}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{group.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          withinGroup
            ? "bg-gradient-glow-subtle text-sidebar-foreground"
            : "text-sidebar-foreground/70",
        )}
      >
        {withinGroup && (
          <span
            aria-hidden
            className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent-brand"
          />
        )}
        <Icon
          className={cn("size-4 shrink-0", withinGroup && "text-accent-brand")}
        />
        <span className="truncate">{group.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto size-3.5 shrink-0 opacity-50 transition-transform duration-150",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-subtle pl-1.5">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  );
}
