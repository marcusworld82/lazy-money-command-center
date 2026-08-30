import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";

/**
 * Library — everything the generation tools produce.
 *
 * Distinct from Assets, which holds files you upload. Nothing generates yet, so
 * this is an honest empty state rather than a grid of fake results.
 */
export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Output"
        title="Library"
        description="Every image, clip, and canvas render you generate, in one place. Uploads live under Assets."
      />
      <PlaceholderEmptyState
        icon={Sparkles}
        title="Nothing generated yet"
        description="The Library fills up as Images, Video, Canvas, and Apparel produce output. Generation connects in Phase 5."
      />
    </div>
  );
}
