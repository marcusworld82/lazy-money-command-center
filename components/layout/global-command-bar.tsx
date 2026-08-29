"use client";

import * as React from "react";
import {
  Search,
  FolderPlus,
  ListPlus,
  Workflow,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_CONFIG, isNavGroup } from "@/lib/nav-config";
import { useRouter } from "next/navigation";

const QUICK_ACTIONS = [
  { label: "Create project", icon: FolderPlus },
  { label: "Add task", icon: ListPlus },
  { label: "Start workflow", icon: Workflow },
  { label: "Add asset", icon: ImagePlus },
];

export function GlobalCommandBar() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLeaves = NAV_CONFIG.flatMap((entry) =>
    isNavGroup(entry) ? entry.items : [entry],
  );

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-glass-border bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="w-full max-w-sm justify-start gap-2 text-foreground/50 sm:w-64"
      >
        <Search className="size-4" />
        <span className="text-sm">Search…</span>
        <kbd className="ml-auto hidden rounded border border-glass-border bg-white/10 px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </Button>

      <div className="hidden items-center gap-1.5 lg:flex">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Icon className="size-3.5" />
                <span className="text-xs">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Available starting Phase 2</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search pages, projects, actions…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {navLeaves.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Quick actions">
              {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                <CommandItem key={label} disabled>
                  <Icon className="size-4" />
                  {label}
                  <span className="ml-auto text-xs text-foreground/40">Phase 2</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
