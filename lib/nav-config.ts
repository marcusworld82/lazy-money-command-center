import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Layers,
  Shirt,
  Clapperboard,
  TrendingUp,
  Rss,
  Zap,
  Hammer,
  FolderKanban,
  Workflow,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  Bot,
  Wallet,
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
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export const NAV_CONFIG: NavEntry[] = [
  {
    label: "Command Center",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Workspaces",
    icon: Layers,
    items: [
      { label: "Shared OS", href: "/workspaces/shared-os", icon: Layers },
      { label: "Clothing Brand", href: "/workspaces/clothing-brand", icon: Shirt },
      { label: "AI-Cinematic", href: "/workspaces/ai-cinematic", icon: Clapperboard },
      { label: "Money Gap System", href: "/workspaces/money-gap", icon: TrendingUp },
    ],
  },
  {
    label: "Content Command",
    href: "/content-command",
    icon: Rss,
  },
  {
    label: "Auto-Engage",
    href: "/auto-engage",
    icon: Zap,
  },
  {
    label: "Build",
    icon: Hammer,
    items: [
      { label: "Projects", href: "/build/projects", icon: FolderKanban },
      { label: "Workflows", href: "/build/workflows", icon: Workflow },
      { label: "Assets", href: "/build/assets", icon: ImageIcon },
      { label: "Knowledge Library", href: "/build/knowledge-library", icon: BookOpen },
    ],
  },
  {
    label: "Intelligence",
    icon: Sparkles,
    items: [
      { label: "Agents", href: "/intelligence/agents", icon: Bot, badge: "Soon" },
    ],
  },
  {
    label: "Spend & Usage",
    href: "/spend-usage",
    icon: Wallet,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
