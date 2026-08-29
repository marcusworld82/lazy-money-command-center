"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_CONFIG, isNavGroup } from "@/lib/nav-config";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { BusinessSwitcher } from "@/components/layout/business-switcher";
import { useSidebar } from "@/lib/providers/sidebar-provider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-svh shrink-0 flex-col border-r border-glass-border bg-sidebar backdrop-blur-xl transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-glass-border px-3 pt-4 pb-3",
          collapsed ? "flex-col" : "justify-between",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Logo size="sm" />
          {!collapsed && (
            <span className="truncate font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
              Lazy Money OS
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <div className="px-3 pt-3 pb-3">
        <BusinessSwitcher collapsed={collapsed} />
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-4 pb-4">
          {NAV_CONFIG.map((entry) =>
            isNavGroup(entry) ? (
              <div key={entry.label} className="flex flex-col gap-1">
                {!collapsed && (
                  <span className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {entry.label}
                  </span>
                )}
                <div className="flex flex-col gap-0.5">
                  {entry.items.map((item) => (
                    <SidebarNavItem key={item.href} item={item} collapsed={collapsed} indent />
                  ))}
                </div>
              </div>
            ) : (
              <SidebarNavItem key={entry.href} item={entry} collapsed={collapsed} />
            ),
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
