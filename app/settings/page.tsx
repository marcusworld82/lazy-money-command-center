"use client";

import * as React from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { listBrands, listMarcoAgents, saveBrand, setActiveBrand } from "@/lib/actions/marco";
import { demoAgents, demoBrands } from "@/lib/demo-marco-data";
import type { Brand, MarcoAgent } from "@/lib/marco-types";

const sections = ["Agents", "Providers and keys", "Connections", "Brand records", "Sync", "Appearance"] as const;
type Section = (typeof sections)[number];
type Provider = { id: string; name: string; kind: string; endpoint: string; last4: string };
type Connection = { id: string; name: string; kind: "mcp" | "cli"; target: string };

const DEFAULT_PROVIDERS: Provider[] = [
  { id: "openrouter", name: "OpenRouter", kind: "router", endpoint: "https://openrouter.ai/api/v1", last4: "" },
  { id: "openai", name: "OpenAI / ChatGPT API", kind: "text", endpoint: "https://api.openai.com/v1", last4: "" },
  { id: "anthropic", name: "Anthropic / Claude API", kind: "text", endpoint: "https://api.anthropic.com", last4: "" },
  { id: "fal", name: "fal", kind: "media", endpoint: "https://fal.run", last4: "" },
];
const DEFAULT_CONNECTIONS: Connection[] = [
  { id: "openart-mcp", name: "OpenArt MCP", kind: "mcp", target: "" },
  { id: "higgsfield-cli", name: "Higgsfield CLI", kind: "cli", target: "" },
];

export default function SettingsPage() {
  const [section, setSection] = React.useState<Section>("Agents");
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [providers, setProviders] = React.useState<Provider[]>(DEFAULT_PROVIDERS);
  const [connections, setConnections] = React.useState<Connection[]>(DEFAULT_CONNECTIONS);
  const [obsidianPath, setObsidianPath] = React.useState("");
  const [supabaseUrl, setSupabaseUrl] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("marco:settings");
      if (raw) {
        const saved = JSON.parse(raw) as { providers?: Provider[]; connections?: Connection[]; obsidianPath?: string; supabaseUrl?: string };
        if (saved.providers?.length) setProviders(saved.providers);
        if (saved.connections?.length) setConnections(saved.connections);
        if (saved.obsidianPath) setObsidianPath(saved.obsidianPath);
        if (saved.supabaseUrl) setSupabaseUrl(saved.supabaseUrl);
      }
    } catch { /* ignore */ }
    void Promise.all([listMarcoAgents(), listBrands()]).then(([nextAgents, nextBrands]) => {
      setAgents(nextAgents.length ? nextAgents : demoAgents);
      setBrands(nextBrands.length ? nextBrands : demoBrands);
    }).catch(() => { setAgents(demoAgents); setBrands(demoBrands); });
  }, []);

  function persist(next?: Partial<{ providers: Provider[]; connections: Connection[]; obsidianPath: string; supabaseUrl: string }>) {
    localStorage.setItem("marco:settings", JSON.stringify({
      providers: next?.providers ?? providers,
      connections: next?.connections ?? connections,
      obsidianPath: next?.obsidianPath ?? obsidianPath,
      supabaseUrl: next?.supabaseUrl ?? supabaseUrl,
    }));
  }

  return (
    <div className="set-wrap">
      <header><h1>Settings</h1><p>Agents, API keys, MCP / CLI connections, brands, and sync.</p></header>
      <div className="set-grid">
        <nav>{sections.map((item) => <button key={item} type="button" className={section === item ? "is-on" : ""} onClick={() => setSection(item)}>{item}</button>)}</nav>
        <section>
          <div className="set-title"><h2>{section}</h2>{section === "Agents" && <Link href="/new-agent" className="set-add">+ New agent</Link>}</div>
          {section === "Agents" && agents.map((agent) => (
            <Link href={`/new-agent?edit=${agent.id}`} className="set-row" key={agent.id}>
              <AgentAvatar color={agent.avatarColor} name={agent.name} size="sm" />
              <span><b>{agent.name}</b><small>{agent.tagline}</small></span>
              <em>{agent.status}</em>
            </Link>
          ))}
          {section === "Providers and keys" && <ProvidersPanel providers={providers} onChange={(next) => { setProviders(next); persist({ providers: next }); }} onStatus={setStatus} />}
          {section === "Connections" && <ConnectionsPanel connections={connections} onChange={(next) => { setConnections(next); persist({ connections: next }); }} onStatus={setStatus} />}
          {section === "Brand records" && <BrandsPanel brands={brands} setBrands={setBrands} onStatus={setStatus} />}
          {section === "Sync" && (
            <form className="set-form" onSubmit={(event) => { event.preventDefault(); persist({ obsidianPath, supabaseUrl }); setStatus("Sync paths saved on this device."); }}>
              <label>Obsidian vault path<input value={obsidianPath} onChange={(event) => setObsidianPath(event.target.value)} placeholder="/Users/you/Documents/MARCO" /></label>
              <label>Supabase project URL<input value={supabaseUrl} onChange={(event) => setSupabaseUrl(event.target.value)} placeholder="https://xxxx.supabase.co" /></label>
              <p className="set-note">Supabase stays the live run state. Obsidian holds durable memory. Service-role keys stay in Vercel env, not this form.</p>
              <button type="submit">Save sync</button>
            </form>
          )}
          {section === "Appearance" && <div className="set-card"><div className="set-card-top"><span><b>Red Zyricon chrome</b><small>Accent stays --red. No purple.</small></span><em>On</em></div></div>}
          {status && <p className="set-note">{status}</p>}
        </section>
      </div>
    </div>
  );
}

