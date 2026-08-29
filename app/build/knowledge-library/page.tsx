import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FolderTree } from "@/components/features/folder-tree";
import { KNOWLEDGE_TREE } from "@/lib/sample-data";

export default function KnowledgeLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Build
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Knowledge Library
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Durable business facts, SOPs, and brand rules. Navigable placeholder — content
          connects in a later phase.
        </p>
      </header>

      <GlassPanel className="p-3">
        <FolderTree nodes={KNOWLEDGE_TREE} />
      </GlassPanel>
    </div>
  );
}
