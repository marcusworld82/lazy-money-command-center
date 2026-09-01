"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
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
    <div className="marco-library flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Library
        </span>
          <h1 className="text-display-sm uppercase">Assets</h1>
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
        <DemoAssets notice="Showing a local preview while the asset library reconnects." />
      ) : loading ? (
        <CardGridSkeleton />
      ) : sorted.length === 0 ? (
        <DemoAssets notice="Local preview — upload an image, video, or document to replace these samples." />
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

function DemoAssets({ notice }: { notice: string }) {
  const assets = ["hoodie-front.png", "campaign-board.pdf", "fall-detail.mp4", "color-study.jpg", "drop-copy.docx", "lookbook-01.jpg", "fabric-note.pdf", "social-crop.png"];
  const roles = ["character", "style", "location", "product", "audio", "document"];
  const [selected, setSelected] = React.useState<string[]>([]);
  const [role, setRole] = React.useState("character");
  const [bundles, setBundles] = React.useState<string[]>([]);
  const toggleAsset = (name: string) => setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  return <section className="marco-demo-assets"><p><b>Demo preview</b> {notice}</p><div className="marco-bundle-bar"><span>{selected.length} selected</span><select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select><button type="button" disabled={!selected.length} onClick={() => { setBundles((current) => [...current, `${role} bundle · ${selected.length} assets`]); setSelected([]); }}>Save local bundle</button></div>{bundles.length > 0 && <div className="marco-local-bundles">{bundles.map((bundle, index) => <span key={`${bundle}-${index}`}>{bundle}<small>Local only</small></span>)}</div>}<div>{assets.map((name, index) => <article key={name} className={selected.includes(name) ? "is-selected" : ""} onClick={() => toggleAsset(name)}><span className={`demo-asset-swatch shade-${index % 4}`}><i>{index % 3 === 0 ? "IMG" : index % 3 === 1 ? "DOC" : "VID"}</i></span><b>{name}</b><small>{index % 3 === 0 ? "Image" : index % 3 === 1 ? "Document" : "Video"} · {role}</small></article>)}</div></section>;
}
