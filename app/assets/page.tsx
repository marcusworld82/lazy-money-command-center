"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { useAppData } from "@/lib/providers/app-data-provider";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";
import { FileImage, FileVideo, FileText, ImagePlus, X, Loader2 } from "lucide-react";

const TYPE_ICON = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
} as const;

export default function AssetsPage() {
  const { assets, addAsset, removeAsset, loading, error } = useAppData();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("workspace", DEFAULT_WORKSPACE);
        await addAsset(formData);
      }
    } finally {
      setUploading(false);
    }
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
            Asset library backed by Supabase Storage. Uploads are private, served via
            signed URLs.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          {uploading ? "Uploading…" : "Add Asset"}
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

      {error ? (
        <PlaceholderEmptyState icon={ImagePlus} title="Couldn't load assets" description={error} />
      ) : loading ? (
        <CardGridSkeleton />
      ) : sorted.length === 0 ? (
        <PlaceholderEmptyState
          icon={ImagePlus}
          title="No assets yet"
          description="Add an image, video, or document."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((asset) => {
            const Icon = TYPE_ICON[asset.type];
            return (
              <Panel key={asset.id} interactive className="group relative flex flex-col gap-2 p-3">
                <button
                  onClick={() => removeAsset(asset.id)}
                  aria-label="Remove asset"
                  className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full border border-subtle bg-surface-raised text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-subtle bg-white/5">
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
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
