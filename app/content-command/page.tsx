"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Rss, Trash2, BarChart3, PlugZap, Inbox } from "lucide-react";
import { ContentCreate } from "@/components/features/content/content-create";
import { ContentCalendar } from "@/components/features/content/content-calendar";
import { VersionCard, STATUS_LABEL } from "@/components/features/content/version-card";
import { ALL_PLATFORMS, PLATFORM_RULES } from "@/lib/content/platforms";
import {
  listContentItems,
  listVersions,
  listScheduledPosts,
  listBrandVoices,
  setVersionStatus,
  scheduleVersion,
  attemptPublish,
  runAdapters,
  deleteContentItem,
} from "@/lib/actions/content";
import { getLLMKeyStatus } from "@/lib/actions/settings";
import type {
  ContentItem,
  ContentVersion,
  ScheduledPost,
  BrandVoiceProfile,
  VersionStatus,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const KANBAN_COLUMNS: VersionStatus[] = [
  "draft",
  "ready_for_review",
  "approved",
  "scheduled",
  "ready_to_post",
];

export default function ContentCommandPage() {
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [versions, setVersions] = React.useState<ContentVersion[]>([]);
  const [scheduled, setScheduled] = React.useState<ScheduledPost[]>([]);
  const [voices, setVoices] = React.useState<BrandVoiceProfile[]>([]);
  const [llmConfigured, setLlmConfigured] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [i, v, s, b, k] = await Promise.all([
        listContentItems(),
        listVersions(),
        listScheduledPosts(),
        listBrandVoices(),
        getLLMKeyStatus(),
      ]);
      setItems(i);
      setVersions(v);
      setScheduled(s);
      setVoices(b);
      setLlmConfigured(k.configured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Deliberate: initial fetch-on-mount; Server Actions can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function guarded(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  const reviewQueue = versions.filter(
    (v) => v.status === "ready_for_review" || v.status === "approved",
  );

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
          POST → ADAPT → RESIZE → CAPTION → APPROVE → PUBLISH → TRACK → IMPROVE. One source
          of truth in, a native version out for every platform.
        </p>
      </header>

      {actionError && (
        <GlassPanel className="p-3">
          <p className="text-xs text-foreground/75">{actionError}</p>
        </GlassPanel>
      )}

      <Tabs defaultValue="create">
        <TabsList className="flex-wrap">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <ContentCreate
            brandVoices={voices}
            llmConfigured={llmConfigured}
            onCreated={refresh}
          />
        </TabsContent>

        <TabsContent value="library" className="flex flex-col gap-4">
          {error ? (
            <PlaceholderEmptyState icon={Rss} title="Couldn't load content" description={error} />
          ) : loading ? (
            <CardGridSkeleton />
          ) : items.length === 0 ? (
            <PlaceholderEmptyState
              icon={Inbox}
              title="No content yet"
              description="Drop a post, transcript, or link into Create to generate every platform version."
            />
          ) : (
            items.map((item) => {
              const itemVersions = versions.filter((v) => v.contentId === item.id);
              return (
                <GlassPanel key={item.id} className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-heading text-sm font-semibold">{item.title}</span>
                      <span className="text-xs text-foreground/50">
                        {item.contentType}
                        {item.goal ? ` · ${item.goal}` : ""} ·{" "}
                        {formatRelativeTime(item.createdAt)} · {itemVersions.length} version(s)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={() => guarded(() => deleteContentItem(item.id))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {item.analysis && (
                    <div className="flex flex-col gap-1.5 rounded-md border border-glass-border bg-white/5 p-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                        Analysis — single source of truth
                      </span>
                      <span className="text-xs text-foreground/75">
                        <strong>Core idea:</strong> {item.analysis.core_idea}
                      </span>
                      <span className="text-xs text-foreground/75">
                        <strong>Hook:</strong> {item.analysis.hook}
                      </span>
                      {item.analysis.facts_to_preserve.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-foreground/60">
                            Facts to preserve verbatim:
                          </span>
                          {item.analysis.facts_to_preserve.map((f, i) => (
                            <span key={i} className="text-[11px] text-accent-green">
                              • {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {itemVersions.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {itemVersions.map((v) => (
                        <VersionCard key={v.id} version={v} compact />
                      ))}
                    </div>
                  )}
                </GlassPanel>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <ContentCalendar scheduled={scheduled} versions={versions} />
        </TabsContent>

        <TabsContent value="kanban">
          {versions.length === 0 ? (
            <PlaceholderEmptyState
              icon={Inbox}
              title="Nothing to board yet"
              description="Generated platform versions appear here by status."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {KANBAN_COLUMNS.map((status) => {
                const inColumn = versions.filter((v) => v.status === status);
                return (
                  <div key={status} className="flex flex-col gap-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                      {STATUS_LABEL[status]}
                      <span className="ml-1.5 text-foreground/30">{inColumn.length}</span>
                    </h2>
                    <div className="flex flex-col gap-3">
                      {inColumn.map((v) => (
                        <VersionCard key={v.id} version={v} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="flex flex-col gap-4">
          {reviewQueue.length === 0 ? (
            <PlaceholderEmptyState
              icon={Inbox}
              title="Nothing awaiting review"
              description="Generated versions land here for approve, reject, or regenerate."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {reviewQueue.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  onApprove={() => guarded(() => setVersionStatus(v.id, "approved"))}
                  onReject={() => guarded(() => setVersionStatus(v.id, "draft"))}
                  onRegenerate={() =>
                    guarded(() => runAdapters(v.contentId, [v.platform]))
                  }
                  onSchedule={(when) => guarded(() => scheduleVersion(v.id, when))}
                  onPublish={() => guarded(() => attemptPublish(v.id))}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="flex flex-col gap-4">
          <GlassPanel className="flex items-start gap-3 p-4">
            <PlugZap className="mt-0.5 size-4 shrink-0 text-accent-green" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">No publish connectors wired yet</span>
              <p className="text-xs text-foreground/60">
                Every connector implements validateConnection / publish / getStatus /
                getAnalytics, but none has a live publish path. Publishing therefore always
                lands on <strong>Ready to Post</strong> with a complete manual-post pack —
                nothing is ever marked published without a real successful publish call.
              </p>
            </div>
          </GlassPanel>
          <GlassPanel className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead className="text-right">Publish support</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PLATFORMS.map((p) => (
                  <TableRow key={p}>
                    <TableCell className="font-medium">{PLATFORM_RULES[p].label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        Not connected
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-foreground/50">
                      Ready to Post only
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="analytics">
          <PlaceholderEmptyState
            icon={BarChart3}
            title="No analytics data"
            description="Nothing has been published through a live connector, so there are no real metrics to show. Figures appear here only once a platform actually reports them — never estimated or filled in."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
