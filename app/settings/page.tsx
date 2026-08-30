"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
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
        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          System
        </span>
        <h1 className="text-display-sm uppercase">Settings</h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Theme and sidebar behavior are functional now. API key management arrives in a
          later phase.
        </p>
      </header>

      <Panel className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Theme</Label>
          <span className="text-xs text-foreground/55">Currently {theme} mode</span>
        </div>
        <ThemeToggle />
      </Panel>

      <Panel className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Collapse sidebar by default</Label>
          <span className="text-xs text-foreground/55">
            Loads the sidebar in icon-only mode
          </span>
        </div>
        <Switch checked={collapsed} onCheckedChange={setCollapsed} />
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Publishing
        </h2>
        <Panel className="flex items-center justify-between gap-4 p-4">
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
        </Panel>
        <Panel className="flex items-center justify-between gap-4 p-4">
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
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Connections &amp; API Keys
        </h2>
        <Panel className="flex flex-col gap-3 p-4 opacity-60">
          {["OpenRouter", "fal", "Supabase", "Telegram", "Connections / MCPs"].map((service) => (
            <div key={service} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">{service}</span>
              <Badge variant="secondary" className="text-[10px]">
                Connect in Phase 5
              </Badge>
            </div>
          ))}
        </Panel>
      </section>

      {/* Spend & Usage is not in the Phase 4.5 tool-first sidebar, so it hangs
          off Settings rather than becoming an unreachable route. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Spend
        </h2>
        <Panel interactive className="p-0">
          <Link
            href="/spend-usage"
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">Spend &amp; Usage</span>
              <span className="text-xs text-foreground/55">
                Per-model cost and run history. Populates once generation is wired up.
              </span>
            </div>
            <ArrowRight className="size-4 shrink-0 text-accent-brand" />
          </Link>
        </Panel>
      </section>
    </div>
  );
}
