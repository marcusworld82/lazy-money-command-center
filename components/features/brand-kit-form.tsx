"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Save } from "lucide-react";
import type { ClientBrandKit } from "@/lib/types";
import { saveBrandKit } from "@/lib/actions/knowledge";

/**
 * Mirrors the Client Brand Kit record structure from master spec section 8 —
 * one form per client folder, stored as a real row (colors as structured jsonb).
 */
export function BrandKitForm({
  folderId,
  existing,
  onSaved,
}: {
  folderId: string;
  existing?: ClientBrandKit;
  onSaved: (kit: ClientBrandKit) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    businessName: existing?.businessName ?? "",
    industry: existing?.industry ?? "",
    website: existing?.website ?? "",
    primaryContact: existing?.primaryContact ?? "",
    colorPrimary: existing?.colors?.primary ?? "",
    colorSecondary: existing?.colors?.secondary ?? "",
    colorNeutrals: existing?.colors?.neutrals ?? "",
    colorUsageNotes: existing?.colors?.usageNotes ?? "",
    typography: existing?.typography ?? "",
    brandVoice: existing?.brandVoice ?? "",
    audience: existing?.audience ?? "",
    offers: existing?.offers ?? "",
    restrictions: existing?.restrictions ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    setSaving(true);
    try {
      const kit = await saveBrandKit({
        id: existing?.id,
        folderId,
        businessName: form.businessName.trim(),
        industry: form.industry.trim() || undefined,
        website: form.website.trim() || undefined,
        primaryContact: form.primaryContact.trim() || undefined,
        colors: {
          primary: form.colorPrimary.trim() || undefined,
          secondary: form.colorSecondary.trim() || undefined,
          neutrals: form.colorNeutrals.trim() || undefined,
          usageNotes: form.colorUsageNotes.trim() || undefined,
        },
        typography: form.typography.trim() || undefined,
        brandVoice: form.brandVoice.trim() || undefined,
        audience: form.audience.trim() || undefined,
        offers: form.offers.trim() || undefined,
        restrictions: form.restrictions.trim() || undefined,
      });
      onSaved(kit);
    } finally {
      setSaving(false);
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder?: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  const area = (key: keyof typeof form, label: string, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );

  return (
    <GlassPanel className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Client Brand Kit
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("businessName", "Business name *", "Acme HVAC")}
          {field("industry", "Industry", "HVAC / Plumbing")}
          {field("website", "Website / socials", "acmehvac.com")}
          {field("primaryContact", "Primary contact", "Name, email, phone")}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-foreground/45">
            Color palette
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {field("colorPrimary", "Primary", "#000000")}
            {field("colorSecondary", "Secondary", "#FFFFFF")}
            {field("colorNeutrals", "Neutrals", "#666666")}
          </div>
          {area("colorUsageNotes", "Usage notes", "Where each color is and isn't used")}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {area("typography", "Typography", "Headline and body typefaces")}
          {area("brandVoice", "Brand voice", "Tone, phrasing, what to avoid")}
          {area("audience", "Audience", "Who this speaks to")}
          {area("offers", "Offers / services", "What they sell")}
        </div>

        {area(
          "restrictions",
          "Restrictions / do-not-use rules",
          "Claims, imagery, or language that is off-limits",
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" className="gap-1.5" disabled={saving}>
            <Save className="size-3.5" />
            {saving ? "Saving…" : existing ? "Update Brand Kit" : "Save Brand Kit"}
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
}
