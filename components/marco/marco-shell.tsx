"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bot, BookOpen, BrainCircuit, CalendarDays, Folder, Menu, MessageCircle, PanelRightClose, PanelRightOpen, Plus, Settings, Sparkles, X, Zap } from "lucide-react";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { MessageCard, RunSteps } from "@/components/marco/run-cards";
import { cn } from "@/lib/utils";
import type { Brand, MarcoAgent, Run, Thread, ThreadMessage } from "@/lib/marco-types";
import { createRuntimeTurn, listBrands, listMarcoAgents, listMessages, listRuns, listThreads, setActiveBrand } from "@/lib/actions/marco";
import { demoAgents, demoBrands, demoMessages, demoRun, demoThreads } from "@/lib/demo-marco-data";

const LIBRARY = [
  ["Calendar", "/calendar", "🗓️"], ["Automations", "/automations", "⚡"], ["Assets", "/assets", "🗂️"],
  ["Knowledge", "/knowledge", "📚"], ["Memory", "/memory", "🧠"], ["Spend", "/spend-usage", "⋮"], ["Settings", "/settings", "⚙"],
] as const;

const UTILITY_NAV = [
  ["Threads", "/", MessageCircle], ["Agents", "/agents", Bot], ["Automations", "/automations", Zap],
  ["Knowledge", "/knowledge", BookOpen], ["Memory", "/memory", BrainCircuit], ["Assets", "/assets", Folder], ["Calendar", "/calendar", CalendarDays],
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
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [view, setView] = React.useState<"chat" | "build">("chat");
  const [rail, setRail] = React.useState(false);
  const [work, setWork] = React.useState(true);
  const [drawer, setDrawer] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [enhancing, setEnhancing] = React.useState(false);
  const [enhanceError, setEnhanceError] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [brandMenu, setBrandMenu] = React.useState(false);

  React.useEffect(() => {
    setRail(localStorage.getItem("marco:rail-collapsed") === "true");
    setWork(localStorage.getItem("marco:work-open") !== "false");
    void Promise.all([listMarcoAgents(), listBrands(), listThreads()]).then(([nextAgents, nextBrands, nextThreads]) => {
      const useDemo = nextAgents.length === 0 || nextThreads.length === 0;
      const sourceAgents = useDemo ? demoAgents : nextAgents;
      const sourceBrands = useDemo ? demoBrands : nextBrands;
      const sourceThreads = useDemo ? demoThreads : nextThreads;
      setDemoMode(useDemo); setAgents(sourceAgents); setBrands(sourceBrands); setThreads(sourceThreads);
      const requestedThread = searchParams.get("thread");
      const requestedAgent = searchParams.get("agent");
      const requestedView = searchParams.get("view");
      const selected = sourceThreads.find((thread) => thread.id === requestedThread)
        ?? sourceThreads.find((thread) => sourceAgents.find((agent) => agent.id === thread.agentId)?.slug === requestedAgent)
        ?? sourceThreads[1] ?? sourceThreads[0] ?? null;
      setActiveThread(selected);
      const selectedAgent = sourceAgents.find((agent) => agent.id === selected?.agentId);
      setView(requestedView === "build" && selectedAgent?.surfaces.includes(requestedView) ? requestedView : "chat");
    }).catch(() => {
      setDemoMode(true); setAgents(demoAgents); setBrands(demoBrands); setThreads(demoThreads);
      const requestedThread = searchParams.get("thread");
      const requestedAgent = searchParams.get("agent");
      const requestedView = searchParams.get("view");
      const selected = demoThreads.find((thread) => thread.id === requestedThread)
        ?? demoThreads.find((thread) => demoAgents.find((agent) => agent.id === thread.agentId)?.slug === requestedAgent)
        ?? demoThreads[1];
      setActiveThread(selected);
      const selectedAgent = demoAgents.find((agent) => agent.id === selected.agentId);
      setView(requestedView === "build" && selectedAgent?.surfaces.includes(requestedView) ? requestedView : "chat");
    });
  }, [searchParams]);

  React.useEffect(() => {
    if (!activeThread) return;
    if (demoMode) { setMessages(activeThread.agentId === "demo-atelier" ? demoMessages : []); setRuns(activeThread.agentId === "demo-atelier" ? [demoRun] : []); return; }
    void Promise.all([listMessages(activeThread.id), listRuns(activeThread.id)]).then(([nextMessages, nextRuns]) => {
      setMessages(nextMessages); setRuns(nextRuns);
    }).catch(() => { setMessages([]); setRuns([]); });
  }, [activeThread?.id, demoMode]);

  const agent = agents.find((item) => item.id === activeThread?.agentId);
  const run = runs[0] ?? null;
  const brand = brands.find((item) => item.isActive) ?? brands.find((item) => item.id === activeThread?.brandId);
  const isLibrary = pathname !== "/";
  const setRailOpen = () => { const next = !rail; setRail(next); localStorage.setItem("marco:rail-collapsed", String(next)); };
  const setWorkOpen = () => { const next = !work; setWork(next); localStorage.setItem("marco:work-open", String(next)); };
  const chooseThread = (thread: Thread) => { setActiveThread(thread); setDrawer(false); router.push(`/?thread=${encodeURIComponent(thread.id)}`); };
  const chooseView = (next: "chat" | "build") => { if (agent?.surfaces.includes(next) && activeThread) { setView(next); router.replace(`/?thread=${encodeURIComponent(activeThread.id)}&view=${next}`); } };
  async function chooseBrand(nextBrand: Brand) {
    setBrandMenu(false);
    if (demoMode) {
      setBrands((current) => current.map((item) => ({ ...item, isActive: item.id === nextBrand.id })));
      return;
    }
    try {
      const saved = await setActiveBrand(nextBrand.id);
      setBrands((current) => current.map((item) => ({ ...item, isActive: item.id === saved.id })));
    } catch {
      // The current context remains selected if the database cannot be reached.
    }
  }
  async function submit() {
    if (demoMode || !draft.trim() || !activeThread || !agent) return;
    const turn = await createRuntimeTurn({ threadId: activeThread.id, agentId: agent.id, brandId: brand?.id, request: draft.trim() });
    setMessages((old) => [...old, turn.message]); setRuns((old) => [turn.run, ...old]); setDraft("");
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

  return <div className={cn("marco-shell", rail && "is-mini", !work && "no-work", drawer && "has-drawer", sheet && "has-sheet")}>
    <div className="marco-scrim" onClick={() => setDrawer(false)} />
    <aside className="marco-icon-rail" aria-label="Primary navigation">
      <Link href="/" className="marco-mark" aria-label="MARCO home"><img src="/agent-mark.png" alt="" /></Link>
      <nav>{UTILITY_NAV.map(([label, href, Icon]) => <Link key={href} href={href} className={pathname === href ? "is-active" : ""} aria-label={label} title={label}><Icon size={17} strokeWidth={1.8} /></Link>)}</nav>
      <div><button className="marco-utility-toggle" onClick={setRailOpen} aria-label={rail ? "Expand thread list" : "Collapse thread list"}>{rail ? <Menu size={16} /> : <X size={16} />}</button><Link href="/settings" aria-label="Settings" title="Settings"><Settings size={17} strokeWidth={1.8} /></Link></div>
    </aside>
    <aside className="marco-rail">
      <div className="marco-brand">
        <Link href="/" className="marco-mark"><img src="/agent-mark.png" alt="MARCO" /></Link>
        <div className="marco-brand-copy"><h1>MARCO</h1><p>Command Center</p></div>
        <button className="marco-rail-toggle" onClick={setRailOpen} aria-label="Collapse thread rail">{rail ? <Menu size={13} /> : <X size={13} />}</button>
      </div>
      <div className="marco-context-wrap"><button className="marco-context" onClick={() => setBrandMenu((open) => !open)} aria-expanded={brandMenu}><span><small>Brand context</small><b>{brand?.name ?? "No active brand"}</b></span><i>⌄</i></button>{brandMenu && <div className="marco-brand-menu">{brands.map((item) => <button key={item.id} className={item.id === brand?.id ? "is-active" : ""} onClick={() => void chooseBrand(item)}>{item.name}<small>{item.kind}</small></button>)}</div>}</div>
      <div className="marco-rail-scroll">
        <div className="marco-section-title"><span>Threads {demoMode && <em>Demo</em>}</span><Link href="/new-agent" aria-label="New agent"><Plus size={15} /></Link></div>
        <div>{threads.map((thread) => {
          const rowAgent = agents.find((item) => item.id === thread.agentId); if (!rowAgent) return null;
          return <button key={thread.id} className={cn("marco-thread", activeThread?.id === thread.id && "is-active")} onClick={() => chooseThread(thread)}>
            <AgentAvatar color={rowAgent.avatarColor} name={rowAgent.name} size="sm" />
            <span className="marco-thread-copy"><span><b>{rowAgent.name}</b><time>{relativeTime(thread.updatedAt)}</time></span><small>{thread.lastMessagePreview ?? rowAgent.tagline ?? "New thread"}</small></span>
            {thread.unread && <i className="marco-unread" />}
          </button>;
        })}</div>
        <div className="marco-section-title marco-library-title"><span>Library</span></div>
        {LIBRARY.map(([label, href, icon]) => <Link key={href} href={href} className="marco-nav-item" onClick={() => setDrawer(false)}><i>{icon}</i><span>{label}</span>{label === "Automations" && <em>1</em>}</Link>)}
      </div>
    </aside>
    <main className="marco-main">
      <header className="marco-topbar">
        <button className="marco-mobile-menu" onClick={() => setDrawer(true)} aria-label="Open threads"><Menu size={16} /></button>
        <div className="marco-title">{agent ? <AgentAvatar color={agent.avatarColor} name={agent.name} /> : <span className="marco-title-empty" />}<h2>{agent?.name ?? "MARCO"}</h2><p>{agent?.tagline ?? (isLibrary ? "Command Center" : "")}</p></div>
        {!isLibrary && agent && <div className="marco-views">{agent.surfaces.map((surface) => <button key={surface} className={view === surface ? "is-active" : ""} onClick={() => chooseView(surface)}>{surface}</button>)}</div>}
        <Link href="/settings" className="marco-icon-button" aria-label="Agent settings"><Settings size={15} /></Link>
        {!isLibrary && <button className={cn("marco-icon-button marco-panel-toggle", work && "is-active")} onClick={() => innerWidth < 900 ? setSheet(true) : setWorkOpen()} aria-label="Toggle work panel">{work ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}</button>}
      </header>
      <section className="marco-stage">
        {isLibrary ? <div className="marco-page-pad">{children}</div> : view === "chat" ? <ChatView messages={messages} agentColor={agent?.avatarColor} /> : <BuildView run={run} onCreate={async () => { if (!activeThread || !agent || demoMode) return; const turn = await createRuntimeTurn({ agentId: agent.id, threadId: activeThread.id, brandId: brand?.id, request: "Create a new Run from the current thread context.", title: "New generation Run" }); setMessages((current) => [...current, turn.message]); setRuns((current) => [turn.run, ...current]); }} />}
      </section>
      {!isLibrary && <form className="marco-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}><div><input disabled={demoMode || enhancing} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={demoMode ? "Demo preview: connect Supabase to send" : `Message ${agent?.name ?? "MARCO"}`} /><span>Attach</span><span>Bundle</span><button className="marco-enhance" type="button" disabled={demoMode || enhancing || !draft.trim()} onClick={() => void enhanceDraft()}><Sparkles size={14} />{enhancing ? "Enhancing…" : "Enhance"}</button><button disabled={demoMode || enhancing || !draft.trim()}>Send</button></div>{enhanceError && <p className="marco-composer-error" role="alert">{enhanceError}</p>}</form>}
    </main>
    {!isLibrary && <aside className="marco-work">
      <header><b>{run ? `Run ${run.shortId}` : "Thread context"}</b><span className={run?.status === "needs_approval" ? "needs-approval" : ""}>{run?.status ?? "Idle"}</span><button onClick={() => innerWidth < 900 ? setSheet(false) : setWorkOpen()} aria-label="Close work panel"><X size={14} /></button></header>
      <WorkView run={run} agent={agent} brand={brand} />
    </aside>}
    <nav className="marco-tabbar"><button onClick={() => setDrawer(true)}>☰<span>Threads</span></button><button onClick={() => setSheet(true)}>●<span>Work</span></button><Link href="/knowledge">□<span>Library</span></Link></nav>
  </div>;
}

function ChatView({ messages, agentColor }: { messages: ThreadMessage[]; agentColor?: string }) { return <div className="marco-chat">{messages.length ? messages.map((message) => <MessageCard key={message.id} message={message} agentColor={agentColor} />) : <p className="marco-empty">No messages yet. Start the thread with a concrete brief.</p>}</div>; }
function BuildView({ run, onCreate }: { run: Run | null; onCreate: () => Promise<void> }) {
  const [aspect, setAspect] = React.useState("9:16"); const [variations, setVariations] = React.useState(2); const [selectedRole, setSelectedRole] = React.useState("character");
  const manifestCount = run?.assetManifest.length ?? 0; const buckets = ["character", "style", "location", "product", "audio", "document"];
  return <div className="marco-build"><BuildBlock n="1" title="Prompt"><p>{run?.title ?? "Describe the work in Chat, then shape its Run here."}</p><div className="marco-rolebar"><span>Rewrite with Voice</span><span>Load from Run</span></div></BuildBlock><BuildBlock n="2" title={`Asset manifest. ${manifestCount} items`}><div className="marco-manifest-buckets">{buckets.map((label, index) => <button type="button" key={label} className={selectedRole === label ? "is-selected" : ""} onClick={() => setSelectedRole(label)}><b>{manifestCount ? Math.max(1, Math.ceil(manifestCount / (index + 2))) : 0}</b><small>{label}</small></button>)}<button type="button" className="is-add">+ add</button></div><div className="marco-rolebar"><span>Role: <b>{selectedRole}</b></span><span>Bundle preview</span><span>Save bundle when connected</span></div></BuildBlock><BuildBlock n="3" title="Model and output"><div className="marco-model-grid"><label>Model <b>Provider pending</b><small>Select models in Settings when connected</small></label><label>Duration <b>Provider controlled</b><small>Available after model selection</small></label><label>Variations <select value={variations} onChange={(event) => setVariations(Number(event.target.value))}>{[1,2,3,4].map((item) => <option key={item}>{item}</option>)}</select><small>Planned outputs</small></label></div><div className="marco-aspect"><span>Aspect ratio</span><div>{["1:1","4:5","9:16","16:9","21:9"].map((item) => <button type="button" key={item} className={aspect === item ? "is-selected" : ""} onClick={() => setAspect(item)}>{item}</button>)}</div></div></BuildBlock><div className="marco-runbar"><span>Provider cost <b>{run?.cost == null ? "Not available" : `$${run.cost.toFixed(2)}`}</b><small>Create a Run before provider execution.</small></span><button type="button" onClick={() => void onCreate()}>Create Run</button></div></div>;
}
function BuildBlock({ n, title, children }: { n: string; title: string; children: React.ReactNode }) { return <section className="marco-build-block"><h3><i>{n}</i>{title}</h3><div>{children}</div></section>; }
function WorkView({ run, agent, brand }: { run: Run | null; agent?: MarcoAgent; brand?: Brand }) { if (!run) return <div className="marco-work-body"><section className="marco-run-meta"><p><span>Agent</span><b>{agent?.name ?? "MARCO"}</b></p><p><span>Brand</span><b>{brand?.name ?? "None selected"}</b></p><p><span>Open runs</span><b>0</b></p></section><small className="marco-note">The right panel collapses when there is nothing to look at.</small></div>; const context = run.inputs.runtime_context; return <div className="marco-work-body"><div className="marco-work-thumbs"><i>dir_01</i><i>dir_02</i><i>dir_03</i><i>dir_03b</i></div><section className="marco-run-meta"><p><span>Status</span><b className="is-red">{run.status}</b></p><p><span>Assets in</span><b>{run.assetManifest.length}</b></p><p><span>Outputs</span><b>{run.outputs.length}</b></p><p><span>Cost so far</span><b>{run.cost == null ? "Unknown" : `$${run.cost.toFixed(2)}`}</b></p></section>{Boolean(context) && <details className="marco-context-inspector"><summary>Show context</summary><pre>{JSON.stringify(context, null, 2)}</pre></details>}<RunSteps steps={run.steps} /><small className="marco-note">This is the same Run shown in Chat and Build.</small></div>; }
function relativeTime(value: string) { const age = Date.now() - new Date(value).getTime(); if (age < 60_000) return "now"; if (age < 3_600_000) return `${Math.floor(age / 60_000)}m`; if (age < 86_400_000) return `${Math.floor(age / 3_600_000)}h`; return `${Math.floor(age / 86_400_000)}d`; }
