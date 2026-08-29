import { Button } from "@/components/ui/button";
import { NODE_KINDS, type StubNodeKind } from "@/components/features/workflow-nodes";

export function WorkflowNodePalette({ onAdd }: { onAdd: (kind: StubNodeKind) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {NODE_KINDS.map(({ kind, label, icon: Icon }) => (
        <Button
          key={kind}
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => onAdd(kind)}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
