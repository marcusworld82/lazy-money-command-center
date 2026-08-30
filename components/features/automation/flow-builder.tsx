"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import type { AutomationFlow, AutomationPlatform, AutomationStep } from "@/lib/types";
import { saveFlow } from "@/lib/actions/automation";

export function FlowBuilder({
  existing,
  onSaved,
  onCancel,
}: {
  existing?: AutomationFlow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [platform, setPlatform] = React.useState<AutomationPlatform>(
    existing?.platform ?? "instagram",
  );
  const [keyword, setKeyword] = React.useState(existing?.triggerKeyword ?? "");
  const [requiresFollow, setRequiresFollow] = React.useState(
    existing?.requiresFollow ?? true,
  );
  const [steps, setSteps] = React.useState<AutomationStep[]>(
    existing?.steps.length ? existing.steps : [{ message: "" }],
  );
  const [saving, setSaving] = React.useState(false);

  function updateStep(index: number, message: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { message } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = steps.filter((s) => s.message.trim());
    if (!keyword.trim() || cleaned.length === 0) return;
    setSaving(true);
    try {
      await saveFlow({
        id: existing?.id,
        platform,
        triggerKeyword: keyword.trim(),
        requiresFollow,
        steps: cleaned,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassPanel className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          {existing ? "Edit flow" : "New flow"}
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Platform</Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v as AutomationPlatform)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="keyword" className="text-xs">
              Trigger keyword
            </Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. GUIDE"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-glass-border p-3">
          <div className="flex flex-col">
            <Label className="text-sm font-medium">Follow-gate</Label>
            <span className="text-xs text-foreground/55">
              Contact must follow the account before the DM is sent
            </span>
          </div>
          <Switch checked={requiresFollow} onCheckedChange={setRequiresFollow} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">DM sequence</Label>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-foreground/40">
                {i + 1}
              </span>
              <Textarea
                value={step.message}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={i === 0 ? "First DM they receive…" : "Follow-up message…"}
                rows={2}
                className="flex-1"
              />
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove step ${i + 1}`}
                  onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() => setSteps((prev) => [...prev, { message: "" }])}
          >
            <Plus className="size-3.5" /> Add step
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="gap-1.5" disabled={saving}>
            <Save className="size-3.5" /> {saving ? "Saving…" : "Save flow"}
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
}
