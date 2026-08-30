"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Layers,
  Compass,
  FolderKanban,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Check,
  Minus,
  Plus,
  Sparkles,
  Wand2,
  User,
  Palette,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationModel,
  type GenerationSettings,
} from "@/components/features/generation-bar";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const RAIL: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Home", icon: Home, href: "/super-agent" },
  { label: "Search", icon: Search },
  { label: "Stock", icon: Layers },
  { label: "Explore", icon: Compass },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Library", icon: LibraryBig, href: "/library" },
];

export interface StudioItem {
  id: string;
  title: string;
  /** Shown as a corner badge on the card, e.g. "New". */
  badge?: string;
  meta?: string;
}

/**
 * Magnific-style generation studio: icon rail + tools panel on the left, a
 * large content grid on the right (Phase 4.5 Part E).
 *
 * This replaces the previous bottom-bar-only GenerationBar as the primary UI
 * for Images and Video. GenerationBar itself survives — it's still the right
 * shape inside a Canvas prompt node — but it is no longer the main surface.
 *
 * Everything here is a shell: no provider is called and the Generate button is
 * inert by design. Phase 5 supplies the real model catalogue and wiring.
 */
export function GenerationStudio({
  models,
  items = [],
  emptyTitle,
  emptyDescription,
  promptPlaceholder,
  gridLabel,
}: {
  models: GenerationModel[];
  items?: StudioItem[];
  emptyTitle: string;
  emptyDescription: string;
  promptPlaceholder: string;
  gridLabel: string;
}) {
  const [railOpen, setRailOpen] = React.useState(true);
  const [settings, setSettings] = React.useState<GenerationSettings>({
    ...DEFAULT_GENERATION_SETTINGS,
    modelId: models[0]?.id ?? "",
  });
  const [prompt, setPrompt] = React.useState("");
  const [aiPrompt, setAiPrompt] = React.useState(false);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = React.useState("All types");

  const model = models.find((m) => m.id === settings.modelId) ?? models[0];

  function set<K extends keyof GenerationSettings>(
    key: K,
    next: GenerationSettings[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: next }));
  }

  return (
    <div className="flex min-h-[32rem] gap-3">
      {/* ---- Left: icon rail ---- */}
      <div
        className={cn(
          "hidden shrink-0 flex-col gap-1 rounded-xl border border-subtle bg-surface-card p-1.5 transition-[width] duration-200 sm:flex",
          railOpen ? "w-40" : "w-12",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(railOpen && "self-end")}
          aria-label={railOpen ? "Collapse tool rail" : "Expand tool rail"}
          onClick={() => setRailOpen((v) => !v)}
        >
          {railOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </Button>
        {RAIL.map(({ label, icon: Icon, href }) => {
          const inner = (
            <>
              <Icon className="size-4 shrink-0" />
              {railOpen && <span className="truncate text-xs">{label}</span>}
            </>
          );
          const classes = cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-foreground/65 transition-colors hover:bg-white/10 hover:text-foreground",
            !railOpen && "justify-center",
            !href && "cursor-default opacity-45 hover:bg-transparent",
          );
          const node = href ? (
            <Link href={href} className={classes}>
              {inner}
            </Link>
          ) : (
            // Reserved slot: renders, but deliberately does nothing yet rather
            // than pretending to work.
            <span className={classes} aria-disabled>
              {inner}
            </span>
          );
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>{node}</TooltipTrigger>
              <TooltipContent side="right">
                {href ? label : `${label} — Coming in Phase 5`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* ---- Left: tools panel ---- */}
      <Panel className="flex w-full shrink-0 flex-col gap-4 p-3 lg:w-72">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Model
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-subtle px-2.5 py-2 text-left transition-colors hover:border-accent-brand/60"
              >
                <Sparkles className="size-3.5 shrink-0 text-accent-brand" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium">
                    {model?.name ?? "Select a model"}
                  </span>
                  {model?.description && (
                    <span className="truncate text-[10px] text-foreground/50">
                      {model.description}
                    </span>
                  )}
                </span>
                <ChevronsUpDown className="ml-auto size-3.5 shrink-0 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {models.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onSelect={() => set("modelId", m.id)}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-foreground/50">{m.description}</span>
                  </span>
                  {m.id === settings.modelId && (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            References
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Style", icon: Palette },
              { label: "Character", icon: User },
              { label: "Add", icon: Plus },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-subtle text-foreground/40 disabled:cursor-default"
              >
                <Icon className="size-4" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
              Prompt
            </span>
            <label className="flex items-center gap-1.5 text-[10px] text-foreground/55">
              <Wand2 className="size-3" />
              AI prompt
              <Switch
                checked={aiPrompt}
                onCheckedChange={setAiPrompt}
                aria-label="Enhance prompt with AI"
              />
            </label>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={promptPlaceholder}
            rows={5}
            className="w-full resize-y rounded-lg border border-subtle bg-transparent p-2.5 text-xs outline-none transition-colors focus-visible:border-accent-brand/60"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Count
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-subtle p-0.5">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Decrease count"
              disabled={settings.count <= 1}
              onClick={() => set("count", Math.max(1, settings.count - 1))}
            >
              <Minus className="size-3" />
            </Button>
            <span className="min-w-5 text-center text-xs tabular-nums">
              {settings.count}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Increase count"
              disabled={settings.count >= 8}
              onClick={() => set("count", Math.min(8, settings.count + 1))}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Aspect ratio
          </span>
          <div className="flex flex-wrap gap-1">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("aspectRatio", r)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] transition-colors",
                  settings.aspectRatio === r
                    ? "border-accent-brand bg-accent-brand text-surface-white"
                    : "border-subtle text-foreground/60 hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button className="mt-auto w-full gap-2" disabled>
          Generate
          <span className="rounded bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">
            {model?.costPerRun != null
              ? `$${(model.costPerRun * settings.count).toFixed(2)}`
              : settings.count}
          </span>
        </Button>
        <p className="text-[10px] text-foreground/40">
          Generation connects in Phase 5. Models above are placeholders.
        </p>
      </Panel>

      {/* ---- Right: content grid ---- */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            {gridLabel}
          </h2>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  {typeFilter}
                  <ChevronsUpDown className="size-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["All types", "Images", "Video", "Upscales"].map((t) => (
                  <DropdownMenuItem key={t} onSelect={() => setTypeFilter(t)}>
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-0.5 rounded-lg border border-subtle p-0.5">
              <Button
                size="icon-sm"
                variant={view === "grid" ? "default" : "ghost"}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant={view === "list" ? "default" : "ghost"}
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List className="size-3.5" />
              </Button>
            </div>

            <Button size="icon-sm" variant="ghost" aria-label="Filter" disabled>
              <SlidersHorizontal className="size-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Search" disabled>
              <Search className="size-3.5" />
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <PlaceholderEmptyState
            icon={Sparkles}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-2",
            )}
          >
            {items.map((item) => (
              <Panel
                key={item.id}
                interactive
                className={cn(
                  "relative overflow-hidden",
                  view === "grid" ? "flex flex-col" : "flex items-center gap-3 p-3",
                )}
              >
                {item.badge && (
                  <Badge
                    variant="tag"
                    className="absolute top-2 right-2 z-10 text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                )}
                {view === "grid" && (
                  <div className="flex aspect-square items-center justify-center border-b border-subtle bg-white/5">
                    <Sparkles className="size-5 text-foreground/25" />
                  </div>
                )}
                <div className={cn("flex flex-col", view === "grid" && "p-3")}>
                  <span className="truncate text-xs font-medium">{item.title}</span>
                  {item.meta && (
                    <span className="truncate text-[11px] text-foreground/45">
                      {item.meta}
                    </span>
                  )}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
