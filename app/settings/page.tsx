"use client";

import * as React from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { listBrands, listMarcoAgents } from "@/lib/actions/marco";
import { demoAgents, demoBrands } from "@/lib/demo-marco-data";
import type { Brand, MarcoAgent } from "@/lib/marco-types";
import { ConnectionsPanel } from "@/components/marco/connections-panel";

const sections = ["Agents", "Providers and keys", "Connections", "Brand records", "Sync", "Appearance"] as const;
type Section = (typeof sections)[number];

export default function SettingsPage() {
  const [section, setSection] = React.useState<Section>("Agents");
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  React.useEffect(() => { void Promise.all([listMarcoAgents(), listBrands()]).then(([nextAgents, nextBrands]) => { setAgents(nextAgents.length ? nextAgents : demoAgents); setBrands(nextBrands.length ? nextBrands : demoBrands); }).catch(() => { setAgents(demoAgents); setBrands(demoBrands); }); }, []);
  return <div className="marco-library">
    <header className="marco-library-header"><h1>Settings</h1><p>Agents, API keys, MCP servers, CLI runners.</p></header>
    <div className="marco-settings">
      <nav className="marco-settings-nav">{sections.map((item) => <button key={item} className={section === item ? "is-active" : ""} onClick={() => setSection(item)}>{item}</button>)}</nav>
      <section className="marco-settings-content"><h2>{section}</h2>{section === "Agents" ? <div className="marco-library-card">{agents.map((agent) => <Link href={`/new-agent?edit=${agent.id}`} className="marco-settings-row" key={agent.id}><AgentAvatar color={agent.avatarColor} name={agent.name} size="sm" /><span><b>{agent.name}</b><small>{agent.tagline}</small></span><em className="is-paused">{agent.status}</em></Link>)}</div> : section === "Connections" ? <ConnectionsPanel /> : <Rows section={section} brands={brands} />}</section>
    </div>
  </div>;
}

function Rows({ section, brands }: { section: Section; brands: Brand[] }) {
  const rows = section === "Providers and keys" ? ["OpenRouter — text and reasoning", "fal — image and video", "Monthly budget cap", "Hard stop before external spend"] : section === "Connections" ? ["MCP servers", "CLI runners"] : section === "Brand records" ? brands.map((brand) => brand.name) : section === "Sync" ? ["Obsidian + Supabase"] : ["Theme", "Accent", "Work panel auto-hide"];
  const isProvider = section === "Providers and keys";
  return <div className="marco-library-card"><header><b>{isProvider ? "Generation configuration" : "Configuration"}</b><em className="is-paused">Local preview</em></header>{rows.map((row) => <div className="marco-settings-row" key={row}><span><b>{row}</b><small>{isProvider ? "Saved server-side only after valid provider and Supabase access is connected." : section === "Sync" ? "Supabase is authoritative; Obsidian is a mirror." : "Configuration remains server-side."}</small></span><em>{isProvider ? "Not connected" : section === "Sync" ? "Not configured" : "Missing / Connected"}</em></div>)}</div>;
}
