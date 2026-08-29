import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { WorkspaceLivePanel } from "@/components/workspace/workspace-live-panel";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceMeta } from "@/lib/workspace";
import { CLOTHING_CAMPAIGNS } from "@/lib/sample-data";

export default function ClothingBrandPage() {
  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("clothing-brand")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Campaigns
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CLOTHING_CAMPAIGNS.map((c) => (
            <GlassPanel key={c.id} className="flex flex-col gap-2 p-4">
              <span className="text-sm font-medium">{c.title}</span>
              <Badge variant="secondary" className="w-fit">
                {c.status}
              </Badge>
            </GlassPanel>
          ))}
        </div>
      </section>

      <WorkspaceLivePanel workspace="clothing-brand" />
    </WorkspaceDashboard>
  );
}
