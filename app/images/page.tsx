import { PageHero } from "@/components/layout/page-hero";
import { GenerationStudio } from "@/components/features/generation-studio";
import { IMAGE_MODELS } from "@/lib/placeholder-models";

export default function ImagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Generate"
        title="Images"
        description="Model, references, and prompt on the left. Everything you've made on the right. Real generation connects in Phase 5."
      />
      <GenerationStudio
        models={IMAGE_MODELS}
        gridLabel="Your images"
        promptPlaceholder="Describe the image — subject, style, lighting, framing…"
        emptyTitle="No images yet"
        emptyDescription="Generated stills will land here once the image models are wired up in Phase 5."
      />
    </div>
  );
}
