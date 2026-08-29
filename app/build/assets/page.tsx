"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { useAppData } from "@/lib/providers/app-data-provider";
import { useWorkspace } from "@/lib/providers/workspace-provider";
import { getWorkspaceMeta } from "@/lib/workspace";
import type { AssetType } from "@/lib/types";
import { FileImage, FileVideo, FileText, ImagePlus, X } from "lucide-react";

const TYPE_ICON = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
} as const;

function inferAssetType(file: File): AssetType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

export default function AssetsPage() {
  const { assets, addAsset, removeAsset } = useAppData();
  const { activeWorkspace } = useWorkspace();
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      addAsset({
        filename: file.name,
        type: inferAssetType(file),
        workspace: activeWorkspace,
        url: URL.createObjectURL(file),
      });
    });
  }

  const sorted = [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
            Build
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Assets
          </h1>
          <p className="max-w-xl text-sm text-foreground/60">
            Local asset library. Real uploads to cloud storage arrive in a later phase — files
            stay in this browser session.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-3.5" /> Add Asset
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </header>

      {sorted.length === 0 ? (
        <PlaceholderEmptyState
          icon={ImagePlus}
          title="No assets yet"
          description="Add an image, video, or document — it stays local to this session."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((asset) => {
            const Icon = TYPE_ICON[asset.type];
            const workspace = asset.workspace ? getWorkspaceMeta(asset.workspace) : null;
            return (
              <GlassPanel key={asset.id} interactive className="group relative flex flex-col gap-2 p-3">
                <button
                  onClick={() => removeAsset(asset.id)}
                  aria-label="Remove asset"
                  className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-glass-border bg-white/5">
                  {asset.type === "image" && asset.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Icon className="size-6 text-foreground/50" />
                  )}
                </div>
                <span className="truncate text-xs font-medium">{asset.filename}</span>
                {workspace && (
                  <span className="text-[11px] text-foreground/45">{workspace.shortLabel}</span>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
