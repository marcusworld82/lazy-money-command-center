"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAgent, createThread, getMarcoAgent, listBrands, listMarcoAgents, updateAgent } from "@/lib/actions/marco";
import type { AgentSurface, Brand, MarcoAgent, PermissionMode } from "@/lib/marco-types";
import { PermissionTri } from "@/components/marco/permission-tri";

const COLORS = ["#E8E0D4", "#6B3A2A", "#AD0000", "#E01414", "#2F6B4F", "#4EA0FF", "#3B4BCC", "#7A3DB8", "#FF3D8A", "#6B6B6B"];
const ICONS = ["☺", "◔", "▣", "▤", "▲", "◆", "☁", "●"];
const PROVIDERS = ["Inherit (launch profile)", "OpenRouter", "fal"];

const defaultPermissions = {
  generate: "ask",
  publish: "never",
  write_knowledge: "ask",
  use_cli: "never",
  mcp_write: "ask",
  budget_cap_per_run: 5,
} as const;

export default function NewAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [soul, setSoul] = React.useState("");
  const [color, setColor] = React.useState(COLORS[2]);
  const [icon, setIcon] = React.useState(ICONS[0]);
  const [avatarTab, setAvatarTab] = React.useState<"Bot" | "Generate" | "Upload" | "Pet">("Bot");
  const [advanced, setAdvanced] = React.useState(true);
  const [advancedTab, setAdvancedTab] = React.useState<"General" | "Capabilities">("General");
  const [cloneFrom, setCloneFrom] = React.useState("default");
  const [provider, setProvider] = React.useState(PROVIDERS[0]);
  const [model, setModel] = React.useState("");
  const [shareKeys, setShareKeys] = React.useState(true);
  const [createEmpty, setCreateEmpty] = React.useState(false);
  const [surfaces, setSurfaces] = React.useState<AgentSurface[]>(["chat"]);
  const [permissions, setPermissions] = React.useState<Record<string, PermissionMode | number>>({ ...defaultPermissions });
  const [handoffs, setHandoffs] = React.useState<string[]>([]);
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.all([listBrands(), listMarcoAgents()])
      .then(([nextBrands, nextAgents]) => { setBrands(nextBrands); setAgents(nextAgents); })
      .catch(() => setLoadError("Could not load agent settings."));
  }, []);

  React.useEffect(() => {
    if (!editId) return;
    void getMarcoAgent(editId).then((agent) => {
      setName(agent.slug || agent.name.toLowerCase().replace(/\s+/g, "-"));
      setTitle(agent.name);
      setDescription(agent.tagline ?? "");
      setSoul(agent.instructions ?? "");
      setColor(agent.avatarColor);
      setSurfaces(agent.surfaces);
      setModel(agent.modelReasoning ?? agent.modelFast ?? "");
      setPermissions({ ...defaultPermissions, ...agent.permissions });
      setHandoffs(agent.canHandoffTo);
    }).catch(() => setLoadError("Could not load this agent."));
  }, [editId]);

  function close() {
    router.push("/settings");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const displayName = title.trim() || name.trim();
    if (!displayName) return;
    setSaving(true);
    try {
      const instructions = [
        soul.trim() || description.trim(),
        "Memory writes to Obsidian. Supabase holds the live run state only.",
        "Group threads share the room packet only. Private memory and skills stay private.",
      ].filter(Boolean).join("\n\n");
      const input = {
        name: displayName,
        slug: name.trim() || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        tagline: description.trim() || title.trim(),
        instructions,
        avatarColor: color,
        surfaces,
        modelReasoning: model || null,
        modelFast: model || null,
        modelRender: provider === "fal" ? (model || null) : null,
        permissions,
        canHandoffTo: handoffs,
      };
      if (editId) {
        await updateAgent(editId, input);
        router.push("/settings");
      } else {
        const agent = await createAgent(input);
        const thread = await createThread(agent.id, brands.find((brand) => brand.isActive)?.id ?? null);
        router.push(`/?thread=${thread.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="zy-modal-scrim" onClick={close}>
      <form className="zy-agent-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button type="button" className="zy-agent-close" onClick={close} aria-label="Close">×</button>
        <header>
          <h1>{editId ? "Edit Agent" : "New Agent"}</h1>
          <p>A named teammate with its own memory, skills, and chat. Groups share the job in the room — never another agent’s private memory or skills.</p>
        </header>
        {loadError && <p className="zy-agent-error">{loadError}</p>}
        <div className="zy-avatar-tabs">
          {(["Bot", "Generate", "Upload", "Pet"] as const).map((tab) => (
            <button key={tab} type="button" className={avatarTab === tab ? "is-on" : ""} onClick={() => setAvatarTab(tab)}>{tab}</button>
          ))}
        </div>
        {avatarTab === "Bot" ? (
          <>
            <div className="zy-icon-grid">
              {ICONS.map((item) => (
                <button key={item} type="button" className={icon === item ? "is-on" : ""} style={{ background: color }} onClick={() => setIcon(item)}>{item}</button>
              ))}
            </div>
            <div className="zy-color-row">
              {COLORS.map((item) => (
                <button key={item} type="button" className={color === item ? "is-on" : ""} style={{ background: item }} onClick={() => setColor(item)} aria-label={item} />
              ))}
            </div>
          </>
        ) : (
          <p className="zy-agent-note">{avatarTab} avatars are reserved. Use Bot for now — no fake generated face is stored.</p>
        )}
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="captain" required={!title.trim()} /></label>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Captain" required={!name.trim()} /></label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this Bot help with?" rows={3} /></label>
        <button type="button" className="zy-advanced-toggle" onClick={() => setAdvanced((open) => !open)}>
          {advanced ? "▾" : "▸"} Advanced
        </button>
        {advanced && (
          <div className="zy-advanced">
            <div className="zy-avatar-tabs">
              <button type="button" className={advancedTab === "General" ? "is-on" : ""} onClick={() => setAdvancedTab("General")}>General</button>
              <button type="button" className={advancedTab === "Capabilities" ? "is-on" : ""} onClick={() => setAdvancedTab("Capabilities")}>Capabilities</button>
            </div>
            {advancedTab === "General" ? (
              <>
                <label>
                  Clone from profile
                  <select value={cloneFrom} onChange={(event) => setCloneFrom(event.target.value)}>
                    <option value="default">default</option>
                    {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                  </select>
                </label>
                <div className="zy-two">
                  <label>
                    Provider
                    <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                      {PROVIDERS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    Model
                    <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="inherited from launch profile" />
                  </label>
                </div>
                <label>
                  SOUL.md (optional — replaces the generated persona)
                  <textarea value={soul} onChange={(event) => setSoul(event.target.value)} rows={5} placeholder="Leave blank to auto-generate from name/title/description + agent-messaging roster." />
                </label>
                <label className="zy-check">
                  <input type="checkbox" checked={shareKeys} onChange={(event) => setShareKeys(event.target.checked)} />
                  Share keys & accounts with the main profile
                </label>
                <p className="zy-agent-note">Subscriptions, OAuth logins, and API keys stay shared (not copied). Keys never enter the browser bundle.</p>
                <label className="zy-check">
                  <input type="checkbox" checked={createEmpty} onChange={(event) => setCreateEmpty(event.target.checked)} />
                  Create empty (skip bundled skills)
                </label>
              </>
            ) : (
              <>
                <label className="zy-check">
                  <input type="checkbox" checked={surfaces.includes("build")} onChange={() => setSurfaces((old) => old.includes("build") ? ["chat"] : ["chat", "build"])} />
                  Build surface (runs, manifests, generation)
                </label>
                {(["generate", "publish", "write_knowledge", "use_cli", "mcp_write"] as const).map((key) => (
                  <div className="zy-perm" key={key}>
                    <span>{key.replaceAll("_", " ")}</span>
                    <PermissionTri value={permissionValue(permissions, key)} onChange={(value) => setPermissions((old) => ({ ...old, [key]: value }))} />
                  </div>
                ))}
                <p className="zy-agent-note">Can hand off work packets — not private memory.</p>
                <div className="zy-group-picks">
                  {agents.filter((agent) => agent.id !== editId).map((agent) => (
                    <button key={agent.id} type="button" className={handoffs.includes(agent.id) ? "is-on" : ""} onClick={() => setHandoffs((old) => old.includes(agent.id) ? old.filter((id) => id !== agent.id) : [...old, agent.id])}>
                      {agent.name}
                    </button>
                  ))}
                </div>
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
