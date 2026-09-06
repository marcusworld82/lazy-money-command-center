"use client";

import * as React from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { listBrands, listMarcoAgents, saveBrand } from "@/lib/actions/marco";
import { demoAgents, demoBrands } from "@/lib/demo-marco-data";
import type { Brand, MarcoAgent } from "@/lib/marco-types";

const sections = ["Agents", "Providers and keys", "Connections", "Brand records", "Sync", "Appearance"] as const;
type Section = (typeof sections)[number];

export default function SettingsPage() {
  const [section, setSection] = React.useState<Section>("Agents");
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [providers, setProviders] = React.useState([
    { id: "openrouter", name: "OpenRouter", detail: "Text and reasoning" },
    { id: "fal", name: "fal", detail: "Image and video" },
  ]);
  const [connections, setConnections] = React.useState([
    { id: "mcp", name: "MCP servers", detail: "Tools the agents can call" },
    { id: "cli", name: "CLI runners", detail: "Local or remote executors" },
  ]);
  const [draft, setDraft] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.all([listMarcoAgents(), listBrands()])
      .then(([nextAgents, nextBrands]) => {
        setAgents(nextAgents.length ? nextAgents : demoAgents);
        setBrands(nextBrands.length ? nextBrands : demoBrands);
      })
      .catch(() => { setAgents(demoAgents); setBrands(demoBrands); });
  }, []);

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    setError(null);
    if (section === "Providers and keys") {
      setProviders((current) => [...current, { id: `local-${Date.now()}`, name, detail: detail.trim() || "Keys stay server-side" }]);
    } else if (section === "Connections") {
      setConnections((current) => [...current, { id: `local-${Date.now()}`, name, detail: detail.trim() || "Connection record" }]);
    } else if (section === "Brand records") {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      try {
        const saved = await saveBrand({ name, slug, kind: detail.trim() || "brand" });
        setBrands((current) => [...current, saved]);
      } catch {
        setBrands((current) => [...current, { id: `local-${Date.now()}`, name, slug, kind: detail.trim() || "brand", isActive: false, colors: null, voice: null, audience: null, offers: null, restrictions: null }]);
        setError("Saved locally. Connect Supabase to persist the brand record.");
      }
    }
    setDraft("");
    setDetail("");
  }

  return (
    <div className="set-wrap">
      <header>
        <h1>Settings</h1>
        <p>Agents, providers, connections, and brand records.</p>
      </header>
      <div className="set-grid">
        <nav>
          {sections.map((item) => (
            <button key={item} type="button" className={section === item ? "is-on" : ""} onClick={() => setSection(item)}>{item}</button>
          ))}
        </nav>
        <section>
          <div className="set-title">
            <h2>{section}</h2>
            {section === "Agents" && <Link href="/new-agent" className="set-add">+ New agent</Link>}
          </div>
          {section === "Agents" && agents.map((agent) => (
            <Link href={`/new-agent?edit=${agent.id}`} className="set-row" key={agent.id}>
              <AgentAvatar color={agent.avatarColor} name={agent.name} size="sm" />
              <span><b>{agent.name}</b><small>{agent.tagline}</small></span>
              <em>{agent.status}</em>
            </Link>
          ))}
          {section === "Providers and keys" && providers.map((item) => (
            <div className="set-row" key={item.id}><span><b>{item.name}</b><small>{item.detail}. API keys never enter the browser bundle.</small></span><em>Not connected</em></div>
          ))}
          {section === "Connections" && connections.map((item) => (
            <div className="set-row" key={item.id}><span><b>{item.name}</b><small>{item.detail}</small></span><em>Missing</em></div>
          ))}
          {section === "Brand records" && brands.map((brand) => (
            <div className="set-row" key={brand.id}><span><b>{brand.name}</b><small>{brand.kind ?? "brand"}</small></span><em>{brand.isActive ? "Active" : "Off"}</em></div>
          ))}
          {section === "Sync" && (
            <div className="set-row"><span><b>Obsidian + Supabase</b><small>Supabase is the live run state. Obsidian holds memory.</small></span><em>Not configured</em></div>
          )}
          {section === "Appearance" && (
            <div className="set-row"><span><b>Red Zyricon chrome</b><small>Accent stays --red. No purple.</small></span><em>On</em></div>
          )}
          {(section === "Providers and keys" || section === "Connections" || section === "Brand records") && (
            <form className="set-form" onSubmit={addItem}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={section === "Providers and keys" ? "Provider name" : section === "Connections" ? "Connection name" : "Brand name"} />
              <input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={section === "Providers and keys" ? "Use case" : section === "Connections" ? "MCP or CLI" : "Kind"} />
              <button type="submit">Add {section === "Providers and keys" ? "provider" : section === "Connections" ? "connection" : "brand"}</button>
              {error && <p>{error}</p>}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
