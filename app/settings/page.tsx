"use client";

import * as React from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { listBrands, listMarcoAgents, saveBrand, setActiveBrand } from "@/lib/actions/marco";
import { listConnections, listProviderStatus, listSync, saveConnection, saveProviderKey, saveSync, type ConnectionRecord, type ProviderStatus } from "@/lib/actions/workspace-settings";
import { demoAgents, demoBrands } from "@/lib/demo-marco-data";
import type { Brand, MarcoAgent } from "@/lib/marco-types";

const NAV = ["Agents", "Providers and keys", "Connections", "Brand records", "Sync", "Appearance"] as const;
type Section = (typeof NAV)[number];

const DEFAULT_PROVIDERS = [
  { id: "openrouter", name: "OpenRouter", blurb: "Default text router. Paste the API key only." },
  { id: "fal", name: "fal", blurb: "Default image and video connector. Paste the API key only." },
  { id: "openai", name: "OpenAI", blurb: "ChatGPT API key. The ChatGPT subscription does not work here." },
  { id: "anthropic", name: "Anthropic", blurb: "Claude API key. The Claude subscription does not work here." },
];

export default function SettingsPage() {
  const [section, setSection] = React.useState<Section>("Providers and keys");
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [status, setStatus] = React.useState<ProviderStatus[]>([]);
  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [obsidianPath, setObsidianPath] = React.useState("");
  const [supabaseUrl, setSupabaseUrl] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.all([listMarcoAgents(), listBrands(), listProviderStatus(), listConnections(), listSync()])
      .then(([nextAgents, nextBrands, nextStatus, nextConnections, nextSync]) => {
        setAgents(nextAgents.length ? nextAgents : demoAgents);
        setBrands(nextBrands.length ? nextBrands : demoBrands);
        setStatus(nextStatus);
        setConnections(nextConnections);
        setObsidianPath(nextSync.obsidianPath);
        setSupabaseUrl(nextSync.supabaseUrl);
      })
      .catch(() => { setAgents(demoAgents); setBrands(demoBrands); });
  }, []);

  return (
    <div className="ms">
      <header className="ms-pagehead">
        <h1>Settings</h1>
        <p>OpenRouter and fal are already listed. Type the API key in the box on that row and press Save. Keys go to the Supabase settings table.</p>
      </header>
      <div className="ms-layout">
        <nav className="ms-nav">
          {NAV.map((item) => (
            <button key={item} type="button" className={section === item ? "is-on" : ""} onClick={() => setSection(item)}>{item}</button>
          ))}
        </nav>
        <div className="ms-main">
          <div className="ms-heading">
            <h2>{section}</h2>
            {section === "Agents" && <Link href="/new-agent">+ New agent</Link>}
          </div>
          {section === "Agents" && agents.map((agent) => (
            <Link href={`/new-agent?edit=${agent.id}`} className="ms-agent" key={agent.id}>
              <AgentAvatar color={agent.avatarColor} name={agent.name} size="sm" />
              <span className="ms-copy"><strong>{agent.name}</strong><span>{agent.tagline}</span></span>
              <em>{agent.status}</em>
            </Link>
          ))}
          {section === "Providers and keys" && DEFAULT_PROVIDERS.map((provider) => (
            <ProviderCard key={provider.id} name={provider.name} blurb={provider.blurb} last4={status.find((item) => item.id === provider.id)?.last4 ?? null} onSave={async (key) => {
              try {
                const saved = await saveProviderKey(provider.id, key);
                setStatus((current) => [...current.filter((item) => item.id !== provider.id), saved]);
                setNote(`${provider.name} key saved to Supabase.`);
              } catch (error) {
                setNote(error instanceof Error ? error.message : "Could not save key. Check SUPABASE_SERVICE_ROLE_KEY on Vercel.");
              }
            }} />
          ))}
          {section === "Connections" && connections.map((item) => (
            <ConnectionCard key={item.id} record={item} onSave={async (record) => {
              try {
                const saved = await saveConnection(record);
                setConnections((current) => [...current.filter((row) => row.id !== saved.id), saved]);
                setNote(`${saved.name} saved to Supabase.`);
              } catch (error) {
                setNote(error instanceof Error ? error.message : "Could not save connection.");
              }
            }} />
          ))}
          {section === "Brand records" && <BrandsBlock brands={brands} setBrands={setBrands} setNote={setNote} />}
          {section === "Sync" && (
            <form className="ms-form" onSubmit={async (event) => {
              event.preventDefault();
              try { await saveSync({ obsidianPath, supabaseUrl }); setNote("Sync paths saved to Supabase."); }
              catch (error) { setNote(error instanceof Error ? error.message : "Could not save sync."); }
            }}>
              <label><span>Obsidian vault path</span><input value={obsidianPath} onChange={(event) => setObsidianPath(event.target.value)} placeholder="/Users/you/Documents/MARCO" /></label>
              <label><span>Supabase project URL</span><input value={supabaseUrl} onChange={(event) => setSupabaseUrl(event.target.value)} placeholder="https://xxxx.supabase.co" /></label>
              <button type="submit">Save sync</button>
            </form>
          )}
          {section === "Appearance" && (
            <article className="ms-card">
              <div className="ms-copy"><strong>Red Zyricon chrome</strong><span>Accent stays red. Purple is off.</span></div>
              <em>On</em>
            </article>
          )}
          {note && <p className="ms-note">{note}</p>}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ name, blurb, last4, onSave }: { name: string; blurb: string; last4: string | null; onSave: (key: string) => Promise<void> }) {
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <article className="ms-card">
      <div className="ms-card-top">
        <div className="ms-copy"><strong>{name}</strong><span>{blurb}</span></div>
        <em>{last4 ? `Saved ···${last4}` : "Not connected"}</em>
      </div>
      <form className="ms-keyrow" onSubmit={async (event) => {
        event.preventDefault();
        if (!key.trim()) return;
        setBusy(true);
        await onSave(key);
        setKey("");
        setBusy(false);
      }}>
        <input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder={`${name} API key`} autoComplete="off" />
        <button type="submit" disabled={busy || !key.trim()}>{busy ? "Saving…" : "Save key"}</button>
      </form>
    </article>
  );
}

