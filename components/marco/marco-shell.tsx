"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, BrainCircuit, CalendarDays, Folder, Image as ImageIcon,
  MessageCircle, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings,
  Sparkles, SquarePen, Video, Wallet, Users, Zap,
} from "lucide-react";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { MessageCard } from "@/components/marco/run-cards";
import { StudioSurface } from "@/components/marco/studio-surface";
import { cn } from "@/lib/utils";
import type { Brand, MarcoAgent, Thread, ThreadMessage } from "@/lib/marco-types";
import { createRuntimeTurn, listBrands, listMarcoAgents, listMessages, listRuns, listThreads, setActiveBrand } from "@/lib/actions/marco";
import { demoAgents, demoBrands, demoMessages, demoThreads } from "@/lib/demo-marco-data";

type Mode = "chat" | "build";
const FEATURES = [
  ["Image", "/images", ImageIcon],
  ["Video", "/video", Video],
  ["Knowledge", "/knowledge", BookOpen],
  ["Calendar", "/calendar", CalendarDays],
  ["Automations", "/automations", Zap],
  ["Assets", "/assets", Folder],
  ["Memory", "/memory", BrainCircuit],
  ["Spend", "/spend-usage", Wallet],
  ["Settings", "/settings", Settings],
] as const;

export function MarcoShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [agents, setAgents] = React.useState<MarcoAgent[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [activeThread, setActiveThread] = React.useState<Thread | null>(null);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [mode, setMode] = React.useState<Mode>("chat");
  const [draft, setDraft] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [enhancing, setEnhancing] = React.useState(false);
  const [enhanceError, setEnhanceError] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [brandMenu, setBrandMenu] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState(false);
  const [groupPicks, setGroupPicks] = React.useState<string[]>([]);
  const [groupTitle, setGroupTitle] = React.useState("");
  const [railOpen, setRailOpen] = React.useState(true);
  const [mobileThread, setMobileThread] = React.useState(false);

  React.useEffect(() => { if (localStorage.getItem("marco:rail") === "off") setRailOpen(false); }, []);
  React.useEffect(() => {
    const buildRoutes = ["/images", "/video", "/knowledge", "/calendar", "/automations", "/assets", "/memory", "/spend-usage", "/settings", "/new-agent", "/projects"];
    if (buildRoutes.some((route) => pathname.startsWith(route))) { setMode("build"); localStorage.setItem("marco:mode", "build"); }
  }, [pathname]);
  React.useEffect(() => {
    const stored = localStorage.getItem("marco:mode");
    if (stored === "chat" || stored === "build") setMode(stored);
    void Promise.all([listMarcoAgents(), listBrands(), listThreads()]).then(([nextAgents, nextBrands, nextThreads]) => {
      const useDemo = nextAgents.length === 0 || nextThreads.length === 0;
      boot(useDemo ? demoAgents : nextAgents, useDemo ? demoBrands : nextBrands, useDemo ? demoThreads : nextThreads, useDemo);
    }).catch(() => boot(demoAgents, demoBrands, demoThreads, true));
  }, [searchParams]);

  function boot(sourceAgents: MarcoAgent[], sourceBrands: Brand[], sourceThreads: Thread[], useDemo: boolean) {
    setDemoMode(useDemo); setAgents(sourceAgents); setBrands(sourceBrands); setThreads(sourceThreads);
    const requestedThread = searchParams.get("thread");
    const requestedAgent = searchParams.get("agent");
    const selected = sourceThreads.find((thread) => thread.id === requestedThread) ?? sourceThreads.find((thread) => sourceAgents.find((agent) => agent.id === thread.agentId)?.slug === requestedAgent) ?? sourceThreads[0] ?? null;
    setActiveThread(selected);
    setMobileThread(Boolean(requestedThread || requestedAgent));
  }

  React.useEffect(() => {
    if (!activeThread) return;
    if (demoMode) { setMessages(demoMessages.filter((message) => message.threadId === activeThread.id)); return; }
    void Promise.all([listMessages(activeThread.id), listRuns(activeThread.id)]).then(([nextMessages]) => setMessages(nextMessages)).catch(() => setMessages([]));
  }, [activeThread?.id, demoMode]);

  const agent = agents.find((item) => item.id === activeThread?.agentId);
  const brand = brands.find((item) => item.isActive) ?? brands.find((item) => item.id === activeThread?.brandId);
  const participants = (activeThread?.participantAgentIds ?? (activeThread ? [activeThread.agentId] : [])).map((id) => agents.find((item) => item.id === id)).filter((item): item is MarcoAgent => Boolean(item));
  const filteredThreads = threads.filter((thread) => {
    const row = agents.find((item) => item.id === thread.agentId);
    return `${thread.title ?? ""} ${row?.name ?? ""} ${thread.lastMessagePreview ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });

  function toggleRail() { const next = !railOpen; setRailOpen(next); localStorage.setItem("marco:rail", next ? "on" : "off"); }
  function closeRail() { setRailOpen(false); }
  function switchMode(next: Mode) {
    setMode(next); localStorage.setItem("marco:mode", next); closeRail();
    if (next === "chat") { setMobileThread(false); router.push("/"); }
    else if (pathname === "/") router.push("/images");
  }
  function chooseThread(thread: Thread) {
    setActiveThread(thread); setMobileThread(true); setMode("chat"); localStorage.setItem("marco:mode", "chat"); closeRail();
    router.push(`/?thread=${encodeURIComponent(thread.id)}`);
  }
  async function chooseBrand(nextBrand: Brand) {
    setBrandMenu(false);
    if (demoMode) { setBrands((current) => current.map((item) => ({ ...item, isActive: item.id === nextBrand.id }))); return; }
    try { const saved = await setActiveBrand(nextBrand.id); setBrands((current) => current.map((item) => ({ ...item, isActive: item.id === saved.id }))); } catch { /* keep */ }
  }
  async function submit() {
    if (demoMode || !draft.trim() || !activeThread || !agent) return;
    const turn = await createRuntimeTurn({ threadId: activeThread.id, agentId: agent.id, brandId: brand?.id, request: draft.trim() });
    setMessages((old) => [...old, turn.message]); setDraft("");
  }
  async function enhanceDraft() {
    if (demoMode || !draft.trim() || !agent || enhancing) return;
    setEnhancing(true); setEnhanceError(null);
    try {
      const response = await fetch("/api/prompt-enhance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, draft }) });
      const payload = await response.json() as { draft?: string; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error ?? "Could not enhance this prompt.");
      setDraft(payload.draft);
    } catch (error) { setEnhanceError(error instanceof Error ? error.message : "Could not enhance this prompt."); }
    finally { setEnhancing(false); }
  }
  function createGroup(event: React.FormEvent) {
    event.preventDefault();
    if (groupPicks.length < 2) return;
    const picked = agents.filter((item) => groupPicks.includes(item.id));
    const thread: Thread = { id: `local-group-${Date.now()}`, agentId: groupPicks[0], brandId: brand?.id ?? null, title: groupTitle.trim() || picked.map((item) => item.name).join(", "), kind: "group", participantAgentIds: groupPicks, sharedMemory: false, lastMessagePreview: "Private memories stay private", unread: false, updatedAt: new Date().toISOString() };
    setThreads((current) => [thread, ...current]); setActiveThread(thread); setMessages([]); setGroupOpen(false); setGroupPicks([]); setGroupTitle(""); setMode("chat"); setMobileThread(true); closeRail();
    router.push(`/?thread=${encodeURIComponent(thread.id)}`);
  }
  const buildHome = mode === "build" && (pathname === "/" || pathname === "/library" || pathname === "/agents");

  return (
    <div className="zy-root">
      <div className={cn("zy-window", railOpen && "has-rail", mode === "chat" && mobileThread && "is-thread")}>
        <header className="zy-top">
          <div className="zy-top-left">
            <button type="button" className="zy-icon-btn" onClick={toggleRail} aria-label={railOpen ? "Hide sidebar" : "Show sidebar"}>{railOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button>
            <Link href="/" className="zy-logo" onClick={() => switchMode("chat")}><span className="marco-mark"><img src="/agent-mark.png" alt="" /></span><b>MARCO</b></Link>
          </div>
          <div className="zy-mode">
            <button type="button" className={mode === "chat" ? "is-active" : ""} onClick={() => switchMode("chat")}>Chat</button>
            <button type="button" className={mode === "build" ? "is-active" : ""} onClick={() => switchMode("build")}>Build</button>
          </div>
          <div className="zy-top-actions">
            <button type="button" className="zy-brand-chip" onClick={() => setBrandMenu((open) => !open)}>{brand?.name ?? "No brand"}</button>
            {brandMenu && <div className="zy-brand-menu">{brands.map((item) => <button key={item.id} type="button" className={item.id === brand?.id ? "is-active" : ""} onClick={() => void chooseBrand(item)}>{item.name}<small>{item.kind}</small></button>)}</div>}
            <Link href="/settings" className="zy-icon-btn" aria-label="Settings" onClick={closeRail}><Settings size={16} /></Link>
          </div>
        </header>
        <div className={cn("zy-body", mode === "chat" ? "is-chat" : "is-build")}>
          {railOpen && <button type="button" className="zy-scrim" aria-label="Close sidebar" onClick={closeRail} />}
          <aside className="zy-rail">
            <div className="zy-rail-block">
              <small>Agents</small>
              <Link href="/new-agent" className="zy-rail-agent" onClick={closeRail}><Plus size={15} /><span>New agent</span></Link>
              {agents.map((item) => {
                const thread = threads.find((row) => row.agentId === item.id && row.kind !== "group") ?? threads.find((row) => row.agentId === item.id);
                return <button key={item.id} type="button" className={cn("zy-rail-agent", agent?.id === item.id && mode === "chat" && "is-active")} onClick={() => thread && chooseThread(thread)}><AgentAvatar color={item.avatarColor} name={item.name} size="sm" /><span>{item.name}</span></button>;
              })}
              <button type="button" className="zy-rail-agent" onClick={() => setGroupOpen(true)}><Users size={15} /><span>New group</span></button>
            </div>
            <div className="zy-rail-block">
              <small>Library</small>
              {FEATURES.map(([label, href, Icon]) => <Link key={href} href={href} className={pathname === href ? "is-active" : ""} onClick={() => { setMode("build"); localStorage.setItem("marco:mode", "build"); closeRail(); }}><Icon size={16} /><span>{label}</span></Link>)}
            </div>
          </aside>
          {mode === "chat" ? (
            <>
              <section className="im-list">
                <header className="im-list-head"><button type="button">Edit</button><h2>Messages</h2><button type="button" onClick={() => setGroupOpen(true)} aria-label="New message"><SquarePen size={18} /></button></header>
                <label className="im-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label>
                <div className="im-pins">{agents.slice(0, 6).map((item) => { const thread = threads.find((row) => row.agentId === item.id && row.kind !== "group") ?? threads.find((row) => row.agentId === item.id); return <button key={item.id} type="button" onClick={() => thread && chooseThread(thread)}><AgentAvatar color={item.avatarColor} name={item.name} /><span>{item.name}</span></button>; })}</div>
                <div className="im-rows">
                  {filteredThreads.map((thread) => {
                    const rowAgent = agents.find((item) => item.id === thread.agentId);
                    if (!rowAgent) return null;
                    return (
                      <button key={thread.id} type="button" className={cn("im-row", activeThread?.id === thread.id && "is-active")} onClick={() => chooseThread(thread)}>
                        <i className={cn("im-unread", thread.unread && "is-on")} />
                        <AgentAvatar className="im-face" color={rowAgent.avatarColor} name={thread.kind === "group" ? thread.title ?? rowAgent.name : rowAgent.name} />
                        <span className="im-copy">
                          <b>{thread.kind === "group" ? thread.title : rowAgent.name}</b>
                          <time dateTime={thread.updatedAt}>{relativeTime(thread.updatedAt)}</time>
                          <small>{thread.lastMessagePreview ?? rowAgent.tagline ?? "New thread"}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="im-thread">
                <header className="im-thread-head">
                  <button type="button" className="im-back" onClick={() => setMobileThread(false)}>‹</button>
                  {participants[0] ? <AgentAvatar color={participants[0].avatarColor} name={participants[0].name} /> : <span className="marco-title-empty" />}
                  <div><h2>{activeThread?.kind === "group" ? activeThread.title : agent?.name ?? "MARCO"}</h2><p>{activeThread?.kind === "group" ? participants.map((item) => item.name).join(" · ") : agent?.tagline ?? "Start a thread"}</p></div>
                </header>
                <div className="zy-feed">
                  {messages.length ? messages.map((message) => {
                    const speaker = agents.find((item) => item.id === message.agentId);
                    return <div key={message.id} className={cn("zy-bubble-wrap", message.role === "user" && "is-me")}>{message.role !== "user" && speaker && <AgentAvatar color={speaker.avatarColor} name={speaker.name} size="sm" />}<div>{message.role !== "user" && speaker && <em>{speaker.name}</em>}<MessageCard message={message} agentColor={speaker?.avatarColor ?? agent?.avatarColor} /></div></div>;
                  }) : <div className="zy-empty-chat"><b>No messages yet</b><p>Pick an agent from the list.</p></div>}
                </div>
                <form className="im-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                  <button type="button" className="im-plus" aria-label="Attach"><Plus size={18} /></button>
                  <input disabled={demoMode || enhancing} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={demoMode ? "Demo preview" : "iMessage"} />
                  <button className="marco-enhance" type="button" disabled={demoMode || enhancing || !draft.trim()} onClick={() => void enhanceDraft()}><Sparkles size={14} /></button>
                </form>
                {enhanceError && <p className="zy-composer-error" role="alert">{enhanceError}</p>}
              </section>
            </>
          ) : (
            <main className="zy-build-main">{pathname === "/images" ? <StudioSurface kind="image" /> : pathname === "/video" ? <StudioSurface kind="video" /> : buildHome ? <BuildHome onChat={() => switchMode("chat")} onImage={() => router.push("/images")} onVideo={() => router.push("/video")} /> : <div className="zy-page">{children}</div>}</main>
          )}
        </div>
      </div>
      {groupOpen && (
        <div className="zy-modal-scrim" onClick={() => setGroupOpen(false)}>
          <form className="zy-modal" onClick={(event) => event.stopPropagation()} onSubmit={createGroup}>
            <header><h3>New agent group</h3><p>Agents share the brief in the room — not private Obsidian memory or skills.</p></header>
            <label>Group name<input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="Fall drop room" /></label>
            <div className="zy-group-picks">{agents.map((item) => { const on = groupPicks.includes(item.id); return <button key={item.id} type="button" className={on ? "is-on" : ""} onClick={() => setGroupPicks((current) => on ? current.filter((id) => id !== item.id) : [...current, item.id])}><AgentAvatar color={item.avatarColor} name={item.name} size="sm" />{item.name}</button>; })}</div>
            <footer><button type="button" onClick={() => setGroupOpen(false)}>Cancel</button><button type="submit" disabled={groupPicks.length < 2}>Create group</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}

function BuildHome({ onChat, onImage, onVideo }: { onChat: () => void; onImage: () => void; onVideo: () => void }) {
  return <div className="zy-home"><div className="zy-orb" aria-hidden /><h1>Ready to Create Something New?</h1><div className="zy-home-actions"><button type="button" onClick={onImage}><ImageIcon size={14} /> Create Image</button><button type="button" onClick={onVideo}><Video size={14} /> Create Video</button><button type="button" onClick={onChat}><MessageCircle size={14} /> Open Chat</button></div></div>;
}
function relativeTime(value: string) {
  const age = Date.now() - new Date(value).getTime();
  if (age < 60_000) return "now";
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m`;
  if (age < 86_400_000) return `${Math.floor(age / 3_600_000)}h`;
  return `${Math.floor(age / 86_400_000)}d`;
}
