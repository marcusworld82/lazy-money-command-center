import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { WorkspaceLivePanel } from "@/components/workspace/workspace-live-panel";
import { MoneyGapModules } from "@/components/workspace/money-gap-modules";
import { getWorkspaceMeta } from "@/lib/workspace";

export default function MoneyGapPage() {
  return (
    <WorkspaceDashboard workspace={getWorkspaceMeta("money-gap")}>
      <MoneyGapModules />
      <WorkspaceLivePanel workspace="money-gap" />
    </WorkspaceDashboard>
  );
}
