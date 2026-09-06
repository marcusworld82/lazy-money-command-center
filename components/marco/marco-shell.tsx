"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, BrainCircuit, CalendarDays, Folder, Image as ImageIcon, Menu,
  MessageCircle, Settings, Sparkles, Video, Wallet, Users, X, Zap,
} from "lucide-react";
import { AgentAvatar } from "@/components/marco/agent-avatar";
import { MessageCard } from "@/components/marco/run-cards";
import { StudioSurface } from "@/components/marco/studio-surface";
import { cn } from "@/lib/utils";
import type { Brand, MarcoAgent, Thread, ThreadMessage } from "@/lib/marco-types";
import { createRuntimeTurn, listBrands, listMarcoAgents, listMessages, listRuns, listThreads, setActiveBrand } from "@/lib/actions/marco";
import { demoAgents, demoBrands, demoMessages, demoRun, demoThreads } from "@/lib/demo-marco-data";

type Mode = "chat" | "build";

const BUILD_NAV = [
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
  const [enhancing, setEnhancing] = React.useState(false);
  const [enhanceError, setEnhanceError] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [brandMenu, setBrandMenu] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState(false);
  const [groupPicks, setGroupPicks] = React.useState<string[]>([]);
  const [groupTitle, setGroupTitle] = React.useState("");
  const [shareMemory, setShareMemory] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    const buildRoutes = ["/images", "/video", "/knowledge", "/calendar", "/automations", "/assets", "/memory", "/spend-usage", "/settings", "/new-agent", "/projects"];
    if (buildRoutes.some((route) => pathname.startsWith(route))) {
      setMode("build");
      localStorage.setItem("marco:mode", "build");
    }
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
    setDemoMode(useDemo);
    setAgents(sourceAgents);
    setBrands(sourceBrands);
    setThreads(sourceThreads);
    const requestedThread = searchParams.get("thread");
    const requestedAgent = searchParams.get("agent");
    const selected = sourceThreads.find((thread) => thread.id === requestedThread)
      ?? sourceThreads.find((thread) => sourceAgents.find((agent) => agent.id === thread.agentId)?.slug === requestedAgent)
      ?? sourceThreads.find((thread) => thread.kind === "group")
      ?? sourceThreads[0]
      ?? null;
    setActiveThread(selected);
  }

  React.useEffect(() => {
    if (!activeThread) return;
    if (demoMode) {
      setMessages(demoMessages.filter((message) => message.threadId === activeThread.id));
      return;
    }
    void Promise.all([listMessages(activeThread.id), listRuns(activeThread.id)]).then(([nextMessages]) => {
      setMessages(nextMessages);
    }).catch(() => setMessages([]));
  }, [activeThread?.id, demoMode]);

  const agent = agents.find((item) => item.id === activeThread?.agentId);
  const brand = brands.find((item) => item.isActive) ?? brands.find((item) => item.id === activeThread?.brandId);
  const participants = (activeThread?.participantAgentIds ?? (activeThread ? [activeThread.agentId] : []))
    .map((id) => agents.find((item) => item.id === id))
    .filter((item): item is MarcoAgent => Boolean(item));

  function switchMode(next: Mode) {
    setMode(next);
    localStorage.setItem("marco:mode", next);
    setMobileNav(false);
    if (next === "chat") router.push(activeThread ? `/?thread=${encodeURIComponent(activeThread.id)}` : "/");
    else if (pathname === "/") router.push("/images");
  }

  function chooseThread(thread: Thread) {
    setActiveThread(thread);
    setMobileNav(false);
    router.push(`/?thread=${encodeURIComponent(thread.id)}`);
  }

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
      // Keep the current brand if the write fails.
    }
  }

  async function submit() {
    if (demoMode || !draft.trim() || !activeThread || !agent) return;
    const turn = await createRuntimeTurn({ threadId: activeThread.id, agentId: agent.id, brandId: brand?.id, request: draft.trim() });
    setMessages((old) => [...old, turn.message]);
    setDraft("");
  }

  async function enhanceDraft() {
    if (demoMode || !draft.trim() || !agent || enhancing) return;
    setEnhancing(true);
    setEnhanceError(null);
    try {
      const response = await fetch("/api/prompt-enhance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, draft }) });
      const payload = await response.json() as { draft?: string; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error ?? "Could not enhance this prompt.");
      setDraft(payload.draft);
    } catch (error) {
      setEnhanceError(error instanceof Error ? error.message : "Could not enhance this prompt.");
    } finally {
      setEnhancing(false);
    }
  }

  function createGroup(event: React.FormEvent) {
    event.preventDefault();
    if (groupPicks.length < 2) return;
    const picked = agents.filter((item) => groupPicks.includes(item.id));
    const thread: Thread = {
      id: `local-group-${Date.now()}`,
      agentId: groupPicks[0],
      brandId: brand?.id ?? null,
      title: groupTitle.trim() || picked.map((item) => item.name).join(", "),
      kind: "group",
      participantAgentIds: groupPicks,
      sharedMemory: shareMemory,
      lastMessagePreview: shareMemory ? "Shared memory on" : "Private memories stay private",
      unread: false,
      updatedAt: new Date().toISOString(),
    };
    setThreads((current) => [thread, ...current]);
    setActiveThread(thread);
    setMessages([]);
    setGroupOpen(false);
    setGroupPicks([]);
    setGroupTitle("");
    setMode("chat");
    localStorage.setItem("marco:mode", "chat");
    router.push(`/?thread=${encodeURIComponent(thread.id)}`);
  }

  const buildHome = mode === "build" && (pathname === "/" || pathname === "/library" || pathname === "/agents");

  return (
    <div className="zy-root">
      <div className="zy-window">
        <header className="zy-top">
          <Link href="/images" className="zy-logo" onClick={() => { setMode("build"); localStorage.setItem("marco:mode", "build"); }}>
            <span className="marco-mark"><img src="/agent-mark.png" alt="" /></span>
            <b>MARCO</b>
          </Link>
          <div className="zy-mode">
            <button type="button" className={mode === "chat" ? "is-active" : ""} onClick={() => switchMode("chat")}>Chat</button>
            <button type="button" className={mode === "build" ? "is-active" : ""} onClick={() => switchMode("build")}>Build</button>
          </div>
          <div className="zy-top-actions">
            <button type="button" className="zy-brand-chip" onClick={() => setBrandMenu((open) => !open)}>
              {brand?.name ?? "No brand"}
            </button>
            {brandMenu && (
              <div className="zy-brand-menu">
                {brands.map((item) => (
                  <button key={item.id} type="button" className={item.id === brand?.id ? "is-active" : ""} onClick={() => void chooseBrand(item)}>
                    {item.name}<small>{item.kind}</small>
                  </button>
                ))}
              </div>
            )}
            <Link href="/settings" className="zy-icon-btn" aria-label="Settings"><Settings size={16} /></Link>
            <button type="button" className="zy-icon-btn zy-mobile-only" onClick={() => setMobileNav((open) => !open)} aria-label="Menu">
              {mobileNav ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </header>

        {mode === "chat" ? (
          <div className={cn("zy-imessage", mobileNav && "is-open")}>
            <aside className="zy-contacts">
              <div className="zy-contacts-head">
                <h2>Messages</h2>
                <button type="button" onClick={() => setGroupOpen(true)} aria-label="New group"><Users size={15} /></button>
              </div>
              <div className="zy-contact-list">
                {threads.map((thread) => {
                  const rowAgent = agents.find((item) => item.id === thread.agentId);
                  if (!rowAgent) return null;
                  const groupAgents = (thread.participantAgentIds ?? [thread.agentId])
                    .map((id) => agents.find((item) => item.id === id))
                    .filter((item): item is MarcoAgent => Boolean(item));
                  return (
                    <button key={thread.id} type="button" className={cn("zy-contact", activeThread?.id === thread.id && "is-active")} onClick={() => chooseThread(thread)}>
                      {thread.kind === "group" ? (
                        <span className="zy-stack">
                          {groupAgents.slice(0, 3).map((item) => <AgentAvatar key={item.id} color={item.avatarColor} name={item.name} size="sm" />)}
                        </span>
                      ) : (
                        <AgentAvatar color={rowAgent.avatarColor} name={rowAgent.name} />
                      )}
                      <span>
                        <b>{thread.kind === "group" ? thread.title : rowAgent.name}</b>
                        <small>{thread.lastMessagePreview ?? rowAgent.tagline ?? "New thread"}</small>
                      </span>
                      <time>{relativeTime(thread.updatedAt)}</time>
                      {thread.unread && <i />}
                    </button>
                  );
                })}
              </div>
            </aside>
            <section className="zy-thread">
              <header>
                {participants.length ? participants.slice(0, 3).map((item) => <AgentAvatar key={item.id} color={item.avatarColor} name={item.name} />) : <span className="marco-title-empty" />}
                <div>
                  <h2>{activeThread?.kind === "group" ? activeThread.title : agent?.name ?? "MARCO"}</h2>
                  <p>
                    {activeThread?.kind === "group"
                      ? `${participants.map((item) => item.name).join(" · ")}${activeThread.sharedMemory ? " · shared memory on" : " · private memory"}`
                      : agent?.tagline ?? "Start a thread"}
                  </p>
                </div>
              </header>
              <div className="zy-feed">
                {messages.length ? messages.map((message) => {
                  const speaker = agents.find((item) => item.id === message.agentId);
                  return (
                    <div key={message.id} className={cn("zy-bubble-wrap", message.role === "user" && "is-me")}>
                      {message.role !== "user" && speaker && <AgentAvatar color={speaker.avatarColor} name={speaker.name} size="sm" />}
                      <div>
                        {message.role !== "user" && speaker && <em>{speaker.name}</em>}
                        <MessageCard message={message} agentColor={speaker?.avatarColor ?? agent?.avatarColor} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="zy-empty-chat">
                    <b>No messages yet</b>
                    <p>This is the iMessage view. Pick an agent or a group and send a brief.</p>
                  </div>
                )}
              </div>
              <form className="zy-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                <input
                  disabled={demoMode || enhancing}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={demoMode ? "Demo preview — connect Supabase to send" : `Message ${activeThread?.kind === "group" ? activeThread.title : agent?.name ?? "MARCO"}`}
                />
                <button className="marco-enhance" type="button" disabled={demoMode || enhancing || !draft.trim()} onClick={() => void enhanceDraft()}>
                  <Sparkles size={14} />{enhancing ? "Enhancing…" : "Enhance"}
                </button>
                <button type="submit" disabled={demoMode || enhancing || !draft.trim()}>Send</button>
                {enhanceError && <p role="alert">{enhanceError}</p>}
              </form>
            </section>
          </div>
        ) : (
          <div className={cn("zy-build", mobileNav && "is-open")}>
            <aside className="zy-build-rail">
              <div className="zy-rail-block">
                <small>Agents</small>
                {agents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn("zy-rail-agent", agent?.id === item.id && "is-active")}
                    onClick={() => {
                      const thread = threads.find((row) => row.agentId === item.id && row.kind !== "group") ?? threads.find((row) => row.agentId === item.id);
                      if (thread) chooseThread(thread);
                      switchMode("chat");
                    }}
                  >
                    <AgentAvatar color={item.avatarColor} name={item.name} size="sm" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <div className="zy-rail-block">
                <small>Features</small>
                {BUILD_NAV.map(([label, href, Icon]) => (
                  <Link key={href} href={href} className={pathname === href ? "is-active" : ""} onClick={() => setMobileNav(false)}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </aside>
            <main className="zy-build-main">
              {pathname === "/images" ? <StudioSurface kind="image" /> : pathname === "/video" ? <StudioSurface kind="video" /> : buildHome ? (
                <BuildHome
                  onChat={() => switchMode("chat")}
                  onImage={() => router.push("/images")}
                  onVideo={() => router.push("/video")}
                  draft={draft}
                  setDraft={setDraft}
                  onSubmit={() => { switchMode("chat"); }}
                />
              ) : (
                <div className="zy-page">{children}</div>
              )}
            </main>
          </div>
        )}
      </div>

      {groupOpen && (
        <div className="zy-modal-scrim" onClick={() => setGroupOpen(false)}>
          <form className="zy-modal" onClick={(event) => event.stopPropagation()} onSubmit={createGroup}>
            <header>
              <h3>New agent group</h3>
              <p>Agents in this room work the same job. They share the brief and the thread — not each other’s private Obsidian memory or skills.</p>
            </header>
            <label>
              Group name
              <input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="Fall drop room" />
            </label>
            <div className="zy-group-picks">
              {agents.map((item) => {
                const on = groupPicks.includes(item.id);
                return (
                  <button key={item.id} type="button" className={on ? "is-on" : ""} onClick={() => setGroupPicks((current) => on ? current.filter((id) => id !== item.id) : [...current, item.id])}>
                    <AgentAvatar color={item.avatarColor} name={item.name} size="sm" />
                    {item.name}
                  </button>
                );
              })}
            </div>
            <label className="zy-check">
              <input type="checkbox" checked={shareMemory} onChange={(event) => setShareMemory(event.target.checked)} />
              Share the room packet only (never private memory or skills)
            </label>
            <footer>
              <button type="button" onClick={() => setGroupOpen(false)}>Cancel</button>
              <button type="submit" disabled={groupPicks.length < 2}>Create group</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}

function BuildHome({
  onChat, onImage, onVideo, draft, setDraft, onSubmit,
}: {
  onChat: () => void;
  onImage: () => void;
  onVideo: () => void;
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="zy-home">
      <div className="zy-orb" aria-hidden />
      <h1>Ready to Create Something New?</h1>
      <div className="zy-home-actions">
        <button type="button" onClick={onImage}><ImageIcon size={14} /> Create Image</button>
        <button type="button" onClick={onVideo}><Video size={14} /> Create Video</button>
        <button type="button" onClick={onChat}><MessageCircle size={14} /> Open Chat</button>
      </div>
      <form className="zy-home-ask" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <Sparkles size={16} />
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Anything…" />
        <button type="submit" aria-label="Send">↑</button>
      </form>
      <div className="zy-home-cards">
        <button type="button" onClick={onImage}><b>Image Generator</b><span>Studio layout for stills. No fake outputs.</span></button>
        <button type="button" onClick={onVideo}><b>Video Generator</b><span>Kling / Seedance controls. Cost stays unknown until fal answers.</span></button>
        <button type="button" onClick={onChat}><b>Agent Chat</b><span>iMessage view for one-to-one and group threads.</span></button>
      </div>
    </div>
  );
}

function relativeTime(value: string) {
  const age = Date.now() - new Date(value).getTime();
  if (age < 60_000) return "now";
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m`;
  if (age < 86_400_000) return `${Math.floor(age / 3_600_000)}h`;
  return `${Math.floor(age / 86_400_000)}d`;
}
