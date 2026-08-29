export type Workspace = "shared-os" | "clothing-brand" | "ai-cinematic" | "money-gap";

export interface WorkspaceMeta {
  slug: Workspace;
  label: string;
  shortLabel: string;
  tagline: string;
  href: string;
}

export const WORKSPACES: WorkspaceMeta[] = [
  {
    slug: "shared-os",
    label: "Shared OS",
    shortLabel: "Shared",
    tagline: "Cross-business orchestration, research, and dev/build tools.",
    href: "/workspaces/shared-os",
  },
  {
    slug: "clothing-brand",
    label: "Clothing Brand",
    shortLabel: "Clothing",
    tagline: "Product concepts, lookbooks, campaigns, and catalog.",
    href: "/workspaces/clothing-brand",
  },
  {
    slug: "ai-cinematic",
    label: "AI-Cinematic",
    shortLabel: "Cinematic",
    tagline: "Cinematic production for listings, jets, yachts, and RVs.",
    href: "/workspaces/ai-cinematic",
  },
  {
    slug: "money-gap",
    label: "Money Gap System",
    shortLabel: "Money Gap",
    tagline: "Revenue recovery and business systems for local service owners.",
    href: "/workspaces/money-gap",
  },
];

export function getWorkspaceMeta(slug: Workspace): WorkspaceMeta {
  const found = WORKSPACES.find((w) => w.slug === slug);
  if (!found) throw new Error(`Unknown workspace: ${slug}`);
  return found;
}

export const DEFAULT_WORKSPACE: Workspace = "shared-os";
