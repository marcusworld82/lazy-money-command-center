"use client";

import * as React from "react";
import { getSpendSummary, type SpendRange } from "@/lib/actions/spend";

type Summary = Awaited<ReturnType<typeof getSpendSummary>>;
const RANGES: { label: string; value: SpendRange }[] = [{ label: "Today", value: "today" }, { label: "7 days", value: "7" }, { label: "30 days", value: "30" }, { label: "All time", value: "all" }];
const money = (value: number) => `$${value.toFixed(2)}`;

export default function SpendUsagePage() {
  const [range, setRange] = React.useState<SpendRange>("30");
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { void getSpendSummary(range).then((next) => { setSummary(next); setError(null); }).catch((failure) => setError(failure instanceof Error ? failure.message : "Spend could not load.")); }, [range]);
  const cap = summary?.budget.monthly_cap ?? null;
  const percent = cap && summary ? Math.min(100, (summary.total / cap) * 100) : 0;
  return <div className="marco-library marco-spend">
    <header className="marco-library-header"><h1>Spend</h1><p>Provider-reported cost only. Unknown means the provider did not return one.</p><div className="marco-spend-filter">{RANGES.map((item) => <button key={item.value} className={range === item.value ? "is-active" : ""} onClick={() => setRange(item.value)}>{item.label}</button>)}</div></header>
    {error ? <section className="marco-library-card"><header><b>SPEND UNAVAILABLE</b></header><div>{error}</div></section> : <>
      <section className="marco-library-card marco-cap"><header><b>MONTHLY CAP</b><em>{cap ? `${Math.round(percent)}% used` : "No cap set"}</em></header><div><b>{cap ? `${money(summary?.total ?? 0)} of ${money(cap)}` : "No monthly budget configured"}</b><span><i style={{ width: `${percent}%` }} /></span><small>{summary?.budget.hard_stop ? "Hard stop is on: new Runs block at the cap." : "Hard stop is off."}</small></div></section>
      <section className="marco-spend-hero"><div><small>Selected range</small><b>{money(summary?.total ?? 0)}</b></div><div><small>OpenRouter</small><b>{money(summary?.byProvider.openrouter ?? 0)}</b></div><div><small>fal</small><b>{money(summary?.byProvider.fal ?? 0)}</b></div></section>
      <section className="marco-spend-columns"><SpendList title="Spend by agent" rows={summary?.byAgent.map((item) => ({ name: item.name, cost: item.cost })) ?? []} /><SpendList title="Spend by model" rows={summary?.byModel ?? []} /></section>
      <section className="marco-library-card"><header><b>RECENT RUNS</b></header><div className="marco-spend-table"><span>Run</span><span>Model</span><span>Provider</span><span>Cost</span>{(summary?.recent ?? []).map((row, index) => { const linkedRun = row.runs as unknown as { short_id?: string } | { short_id?: string }[] | null; const shortId = Array.isArray(linkedRun) ? linkedRun[0]?.short_id : linkedRun?.short_id; return <React.Fragment key={`${row.run_id}-${index}`}><b>{shortId ?? "—"}</b><span>{row.model_name ?? "Unknown"}</span><span>{row.provider}</span><b>{row.cost == null ? "Unknown" : money(Number(row.cost))}</b></React.Fragment>; })}</div></section>
    </>}
  </div>;
}

function SpendList({ title, rows }: { title: string; rows: { name: string; cost: number }[] }) {
  const max = Math.max(...rows.map((row) => row.cost), 1);
  return <section className="marco-library-card"><header><b>{title}</b></header><div className="marco-spend-list">{rows.length ? rows.map((row) => <div key={row.name}><span><b>{row.name}</b><small>{money(row.cost)}</small></span><i><em style={{ width: `${(row.cost / max) * 100}%` }} /></i></div>) : <p>No provider-reported spend in this range.</p>}</div></section>;
}
