"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { PermissionTri } from "@/components/marco/permission-tri";
import { createAgent, createThread, getMarcoAgent, listBrands, listMarcoAgents, updateAgent } from "@/lib/actions/marco";
import { listProviderModels, type ProviderModel } from "@/lib/actions/workspace-settings";
import { demoAgents, demoBrands } from "@/lib/demo-marco-data";
import type { AgentSurface, Brand, MarcoAgent, PermissionMode } from "@/lib/marco-types";

const COLORS = ["#E8E0D4", "#6B3A2A", "#AD0000", "#E01414", "#2F6B4F", "#4EA0FF", "#3B4BCC", "#7A3DB8", "#FF3D8A", "#6B6B6B"];
const PROVIDERS = ["Inherit (launch profile)", "OpenRouter", "OpenAI", "Anthropic", "fal"];
const defaultPermissions = { generate: "ask", publish: "never", write_knowledge: "ask", use_cli: "never", mcp_write: "ask", budget_cap_per_run: 5 } as const;

export default function NewAgentPage() {
  return (
    <React.Suspense fallback={<div className="zy-modal-scrim"><div className="zy-agent-modal"><p>Loading agent…</p></div></div>}>
      <NewAgentForm />
    </React.Suspense>
  );
}

function NewAgentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [soul, setSoul] = React.useState("");
  const [color, setColor] = React.useState(COLORS[2]);
  const [advanced, setAdvanced] = React.useState(true);
  const [advancedTab, setAdvancedTab] = React.useState<"General" | "Capabilities">("General");
  const [cloneFrom, setCloneFrom] = React.useState("default");
  const [provider, setProvider] = React.useState(PROVIDERS[1]);
  const [model, setModel] = React.useState("");
  const [models, setModels] = React.useState<ProviderModel[]>([]);
  const [modelNote, setModelNote] = React.useState("");
  const [shareKeys, setShareKeys] = React.useState(true);
  const [surfaces, setSurfaces] = React.useState<AgentSurface[]>(["chat"]);
  const [permissions, setPermissions] = React.useState<Record<string, PermissionMode | number>>({ ...defaultPermissions });
  const [handoffs, setHandoffs] = React.useState<string[]>([]);
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.all([listBrands(), listMarcoAgents()]).then(([nextBrands, nextAgents]) => {
      setBrands(nextBrands.length ? nextBrands : demoBrands);
      setAgents(nextAgents.length ? nextAgents : demoAgents);
    }).catch(() => { setBrands(demoBrands); setAgents(demoAgents); });
  }, []);

  React.useEffect(() => {
    if (!editId) return;
    void getMarcoAgent(editId).then((agent) => {
      setName(agent.slug || agent.name.toLowerCase().replace(/\s+/g, "-"));
      setTitle(agent.name);
      setDescription(agent.tagline ?? "");
      setSoul(agent.instructions ?? "");
      setColor(agent.avatarColor.startsWith("#") ? agent.avatarColor : COLORS[2]);
      setSurfaces(agent.surfaces);
      setModel(agent.modelReasoning ?? agent.modelFast ?? "");
      setPermissions({ ...defaultPermissions, ...agent.permissions });
      setHandoffs(agent.canHandoffTo);
    }).catch(() => {
      const agent = demoAgents.find((item) => item.id === editId || item.id.startsWith(editId) || item.slug.startsWith(editId));
      if (!agent) { setNote("That agent link is a demo stub. Create a new agent instead."); return; }
      setName(agent.slug); setTitle(agent.name); setDescription(agent.tagline ?? ""); setSoul(agent.instructions ?? ""); setColor(agent.avatarColor);
    });
  }, [editId]);

  React.useEffect(() => {
    if (provider === "Inherit (launch profile)") { setModels([]); setModelNote("Uses the workspace default model."); return; }
    setModelNote("Loading models…");
    void listProviderModels(provider).then((result) => {
      setModels(result.models);
      setModelNote(result.configured ? `${result.models.length} models from ${provider}.` : `No ${provider} key yet — showing a starter list. Save a key in Settings.`);
      setModel((current) => current || result.models[0]?.id || "");
    }).catch(() => setModelNote("Could not load models."));
  }, [provider]);

  function close() { router.push("/settings"); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const displayName = title.trim() || name.trim();
    if (!displayName) return;
    setSaving(true); setNote(null);
    try {
      const instructions = [soul.trim() || description.trim(), "Memory writes to Obsidian. Supabase holds the live run state only.", "Group threads share the room packet only. Private memory and skills stay private."].filter(Boolean).join("\n\n");
      const input = { name: displayName, slug: name.trim() || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-"), tagline: description.trim() || title.trim(), instructions, avatarColor: color, surfaces, modelReasoning: model || null, modelFast: model || null, modelRender: provider === "fal" ? (model || null) : null, permissions, canHandoffTo: handoffs };
      if (editId && !editId.startsWith("demo-")) { try { await updateAgent(editId, input); } catch { /* local */ } router.push("/settings"); }
      else {
        try { const agent = await createAgent(input); const thread = await createThread(agent.id, brands.find((brand) => brand.isActive)?.id ?? null); router.push(`/?thread=${thread.id}`); }
        catch { setNote("Saved locally in this session. Connect Supabase to persist the agent."); router.push("/"); }
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="zy-modal-scrim" onClick={close}>
      <form className="zy-agent-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button type="button" className="zy-agent-close" onClick={close} aria-label="Close">×</button>
        <header>
          <h1>{editId ? "Edit Agent" : "New Agent"}</h1>
          <p>A named teammate with its own memory, skills, and chat. Groups share the job in the room — never another agent’s private memory or skills.</p>
        </header>
        {note && <p className="zy-agent-note">{note}</p>}
        <div className="zy-avatar-preview">
          <AgentAvatar color={color} name={title || name || "Agent"} size="lg" />
          <div className="zy-color-row">
            {COLORS.map((item) => <button key={item} type="button" className={color === item ? "is-on" : ""} style={{ background: item }} onClick={() => setColor(item)} aria-label={item} />)}
            <input type="color" value={color.startsWith("#") ? color : COLORS[2]} onChange={(event) => setColor(event.target.value)} aria-label="Custom background color" />
          </div>
        </div>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="captain" required={!title.trim()} /></label>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Captain" required={!name.trim()} /></label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this agent help with?" rows={3} /></label>
        <button type="button" className="zy-advanced-toggle" onClick={() => setAdvanced((open) => !open)}>{advanced ? "▾" : "▸"} Advanced</button>
        {advanced && (
          <div className="zy-advanced">
            <div className="zy-avatar-tabs">
              <button type="button" className={advancedTab === "General" ? "is-on" : ""} onClick={() => setAdvancedTab("General")}>General</button>
              <button type="button" className={advancedTab === "Capabilities" ? "is-on" : ""} onClick={() => setAdvancedTab("Capabilities")}>Capabilities</button>
            </div>
            {advancedTab === "General" ? (
              <>
                <label>Clone from profile<select value={cloneFrom} onChange={(event) => setCloneFrom(event.target.value)}><option value="default">default</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
                <div className="zy-two">
                  <label>Provider<select value={provider} onChange={(event) => { setProvider(event.target.value); setModel(""); }}>{PROVIDERS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Model
                    <select value={model} onChange={(event) => setModel(event.target.value)}>
                      {models.length === 0 && <option value="">Select a provider first</option>}
                      {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <p className="zy-agent-note">{modelNote}</p>
                <label>SOUL.md<textarea value={soul} onChange={(event) => setSoul(event.target.value)} rows={5} placeholder="Standing instructions for this agent." /></label>
                <label className="zy-check"><input type="checkbox" checked={shareKeys} onChange={(event) => setShareKeys(event.target.checked)} /> Share keys with the main profile</label>
              </>
            ) : (
              <>
                <label className="zy-check"><input type="checkbox" checked={surfaces.includes("build")} onChange={() => setSurfaces((old) => old.includes("build") ? ["chat"] : ["chat", "build"])} /> Build surface</label>
                {(["generate", "publish", "write_knowledge", "use_cli", "mcp_write"] as const).map((key) => (
                  <div className="zy-perm" key={key}><span>{key.replaceAll("_", " ")}</span><PermissionTri value={permissionValue(permissions, key)} onChange={(value) => setPermissions((old) => ({ ...old, [key]: value }))} /></div>
                ))}
                <p className="zy-agent-note">Can hand off work packets — not private memory.</p>
                <div className="zy-group-picks">{agents.filter((agent) => agent.id !== editId).map((agent) => <button key={agent.id} type="button" className={handoffs.includes(agent.id) ? "is-on" : ""} onClick={() => setHandoffs((old) => old.includes(agent.id) ? old.filter((id) => id !== agent.id) : [...old, agent.id])}>{agent.name}</button>)}</div>
              </>
            )}
          </div>
        )}
        <footer>
          <button type="button" onClick={close}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : editId ? "Save Agent" : "Create Agent"}</button>
        </footer>
      </form>
    </div>
  );
}

function permissionValue(permissions: Record<string, PermissionMode | number>, key: string): PermissionMode {
  const value = permissions[key];
  return value === "always" || value === "never" ? value : "ask";
}
