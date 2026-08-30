import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { WorkspaceLivePanel } from "@/components/workspace/workspace-live-panel";
import { Panel } from "@/components/ui/panel";
import { getWorkspaceMeta } from "@/lib/workspace";
import { SHARED_OS_ITEMS } from "@/lib/sample-data";

export default function SharedOsPage() {
  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("shared-os")}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Research &amp; Dev
        </h2>
        <div className="flex flex-col gap-2">
          {SHARED_OS_ITEMS.map((item) => (
            <Panel key={item.id} className="flex items-center justify-between p-3">
              <span className="text-sm">{item.title}</span>
              <span className="text-xs text-foreground/50">{item.kind}</span>
            </Panel>
          ))}
        </div>
      </section>

      <WorkspaceLivePanel workspace="shared-os" />
    </WorkspaceDashboard>
  );
}
