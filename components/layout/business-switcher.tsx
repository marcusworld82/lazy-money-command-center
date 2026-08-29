"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { WORKSPACES, getWorkspaceMeta } from "@/lib/workspace";
import { useWorkspace } from "@/lib/providers/workspace-provider";
import { cn } from "@/lib/utils";

export function BusinessSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const router = useRouter();
  const active = getWorkspaceMeta(activeWorkspace);

  function handleSelect(slug: (typeof WORKSPACES)[number]["slug"]) {
    setActiveWorkspace(slug);
    router.push(getWorkspaceMeta(slug).href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "h-auto w-full justify-between gap-2 px-2.5 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-green text-[10px] font-bold text-surface-white">
              {active.shortLabel.slice(0, 2).toUpperCase()}
            </span>
            {!collapsed && (
              <span className="truncate text-sm font-medium">{active.label}</span>
            )}
          </span>
          {!collapsed && <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {WORKSPACES.map((workspace) => (
          <DropdownMenuItem
            key={workspace.slug}
            onSelect={() => handleSelect(workspace.slug)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{workspace.label}</span>
              <span className="text-xs text-foreground/50">{workspace.tagline}</span>
            </span>
            {workspace.slug === activeWorkspace ? (
              <Check className="size-4 shrink-0" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