function ProvidersPanel({ providers, onChange, onStatus }: { providers: Provider[]; onChange: (next: Provider[]) => void; onStatus: (value: string) => void }) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState("text");
  const [endpoint, setEndpoint] = React.useState("");
  const [key, setKey] = React.useState("");
  const [activeId, setActiveId] = React.useState(providers[0]?.id ?? "");
  function saveKey(event: React.FormEvent) {
    event.preventDefault();
    const target = providers.find((item) => item.id === activeId);
    if (!target || !key.trim()) return;
    const last4 = key.trim().slice(-4);
    onChange(providers.map((item) => item.id === activeId ? { ...item, last4 } : item));
    setKey("");
    onStatus(`${target.name} key saved on this device (${last4}). Add the same value to Vercel env for production: ${envName(target.id)}. ChatGPT and Claude subscriptions do not work here — use API keys.`);
  }
  function addProvider(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onChange([...providers, { id: `prov-${Date.now()}`, name: name.trim(), kind, endpoint: endpoint.trim(), last4: key.trim() ? key.trim().slice(-4) : "" }]);
    setName(""); setEndpoint(""); setKey("");
    onStatus("Provider added.");
  }
  return (
    <>
      {providers.map((item) => <div className="set-card" key={item.id}><div className="set-card-top"><span><b>{item.name}</b><small>{item.kind} · {item.endpoint || "no endpoint"}</small></span><em>{item.last4 ? `Saved ···${item.last4}` : "Not connected"}</em></div></div>)}
      <form className="set-form" onSubmit={saveKey}>
        <label>Save key for<select value={activeId} onChange={(event) => setActiveId(event.target.value)}>{providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>API key<input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="sk-... or or-..." autoComplete="off" /></label>
        <button type="submit">Save key</button>
      </form>
      <form className="set-form" onSubmit={addProvider}>
        <label>New provider name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Together, Groq, custom..." /></label>
        <label>Kind<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="text">Text</option><option value="router">Router</option><option value="media">Image / video</option></select></label>
        <label>Endpoint<input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://api.example.com/v1" /></label>
        <button type="submit">Add provider</button>
      </form>
    </>
  );
}

