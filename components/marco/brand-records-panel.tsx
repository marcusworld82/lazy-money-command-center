"use client";

import * as React from "react";
import { Plus, Save } from "lucide-react";
import { listBrands, saveBrand } from "@/lib/actions/marco";
import type { Brand } from "@/lib/marco-types";

export function BrandRecordsPanel() {
  const [brands, setBrands] = React.useState<Brand[]>([]), [active, setActive] = React.useState<Brand | null>(null), [name, setName] = React.useState(""), [slug, setSlug] = React.useState(""), [saving, setSaving] = React.useState(false);
  const refresh = React.useCallback(async () => { const next = await listBrands(); setBrands(next); setActive((current) => current ? next.find((item) => item.id === current.id) ?? null : next[0] ?? null); }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  React.useEffect(() => { setName(active?.name ?? ""); setSlug(active?.slug ?? ""); }, [active]);
  async function save() { if (!name.trim() || !slug.trim()) return; setSaving(true); try { await saveBrand({ id: active?.id, name, slug, kind: active?.kind ?? null, isActive: active?.isActive ?? false, colors: active?.colors ?? null, voice: active?.voice ?? null, audience: active?.audience ?? null, offers: active?.offers ?? null, restrictions: active?.restrictions ?? null }); await refresh(); } finally { setSaving(false); } }
  return <section className="marco-phase7-panel"><header><div><small>Shared context</small><h2>Brand records</h2><p>Every agent reads the active brand record. Brand rules never live inside an agent.</p></div><button type="button" onClick={() => setActive(null)}><Plus size={15} /> New brand</button></header><div className="marco-brand-records"><aside>{brands.map((brand) => <button key={brand.id} className={active?.id === brand.id ? "is-active" : ""} onClick={() => setActive(brand)}>{brand.name}<small>{brand.kind ?? "Brand"}</small></button>)}</aside><form onSubmit={(event) => { event.preventDefault(); void save(); }}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Slug<input value={slug} onChange={(event) => setSlug(event.target.value)} required /></label><button disabled={saving}><Save size={14} />{saving ? "Saving…" : "Save record"}</button></form></div></section>;
}
