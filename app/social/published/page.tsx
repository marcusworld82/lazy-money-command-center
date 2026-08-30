"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Rss, Trash2, BarChart3, PlugZap, Inbox, Send } from "lucide-react";
import { VersionCard, STATUS_LABEL } from "@/components/features/content/version-card";
import { ALL_PLATFORMS, PLATFORM_RULES } from "@/lib/content/platforms";
import {
  listContentItems,
  listVersions,
  setVersionStatus,
  scheduleVersion,
  attemptPublish,
  runAdapters,
  deleteContentItem,
} from "@/lib/actions/content";
import type { ContentItem, ContentVersion, VersionStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const KANBAN_COLUMNS: VersionStatus[] = [
  "draft",
  "ready_for_review",
  "approved",
  "scheduled",
  "ready_to_post",
];

/**
 * Social → Published.
 *
 * The primary tab is the outbound list; the pipeline views that used to live on
 * the standalone Content Command page (library, board, approvals, connectors,
 * analytics) move here rather than being deleted — Phase 4.5 is a restructure,
 * not a feature removal.
 *
 * Nothing ever reads as "published" without a real successful publish call.
 * Since no connector has one, the terminal state is Ready to Post.
 */
export default function SocialPublishedPage() {
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [versions, setVersions] = React.useState<ContentVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [i, v] = await Promise.all([listContentItems(), listVersions()]);
      setItems(i);
      setVersions(v);
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

  const outbound = versions.filter(
    (v) => v.status === "ready_to_post" || v.status === "scheduled",
  );
  const reviewQueue = versions.filter(
    (v) => v.status === "ready_for_review" || v.status === "approved",
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
          Social
        </span>
        <h1 className="text-display-sm uppercase">Published</h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          Everything that has cleared review, plus the pipeline behind it.
        </p>
      </header>

      {actionError && (
        <Panel className="p-3">
          <p className="text-xs text-foreground/75">{actionError}</p>
        </Panel>
      )}

      <Tabs defaultValue="published">
        <TabsList className="flex-wrap">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="flex flex-col gap-4">
          <Panel className="flex items-start gap-3 p-4">
            <Send className="mt-0.5 size-4 shrink-0 text-accent-brand" />
            <p className="text-xs text-foreground/60">
              Nothing has been published through a live connector, so no post is marked
              published. Versions below are <strong>Ready to Post</strong> or scheduled, each
              with a complete manual-post pack.
            </p>
          </Panel>
          {error ? (
            <PlaceholderEmptyState icon={Rss} title="Couldn't load content" description={error} />
          ) : loading ? (
            <CardGridSkeleton />
          ) : outbound.length === 0 ? (
            <PlaceholderEmptyState
              icon={Send}
              title="Nothing out the door yet"
              description="Approve a version under Approvals and it appears here, ready to post."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {outbound.map((v) => (
                <VersionCard key={v.id} version={v} />
              ))}
            </div>
          )}
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
              description="Drop a post, transcript, or link into New Post to generate every platform version."
            />
          ) : (
            items.map((item) => {
              const itemVersions = versions.filter((v) => v.contentId === item.id);
              return (
                <Panel key={item.id} className="flex flex-col gap-3 p-4">
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
                    <div className="flex flex-col gap-1.5 rounded-md border border-subtle bg-white/5 p-3">
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
                            <span key={i} className="text-[11px] text-accent-brand">
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
                </Panel>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="board">
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
                  onRegenerate={() => guarded(() => runAdapters(v.contentId, [v.platform]))}
                  onSchedule={(when) => guarded(() => scheduleVersion(v.id, when))}
                  onPublish={() => guarded(() => attemptPublish(v.id))}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="flex flex-col gap-4">
          <Panel className="flex items-start gap-3 p-4">
            <PlugZap className="mt-0.5 size-4 shrink-0 text-accent-brand" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">No publish connectors wired yet</span>
              <p className="text-xs text-foreground/60">
                Every connector implements validateConnection / publish / getStatus /
                getAnalytics, but none has a live publish path. Publishing therefore always
                lands on <strong>Ready to Post</strong> with a complete manual-post pack —
                nothing is ever marked published without a real successful publish call.
              </p>
            </div>
          </Panel>
          <Panel className="overflow-hidden p-0">
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
          </Panel>
        </TabsContent>

        <TabsContent value="analytics">
          <PlaceholderEmptyState
            icon={BarChart3}
            title="No analytics data"
            description="Nothing has been published through a live connector, so there are no real metrics to show. Top-performing posts appear here only once a platform actually reports them — never estimated or filled in."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