function ConnectionsPanel({ connections, onChange, onStatus }: { connections: Connection[]; onChange: (next: Connection[]) => void; onStatus: (value: string) => void }) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"mcp" | "cli">("mcp");
  const [target, setTarget] = React.useState("");
  const [editId, setEditId] = React.useState(connections[0]?.id ?? "");
  function saveTarget(event: React.FormEvent) {
    event.preventDefault();
    onChange(connections.map((item) => item.id === editId ? { ...item, target: target.trim() } : item));
    setTarget("");
    onStatus("Connection saved. MCP and CLI run on a worker host, not inside the Vercel browser app.");
  }
  function addConnection(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !target.trim()) return;
    onChange([...connections, { id: `conn-${Date.now()}`, name: name.trim(), kind, target: target.trim() }]);
    setName(""); setTarget("");
    onStatus("Connection record added.");
  }
  return (
    <>
      {connections.map((item) => <div className="set-card" key={item.id}><div className="set-card-top"><span><b>{item.name}</b><small>{item.kind.toUpperCase()} · {item.target || "no command or URL yet"}</small></span><em>{item.target ? "Saved" : "Empty"}</em></div></div>)}
      <p className="set-note">Yes — you can register OpenArt as an MCP server and Higgsfield as a CLI. MARCO stores the connection. A worker has to execute it. Vercel serverless cannot keep a CLI process alive.</p>
      <form className="set-form" onSubmit={saveTarget}>
        <label>Update<select value={editId} onChange={(event) => setEditId(event.target.value)}>{connections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>MCP URL or CLI command<input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="npx openart-mcp or higgsfield run" /></label>
        <button type="submit">Save connection</button>
      </form>
      <form className="set-form" onSubmit={addConnection}>
        <label>New connection<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Custom MCP or CLI" /></label>
        <label>Type<select value={kind} onChange={(event) => setKind(event.target.value as "mcp" | "cli")}><option value="mcp">MCP</option><option value="cli">CLI</option></select></label>
        <label>URL or command<input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="https://mcp.example.com or /usr/local/bin/tool" /></label>
        <button type="submit">Add connection</button>
      </form>
    </>
  );
}

function BrandsPanel({ brands, setBrands, onStatus }: { brands: Brand[]; setBrands: React.Dispatch<React.SetStateAction<Brand[]>>; onStatus: (value: string) => void }) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState("");
  async function toggle(brand: Brand) {
    const nextActive = !brand.isActive;
    setBrands((current) => current.map((item) => ({ ...item, isActive: nextActive ? item.id === brand.id : item.id === brand.id ? false : item.isActive })));
    try { if (nextActive) await setActiveBrand(brand.id); onStatus(`${brand.name} ${nextActive ? "on" : "off"}.`); }
    catch { onStatus(`${brand.name} toggled locally.`); }
  }
  async function addBrand(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      const saved = await saveBrand({ name: name.trim(), slug, kind: kind.trim() || "brand" });
      setBrands((current) => [...current, saved]);
    } catch {
      setBrands((current) => [...current, { id: `local-${Date.now()}`, name: name.trim(), slug, kind: kind.trim() || "brand", isActive: false, colors: null, voice: null, audience: null, offers: null, restrictions: null }]);
      onStatus("Brand saved locally. Connect Supabase to persist it.");
    }
    setName(""); setKind("");
  }
  return (
    <>
      {brands.map((brand) => (
        <div className="set-card" key={brand.id}>
          <div className="set-card-top">
            <span><b>{brand.name}</b><small>{brand.kind ?? "brand"}</small></span>
            <button type="button" className={brand.isActive ? "set-toggle is-on" : "set-toggle"} onClick={() => void toggle(brand)}><i /><span>{brand.isActive ? "On" : "Off"}</span></button>
          </div>
        </div>
      ))}
      <form className="set-form" onSubmit={addBrand}>
        <label>Brand name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="COAD" /></label>
        <label>Kind<input value={kind} onChange={(event) => setKind(event.target.value)} placeholder="apparel, media, services" /></label>
        <button type="submit">Add brand</button>
      </form>
    </>
  );
}

function envName(id: string) {
  if (id === "openai") return "OPENAI_API_KEY";
  if (id === "anthropic") return "ANTHROPIC_API_KEY";
  if (id === "fal") return "FAL_KEY";
  if (id === "openrouter") return "OPENROUTER_API_KEY";
  return "CUSTOM_API_KEY";
}
