import type { GenerationModel } from "@/components/features/generation-bar";

/**
 * Placeholder model catalogue for the Phase 4.5 shells.
 *
 * Deliberately generic names — these are NOT real fal/OpenRouter models, and
 * naming them after real ones would make an inert shell look wired up. Phase 5
 * replaces this file with the live catalogue and per-run costs.
 */
export const IMAGE_MODELS: GenerationModel[] = [
  { id: "img-a", name: "Image Model A", description: "Fast stills for concepting", costPerRun: 0.02 },
  { id: "img-b", name: "Image Model B", description: "Higher fidelity, slower runs", costPerRun: 0.08 },
  { id: "img-c", name: "Image Model C", description: "Strong at product and packshots", costPerRun: 0.06 },
];

export const VIDEO_MODELS: GenerationModel[] = [
  { id: "vid-a", name: "Video Model A", description: "Short image-to-video clips", costPerRun: 0.35 },
  { id: "vid-b", name: "Video Model B", description: "Longer takes, camera control", costPerRun: 0.9 },
];

export const APPAREL_MODELS: GenerationModel[] = [
  { id: "app-a", name: "Graphic Model A", description: "Flat print and graphic work", costPerRun: 0.03 },
  { id: "app-b", name: "Mockup Model A", description: "Garment mockups on-body", costPerRun: 0.07 },
];
