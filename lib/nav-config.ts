import { CalendarDays, Zap, Boxes, BookOpen, Wallet, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export interface NavLeaf { label: string; href: string; icon: LucideIcon; badge?: string; }
export const NAV_CONFIG: NavLeaf[] = [
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Assets", href: "/assets", icon: Boxes },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Spend", href: "/spend-usage", icon: Wallet },
  { label: "Settings", href: "/settings", icon: Settings },
];
export function isNavGroup(): false { return false; }
