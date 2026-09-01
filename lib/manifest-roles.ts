export const MANIFEST_ROLES = [
  "character_ref", "style_ref", "location", "product", "audio_bed", "document", "reference",
] as const;

export type ManifestRole = (typeof MANIFEST_ROLES)[number];