function ConnectionCard({ record, onSave }: { record: ConnectionRecord; onSave: (record: ConnectionRecord) => Promise<void> }) {
  const [target, setTarget] = React.useState(record.target);
  const [busy, setBusy] = React.useState(false);
  return (
    <article className="ms-card">
      <div className="ms-card-top">
        <div className="ms-copy"><strong>{record.name}</strong><span>{record.kind.toUpperCase()}</span></div>
        <em>{record.target ? "Saved" : "Empty"}</em>
      </div>
      <form className="ms-keyrow" onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await onSave({ ...record, target });
        setBusy(false);
      }}>
        <input value={target} onChange={(event) => setTarget(event.target.value)} placeholder={record.kind === "mcp" ? "MCP URL" : "CLI command"} />
        <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </form>
    </article>
  );
}

function BrandsBlock({ brands, setBrands, setNote }: { brands: Brand[]; setBrands: React.Dispatch<React.SetStateAction<Brand[]>>; setNote: (value: string) => void }) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState("");
  async function toggle(brand: Brand) {
    const nextActive = !brand.isActive;
    setBrands((current) => current.map((item) => ({ ...item, isActive: nextActive ? item.id === brand.id : item.id === brand.id ? false : item.isActive })));
    try { if (nextActive) await setActiveBrand(brand.id); setNote(`${brand.name} ${nextActive ? "on" : "off"}.`); }
    catch { setNote(`${brand.name} toggled in the session.`); }
  }
  return (
    <>
      {brands.map((brand) => (
        <article className="ms-card" key={brand.id}>
          <div className="ms-card-top">
            <div className="ms-copy"><strong>{brand.name}</strong><span>{brand.kind ?? "brand"}</span></div>
            <button type="button" className={brand.isActive ? "ms-switch is-on" : "ms-switch"} onClick={() => void toggle(brand)}><i /><span>{brand.isActive ? "On" : "Off"}</span></button>
          </div>
        </article>
      ))}
      <form className="ms-form" onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        try {
          const saved = await saveBrand({ name: name.trim(), slug, kind: kind.trim() || "brand" });
          setBrands((current) => [...current, saved]);
          setNote(`${saved.name} saved to Supabase.`);
        } catch { setNote("Could not save brand to Supabase."); }
        setName(""); setKind("");
      }}>
        <label><span>New brand name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="COAD" /></label>
        <label><span>Kind</span><input value={kind} onChange={(event) => setKind(event.target.value)} placeholder="apparel" /></label>
        <button type="submit">Add brand</button>
      </form>
    </>
  );
}
