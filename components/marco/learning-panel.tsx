"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { listLearningProposals, resolveLearningProposal } from "@/lib/actions/phase7";

type Proposal = { id: string; description: string; kind: string | null; status: string; created_at: string; agents?: { name?: string } | null; runs?: { short_id?: string } | null };

export function LearningPanel() {
  const [items, setItems] = React.useState<Proposal[]>([]), [error, setError] = React.useState<string | null>(null), [busy, setBusy] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => { setItems(await listLearningProposals() as Proposal[]); }, []);
  React.useEffect(() => { void refresh().catch(() => setError("Learning proposals could not be loaded.")); }, [refresh]);
  async function resolve(id: string, status: "approved" | "rejected") { setBusy(id); try { await resolveLearningProposal(id, status); await refresh(); } catch { setError("This proposal could not be updated."); } finally { setBusy(null); } }
  return <section className="marco-phase7-panel"><header><div><small>Human approval required</small><h2>Learning proposals</h2><p>Agents can propose durable knowledge, but this queue is the only path to approving it.</p></div></header>{error && <p className="marco-phase7-error">{error}</p>}<div className="marco-learning-list">{items.length ? items.map((item) => <article key={item.id}><div><b>{item.kind ?? "Proposed learning"}</b><p>{item.description}</p><small>{item.agents?.name ?? "Agent"}{item.runs?.short_id ? ` · ${item.runs.short_id}` : ""}</small></div>{item.status === "pending" ? <div><button disabled={busy === item.id} onClick={() => void resolve(item.id, "approved")}><Check size={14} /> Approve</button><button disabled={busy === item.id} onClick={() => void resolve(item.id, "rejected")}><X size={14} /> Reject</button></div> : <span>{item.status}</span>}</article>) : <div className="marco-phase7-empty"><Check size={18} /><b>No pending proposals</b><p>Approved learning will be visible here with its source Run.</p></div>}</div></section>;
}
