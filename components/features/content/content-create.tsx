"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Wand2, AlertTriangle } from "lucide-react";
import { ALL_PLATFORMS, PLATFORM_RULES } from "@/lib/content/platforms";
import {
  createContentItem,
  runAnalyzer,
  runAdapters,
} from "@/lib/actions/content";
import type {
  ContentType,
  ContentGoal,
  ContentPlatform,
  BrandVoiceProfile,
} from "@/lib/types";
import { useWorkspace } from "@/lib/providers/workspace-provider";
import { cn } from "@/lib/utils";

const CONTENT_TYPES: ContentType[] = ["text", "link", "blog", "transcript", "image", "video"];
const GOALS: ContentGoal[] = ["awareness", "saves", "traffic", "leads"];

export function ContentCreate({
  brandVoices,
  llmConfigured,
  onCreated,
}: {
  brandVoices: BrandVoiceProfile[];
  llmConfigured: boolean;
  onCreated: () => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("text");
  const [goal, setGoal] = React.useState<ContentGoal>("awareness");
  const [audience, setAudience] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [voiceId, setVoiceId] = React.useState<string>("");
  const [platforms, setPlatforms] = React.useState<ContentPlatform[]>([
    "instagram",
    "x",
  ]);
  const [busy, setBusy] = React.useState<null | string>(null);
  const [error, setError] = React.useState<string | null>(null);

  function togglePlatform(p: ContentPlatform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || platforms.length === 0) return;
    setError(null);
    try {
      setBusy("Saving content…");
      const item = await createContentItem({
        workspace: activeWorkspace,
        title: title.trim() || "Untitled",
        originalContent: content.trim(),
        contentType,
        goal,
        audience: audience.trim() || undefined,
        cta: cta.trim() || undefined,
      });

      setBusy("Analyzing content…");
      await runAnalyzer(item.id);

      setBusy(`Adapting for ${platforms.length} platform(s)…`);
      await runAdapters(item.id, platforms, voiceId || undefined);

      setTitle("");
      setContent("");
      setAudience("");
      setCta("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!llmConfigured && (
        <Panel className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-brand" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              No LLM key configured — analysis and adaptation are unavailable
            </span>
            <p className="text-xs text-foreground/60">
              Add <code className="rounded bg-white/10 px-1">OPENROUTER_API_KEY</code> to
              .env.local to enable the Content Analyzer and platform adapters. You can still
              save content items in the meantime.
            </p>
          </div>
        </Panel>
      )}

      <Panel className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-title" className="text-xs">
                Title
              </Label>
              <Input
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Internal name for this piece"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Content type</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as ContentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content-body" className="text-xs">
              Source content *
            </Label>
            <Textarea
              id="content-body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the post, transcript, blog, or link you want adapted everywhere…"
              rows={7}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Goal</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as ContentGoal)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-audience" className="text-xs">
                Audience
              </Label>
              <Input
                id="content-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="HVAC owners"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-cta" className="text-xs">
                Call to action
              </Label>
              <Input
                id="content-cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Book a 15-minute call"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Brand voice profile</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="None — neutral, direct register" />
              </SelectTrigger>
              <SelectContent>
                {brandVoices.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No profiles yet
                  </SelectItem>
                ) : (
                  brandVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Platforms to generate</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    platforms.includes(p)
                      ? "border-accent-brand bg-accent-brand/20 text-accent-brand"
                      : "border-subtle text-foreground/60 hover:border-accent-brand/50",
                  )}
                >
                  {PLATFORM_RULES[p].label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-subtle bg-white/5 p-2.5 text-xs text-foreground/70">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            {busy && (
              <span className="flex items-center gap-1.5 text-xs text-foreground/55">
                <Sparkles className="size-3.5 animate-pulse text-accent-brand" />
                {busy}
              </span>
            )}
            <Button
              type="submit"
              className="gap-1.5"
              disabled={!!busy || !llmConfigured || platforms.length === 0}
            >
              <Wand2 className="size-3.5" /> Analyze &amp; Adapt
            </Button>
          </div>

          <p className="text-[11px] text-foreground/40">
            The analyzer extracts one source of truth first, then each platform is written
            natively from it — never copy-pasted between channels.
          </p>
          {platforms.length === 0 && (
            <Badge variant="secondary" className="w-fit text-[10px]">
              Select at least one platform
            </Badge>
          )}
        </form>
      </Panel>
    </div>
  );
}
