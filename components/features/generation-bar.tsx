"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Check, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationModel {
  id: string;
  name: string;
  /** One-line description shown beside the name in the picker. */
  description: string;
  /** Cost per generation, in whatever unit the caller is working in. */
  costPerRun?: number;
}

export interface GenerationSettings {
  modelId: string;
  aspectRatio: string;
  resolution: string;
  count: number;
}

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
const RESOLUTIONS = ["720p", "1080p", "4K"];

/**
 * Shared generation control bar.
 *
 * Phase 4.5 ships this as a UI shell: it owns model/ratio/resolution/count
 * state and reports it upward, but performs no generation. Phase 5 supplies
 * real models and an onGenerate that actually calls fal/OpenRouter.
 */
export function GenerationBar({
  models,
  value,
  onChange,
  onGenerate,
  busy,
  costLabel,
  variant = "fixed",
  className,
}: {
  models: GenerationModel[];
  value: GenerationSettings;
  onChange: (next: GenerationSettings) => void;
  onGenerate?: (settings: GenerationSettings) => void;
  busy?: boolean;
  /** Overrides the computed cost shown on the button, e.g. "$0.32". */
  costLabel?: string;
  /** `fixed` pins to the viewport bottom; `inline` sits in normal flow. */
  variant?: "fixed" | "inline";
  className?: string;
}) {
  const model = models.find((m) => m.id === value.modelId) ?? models[0];

  function set<K extends keyof GenerationSettings>(
    key: K,
    next: GenerationSettings[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  const computedCost =
    costLabel ??
    (model?.costPerRun != null
      ? `$${(model.costPerRun * value.count).toFixed(2)}`
      : String(value.count));

  return (
    <div
      className={cn(
        "z-30 flex flex-wrap items-center gap-2 rounded-xl border border-subtle bg-surface-raised p-2",
        variant === "fixed" &&
          "fixed inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:w-[min(920px,calc(100vw-3rem))] md:-translate-x-1/2",
        className,
      )}
    >
      {/* Model picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-subtle px-3 py-1.5 text-left transition-colors hover:border-accent-brand/60 md:flex-none md:max-w-xs"
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
        <DropdownMenuContent align="start" className="w-72">
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
              {m.id === value.modelId && <Check className="mt-0.5 size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Aspect ratio */}
      <div className="flex items-center gap-0.5 rounded-lg border border-subtle p-0.5">
        {ASPECT_RATIOS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => set("aspectRatio", r)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] transition-colors",
              value.aspectRatio === r
                ? "bg-accent-brand text-surface-white"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Resolution */}
      <div className="flex items-center gap-0.5 rounded-lg border border-subtle p-0.5">
        {RESOLUTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => set("resolution", r)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] transition-colors",
              value.resolution === r
                ? "bg-accent-brand text-surface-white"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Count stepper */}
      <div className="flex items-center gap-1 rounded-lg border border-subtle p-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Decrease count"
          disabled={value.count <= 1}
          onClick={() => set("count", Math.max(1, value.count - 1))}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="min-w-5 text-center text-xs tabular-nums">{value.count}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Increase count"
          disabled={value.count >= 8}
          onClick={() => set("count", Math.min(8, value.count + 1))}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <Button
        className="ml-auto gap-2"
        disabled={busy || !onGenerate}
        onClick={() => onGenerate?.(value)}
      >
        {busy ? "Generating…" : "Generate"}
        <span className="rounded bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">
          {computedCost}
        </span>
      </Button>
    </div>
  );
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  modelId: "",
  aspectRatio: "1:1",
  resolution: "1080p",
  count: 1,
};
