import type { ManifestRole } from "@/lib/manifest-roles";

export type FalModelAdapter = { accepts: ManifestRole[]; referenceCap: number; mapInput: (input: { prompt: string; aspectRatio?: string; duration?: number; references: string[] }) => Record<string, unknown> };

export function getFalModelAdapter(modelId: string): FalModelAdapter {
  if (/seedance/i.test(modelId)) return { accepts: ["character_ref", "style_ref", "location", "product", "audio_bed", "reference"], referenceCap: 8, mapInput: ({ prompt, aspectRatio, duration, references }) => ({ prompt, aspect_ratio: aspectRatio, duration, image_urls: references }) };
  return { accepts: ["character_ref", "style_ref", "location", "product", "reference"], referenceCap: 4, mapInput: ({ prompt, aspectRatio, references }) => ({ prompt, image_size: aspectRatio, image_urls: references }) };
}
