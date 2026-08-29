import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SAMPLE_ASSETS } from "@/lib/sample-data";
import { getWorkspaceMeta } from "@/lib/workspace";
import { FileImage, FileVideo, FileText, ImagePlus } from "lucide-react";

const TYPE_ICON = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
} as const;

export default function AssetsPage() {
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
            Sample asset library. Real uploads to cloud storage arrive in a later phase.
          </p>
        </div>
        <Button size="sm" variant="secondary" disabled className="gap-1.5">
          <ImagePlus className="size-3.5" /> Add Asset
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {SAMPLE_ASSETS.map((asset) => {
          const Icon = TYPE_ICON[asset.type];
          const workspace = getWorkspaceMeta(asset.workspace);
          return (
            <GlassPanel key={asset.id} interactive className="flex flex-col gap-2 p-3">
              <div className="flex aspect-square items-center justify-center rounded-lg border border-glass-border bg-white/5">
                <Icon className="size-6 text-foreground/50" />
              </div>
              <span className="truncate text-xs font-medium">{asset.filename}</span>
              <span className="text-[11px] text-foreground/45">{workspace.shortLabel}</span>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
