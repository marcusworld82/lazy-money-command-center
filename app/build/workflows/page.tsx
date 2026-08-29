import { Badge } from "@/components/ui/badge";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { Button } from "@/components/ui/button";
import { Workflow } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Build
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Workflows
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          The full node-based canvas arrives in a later phase. This is the page shell.
        </p>
      </header>

      <PlaceholderEmptyState
        icon={Workflow}
        title="No workflows yet"
        description="Workflows let you chain steps like Brief → Shot List → Delivery into a reusable, repeatable canvas."
        action={
          <Button size="sm" variant="secondary" disabled className="mt-2">
            New Workflow
          </Button>
        }
      />
    </div>
  );
}
