"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebar } from "@/lib/providers/sidebar-provider";
import { useTheme } from "@/lib/providers/theme-provider";
import { getPublishMode, setPublishMode } from "@/lib/actions/settings";
import type { PublishMode } from "@/lib/types";

export default function SettingsPage() {
  const { collapsed, setCollapsed } = useSidebar();
  const { theme } = useTheme();
  const [publishMode, setMode] = React.useState<PublishMode | null>(null);

  React.useEffect(() => {
    // Initial fetch-on-mount; Server Actions can't run during SSR render.
    getPublishMode()
      .then(setMode)
      .catch(() => setMode(null));
  }, []);

  async function updateMode(next: PublishMode) {
    setMode(next);
    await setPublishMode(next);
  }

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
          Publishing
        </h2>
        <GlassPanel className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col">
            <Label className="text-sm font-medium">Require manual approval</Label>
            <span className="text-xs text-foreground/55">
              Nothing publishes until you approve it. This is the safe default and should
              stay on unless you have a reason to change it.
            </span>
          </div>
          <Switch
            checked={publishMode?.humanApprovalRequired ?? true}
            onCheckedChange={(checked) =>
              updateMode({
                humanApprovalRequired: checked,
                // Auto-publish and manual approval are mutually exclusive.
                autoPublish: checked ? false : (publishMode?.autoPublish ?? false),
              })
            }
          />
        </GlassPanel>
        <GlassPanel className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col">
            <Label className="text-sm font-medium">Auto-publish</Label>
            <span className="text-xs text-foreground/55">
              Publish approved versions without a final confirmation. Disabled while manual
              approval is required.
            </span>
          </div>
          <Switch
            checked={publishMode?.autoPublish ?? false}
            disabled={publishMode?.humanApprovalRequired ?? true}
            onCheckedChange={(checked) =>
              updateMode({
                autoPublish: checked,
                humanApprovalRequired: publishMode?.humanApprovalRequired ?? true,
              })
            }
          />
        </GlassPanel>
      </section>

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
