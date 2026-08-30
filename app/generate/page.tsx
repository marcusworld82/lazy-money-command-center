"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Video, Sparkles, Box } from "lucide-react";
import {
  GenerationBar,
  DEFAULT_GENERATION_SETTINGS,
  type GenerationModel,
  type GenerationSettings,
} from "@/components/features/generation-bar";
import {
  ExploreBrowse,
  type BrowseCategory,
  type BrowseCard,
} from "@/components/features/explore-browse";

/**
 * Placeholder Generate page (Phase 4.5).
 *
 * Exists to exercise the two new shells — ExploreBrowse and GenerationBar —
 * against realistic-shaped data. The models below are placeholders, not a real
 * catalogue, and nothing here calls a provider. Phase 5 replaces this data and
 * wires the Generate button to fal/OpenRouter.
 */

const CATEGORIES: BrowseCategory[] = [
  { id: "image", label: "Image", description: "Stills, frames, and graphics", icon: ImageIcon },
  { id: "video", label: "Video", description: "Clips and image-to-video", icon: Video },
  { id: "text", label: "Text", description: "Copy, scripts, and analysis", icon: Sparkles },
];

const CARDS: BrowseCard[] = [
  { id: "m1", categoryId: "image", title: "Image Model A", description: "Fast stills for concepting.", icon: ImageIcon, badge: "New" },
  { id: "m2", categoryId: "image", title: "Image Model B", description: "Higher fidelity, slower runs.", icon: ImageIcon },
  { id: "m3", categoryId: "image", title: "Image Model C", description: "Strong at product and packshots.", icon: ImageIcon, badge: "Top" },
  { id: "m4", categoryId: "video", title: "Video Model A", description: "Short image-to-video clips.", icon: Video, badge: "New" },
  { id: "m5", categoryId: "video", title: "Video Model B", description: "Longer takes, camera control.", icon: Video },
  { id: "m6", categoryId: "text", title: "Text Model A", description: "General reasoning and copy.", icon: Sparkles },
];

const MODELS: GenerationModel[] = [
  { id: "m1", name: "Image Model A", description: "Fast stills for concepting", costPerRun: 0.02 },
  { id: "m2", name: "Image Model B", description: "Higher fidelity, slower runs", costPerRun: 0.08 },
  { id: "m4", name: "Video Model A", description: "Short image-to-video clips", costPerRun: 0.35 },
];

export default function GeneratePage() {
  const [settings, setSettings] = React.useState<GenerationSettings>({
    ...DEFAULT_GENERATION_SETTINGS,
    modelId: MODELS[0].id,
  });
  const [prompt, setPrompt] = React.useState("");

  return (
    <div className="flex flex-col gap-6 pb-28">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Intelligence
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Generate
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Interface shell for the generation layer. Models and controls are
          placeholders — real image and video generation connects in Phase 5.
        </p>
      </header>

      <Panel className="flex items-start gap-3 p-4">
        <Box className="mt-0.5 size-4 shrink-0 text-accent-brand" />
        <p className="text-xs text-foreground/60">
          Nothing on this page generates anything yet. The model list is placeholder data
          and the Generate button is inert by design, so this reads as unfinished rather
          than broken.
        </p>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Browse models
        </h2>
        <ExploreBrowse
          categories={CATEGORIES}
          cards={CARDS}
          selectedCardId={settings.modelId}
          onSelectCard={(card) => {
            if (MODELS.some((m) => m.id === card.id)) {
              setSettings((s) => ({ ...s, modelId: card.id }));
            }
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Prompt
        </h2>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate…"
          rows={4}
        />
      </section>

      <GenerationBar models={MODELS} value={settings} onChange={setSettings} />
    </div>
  );
}
