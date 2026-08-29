"use client";

import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebar } from "@/lib/providers/sidebar-provider";
import { useTheme } from "@/lib/providers/theme-provider";

export default function SettingsPage() {
  const { collapsed, setCollapsed } = useSidebar();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Module
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Theme and sidebar behavior are functional now. API key management arrives in a
          later phase.
        </p>
      </header>

      <GlassPanel className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Theme</Label>
          <span className="text-xs text-foreground/55">Currently {theme} mode</span>
        </div>
        <ThemeToggle />
      </GlassPanel>

      <GlassPanel className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Collapse sidebar by default</Label>
          <span className="text-xs text-foreground/55">
            Loads the sidebar in icon-only mode
          </span>
        </div>
        <Switch checked={collapsed} onCheckedChange={setCollapsed} />
      </GlassPanel>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Connections &amp; API Keys
        </h2>
        <GlassPanel className="flex flex-col gap-3 p-4 opacity-60">
          {["OpenRouter", "fal", "Supabase", "Telegram", "Connections / MCPs"].map((service) => (
            <div key={service} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">{service}</span>
              <Badge variant="secondary" className="text-[10px]">
                Connect in Phase 5
              </Badge>
            </div>
          ))}
        </GlassPanel>
      </section>
    </div>
  );
}
