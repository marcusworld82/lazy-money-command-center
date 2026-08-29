"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { Badge } from "@/components/ui/badge";
import { Rss } from "lucide-react";
import { CONTENT_COMMAND_TABS } from "@/lib/sample-data";

export default function ContentCommandPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Module
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Content Command
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          POST → ADAPT → RESIZE → CAPTION → APPROVE → PUBLISH → TRACK → IMPROVE. Shell only
          this phase — wired up in Phase 4.
        </p>
      </header>

      <Tabs defaultValue={CONTENT_COMMAND_TABS[0].id}>
        <TabsList className="flex-wrap">
          {CONTENT_COMMAND_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CONTENT_COMMAND_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <PlaceholderEmptyState icon={Rss} title={tab.label} description={tab.detail} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
