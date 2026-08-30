import type { LucideIcon } from "lucide-react";
import {
  Image as ImageIcon,
  Clapperboard,
  Workflow,
  Shirt,
  Share2,
  PenLine,
  Inbox,
  Zap,
  Send,
  CalendarDays,
  Sparkles,
  Bot,
  BookOpen,
  Boxes,
  FolderKanban,
  LibraryBig,
  Settings,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  /** Where the parent navigates to when the rail is collapsed. */
  href: string;
  /** Path prefix used to decide whether the group renders as open/active. */
  basePath: string;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

/**
 * Tool-first navigation (Phase 4.5 rewrite).
 *
 * The Phase 1/2 workspace-first structure (Shared OS / Clothing Brand /
 * AI-Cinematic / Money Gap) is retired: the sidebar now lists what you do, not
 * which business you're doing it for. Social is the only expandable group.
 */
export const NAV_CONFIG: NavEntry[] = [
  { label: "Images", href: "/images", icon: ImageIcon },
  { label: "Video", href: "/video", icon: Clapperboard },
  { label: "Canvas", href: "/canvas", icon: Workflow },
  { label: "Apparel", href: "/apparel", icon: Shirt },
  {
    label: "Social",
    icon: Share2,
    href: "/social/new-post",
    basePath: "/social",
    items: [
      { label: "New Post", href: "/social/new-post", icon: PenLine },
      { label: "Inbox", href: "/social/inbox", icon: Inbox },
      { label: "Automations", href: "/social/automations", icon: Zap },
      { label: "Published", href: "/social/published", icon: Send },
      { label: "Calendar", href: "/social/calendar", icon: CalendarDays },
    ],
  },
  { label: "Super Agent", href: "/super-agent", icon: Sparkles },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Assets", href: "/assets", icon: Boxes },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Library", href: "/library", icon: LibraryBig },
  { label: "Settings", href: "/settings", icon: Settings },
];
