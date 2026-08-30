import { PageHero } from "@/components/layout/page-hero";
import { GenerationStudio } from "@/components/features/generation-studio";
import { VIDEO_MODELS } from "@/lib/placeholder-models";

export default function VideoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Generate"
        title="Video"
        description="Same rail, same tools panel — pointed at motion. Text-to-video and image-to-video connect in Phase 5."
      />
      <GenerationStudio
        models={VIDEO_MODELS}
        gridLabel="Your clips"
        promptPlaceholder="Describe the shot — action, camera move, pacing, mood…"
        emptyTitle="No clips yet"
        emptyDescription="Generated video will land here once the video models are wired up in Phase 5."
      />
    </div>
  );
}
