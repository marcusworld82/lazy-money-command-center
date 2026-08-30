import { PageHero } from "@/components/layout/page-hero";
import { GenerationStudio } from "@/components/features/generation-studio";
import { AgentDock } from "@/components/features/agent-dock";
import { APPAREL_MODELS } from "@/lib/placeholder-models";

export default function ApparelPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHero
        eyebrow="Design"
        title="Apparel"
        description="Concepts, graphics, and garment mockups in one place. Ask the Apparel Agent for direction, then generate against it."
      />
      <GenerationStudio
        models={APPAREL_MODELS}
        gridLabel="Concepts & mockups"
        promptPlaceholder="Describe the piece — garment, graphic, placement, colourway…"
        emptyTitle="No concepts yet"
        emptyDescription="Generated graphics and garment mockups will land here once apparel models are wired up in Phase 5."
      />
      <AgentDock agentId="apparel" />
    </div>
  );
}
