"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { listMemoryFacts } from "@/lib/actions/memory";
import type { MemoryFact } from "@/lib/marco-types";

type ScopeFilter = "all" | MemoryFact["scope"];

const scopeLabel: Record<MemoryFact["scope"], string> = { agent: "Agent", brand: "Brand", global: "Global" };
const tierLabel: Record<MemoryFact["tier"], string> = { profile: "Profile", log: "History", note: "Note" };

export default function MemoryPage() {
  const [facts, setFacts] = React.useState<MemoryFact[]>([]);
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<ScopeFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    void listMemoryFacts().then(setFacts).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const visibleFacts = facts.filter((fact) => (scope === "all" || fact.scope === scope) && fact.text.toLowerCase().includes(query.toLowerCase()));
  const scopeCounts = (value: ScopeFilter) => facts.filter((fact) => value === "all" || fact.scope === value).length;

  return <div className="marco-memory">
    <header className="marco-memory-header"><div><p>Runtime recall</p><h1>Memory overview</h1><span>Saved facts that can inform future MARCO work.</span></div><dl><div><b>{facts.length}</b><small>Facts</small></div><div><b>{facts.filter((fact) => fact.scope === "agent").length}</b><small>Agent</small></div><div><b>{facts.filter((fact) => fact.scope === "brand").length}</b><small>Brand</small></div></dl></header>
    <div className="marco-memory-layout">
      <aside className="marco-memory-sidebar"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search memory" /></label><div className="marco-memory-filters">{(["all", "agent", "brand", "global"] as ScopeFilter[]).map((item) => <button key={item} className={scope === item ? "is-active" : ""} onClick={() => setScope(item)}>{item === "all" ? "All memory" : scopeLabel[item]}<b>{scopeCounts(item)}</b></button>)}</div><p>Memory is written by approved runtime learning, not by this view.</p></aside>
      <section className="marco-memory-map" aria-label="Memory connections"><div className="marco-memory-map-head"><span>Connected memory</span><small>{visibleFacts.length} active fact{visibleFacts.length === 1 ? "" : "s"}</small></div>{loading ? <p className="marco-memory-empty">Loading saved memory…</p> : error ? <p className="marco-memory-empty">Memory could not be loaded. Check the server connection and try again.</p> : visibleFacts.length ? <div className="marco-memory-nodes">{visibleFacts.slice(0, 12).map((fact, index) => <article key={fact.id} className={`scope-${fact.scope}`} style={{ "--node": index } as React.CSSProperties}><i /><small>{scopeLabel[fact.scope]} · {tierLabel[fact.tier]}</small><b>{fact.text}</b></article>)}</div> : <p className="marco-memory-empty">No saved memory matches this view. Facts will appear here after MARCO proposes learning and you approve it.</p>}</section>
      <aside className="marco-memory-highlights"><header><b>Memory details</b><span>{visibleFacts.length} shown</span></header><div>{visibleFacts.slice(0, 8).map((fact) => <article key={fact.id}><small>{scopeLabel[fact.scope]} · {tierLabel[fact.tier]}</small><p>{fact.text}</p><time>Learned {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(fact.learnedAt))}</time></article>)}{!loading && !visibleFacts.length && <p className="marco-memory-side-empty">No facts to display.</p>}</div></aside>
    </div>
  </div>;
}
