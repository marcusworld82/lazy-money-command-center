# Phase 6 — The Agent Runtime
## MARCO Command Center

> Phases 1 through 5 must be complete. This phase builds the runtime that makes agents real. It is the hardest phase and the one most likely to be built wrong if rushed. Build one agent end to end before adding a second.
>
> We are not using Hermes or any other harness. MARCO owns its own runtime. The architecture below is drawn from the Grok Bot blueprint's six layer model and Agent Two's project context layer, adapted to this codebase.

---

## Goal

An agent can receive a request, load only the context it needs, reason, call tools, hand work to another agent, pause for your approval, and record everything. Restarting the process loses nothing.

## Explicitly Out of Scope

- No full roster. One agent working correctly beats six agents working badly. The roster lands in Phase 7.
- No skills, no MCP, no CLI runners. Phase 7.
- No scheduling, no Telegram. Phase 8.

---

## Part A — Where the Runtime Lives

Vercel serverless functions time out and cannot hold a long agent turn. Split the deployment.

- **Next.js app on Vercel.** Interface only. It never calls a model directly after this phase. It reads and writes Supabase and posts jobs to the worker.
- **Worker process on Railway or Fly.** A single long-lived Node process. Holds the run scheduler, the message queue consumer, and the tool executors. Talks to the same Supabase.
- **Communication.** The app posts to the worker over an authenticated internal endpoint with a shared secret in `MARCO_WORKER_SECRET`. The worker never exposes a public route other than that one and a health check.
- **The worker never gets raw database credentials beyond the service role key it needs.** All writes go through typed repository functions in a shared package so both sides use the same schema logic.

Also on the worker: the Obsidian Git sync job from Phase 4.6 Part G. It now runs for real.

---

## Part B — The Six Services

Build these as separate modules with clear boundaries. Do not let them reach into each other's tables directly.

### 1. Agent registry

Already exists from Phase 4.6. The runtime reads agent rows for identity, instructions, models, surfaces, permissions, and handoff targets. Names are display only. Everything internal keys on `agent_id`.

### 2. Transcript store

One append-only record per agent thread. `messages` from Phase 4.6 is the store.

**Hard rule.** An agent's transcript never enters another agent's prompt by default. Cross agent visibility only happens through an explicit handoff packet.

### 3. Memory service

Three scopes, three tiers.

```sql
create table memory_facts (
  id uuid primary key default gen_random_uuid(),
  scope text not null,                  -- agent | brand | global
  scope_id uuid,                        -- agent_id or brand_id, null for global
  tier text not null,                   -- profile | log | note
  text text not null,
  source_type text,                     -- message | run | document | user
  source_id uuid,
  learned_at timestamptz default now(),
  last_used_at timestamptz,
  active boolean default true
);

create index idx_memory_scope on memory_facts(scope, scope_id, tier);
```

- `profile` tier: enduring facts, always in the prompt.
- `log` tier: substantive history, ranked and budgeted into the prompt.
- `note` tier: on disk, retrieved only on explicit search.

**Budget, do not dump.** Set a token budget for memory per turn. Rank by relevance to the current request plus recency. Anything that does not fit stays on disk and is retrievable by search. Log which facts were retrieved so a turn can be explained afterward.

### 4. Message service

Fire and forget, never blocking.

```sql
create table agent_messages (
  id uuid primary key default gen_random_uuid(),
  from_agent_id uuid references agents(id),
  to_agent_id uuid references agents(id),
  run_id uuid references runs(id),
  packet jsonb not null,
  priority boolean default false,
  status text default 'queued',         -- queued | delivered | consumed | failed
  created_at timestamptz default now(),
  delivered_at timestamptz
);
```

The packet is typed, not prose.

```json
{
  "goal": "Campaign lines for 3 hoodie directions",
  "state": "Designs locked, renders pending",
  "evidence": ["knowledge_doc:uuid", "run:0113"],
  "constraints": ["no hype language", "keep it short"],
  "acceptance": ["2 options per direction"],
  "next_action": "return copy into run 0114",
  "approval_required": false
}
```

Rules:
- Sending returns an acknowledgement immediately. The reply arrives later as a new message. The reply is never the return value.
- The recipient wakes on a later hidden turn. It does not poll.
- Message IDs deduplicate. A delivered message wakes its recipient at most once.
- Bounded packet size. Reject oversize packets rather than truncating.
- No automatic acknowledgement loops. An agent may not reply to a reply with a bare acknowledgement.
- Both sender and recipient get a visible row in their own transcript so you can see the handoff in the UI.

### 5. Run scheduler

Four lanes, strict ordering.

| Lane | Trigger | Interruption rule |
|---|---|---|
| user | You send a message or steer | Highest. Nothing may interrupt it |
| agent | Another agent sends a packet | A priority packet may supersede non-user work |
| automation | A schedule fires | Runs after user and agent |
| background | A tool or job completes | Lowest |

**The user lane is protected.** Internal work may interrupt internal work. Internal work may never interrupt you mid conversation.

Priority is a scheduler decision, not emphasis. Allowed priority reasons only: `stop`, `supersede`, `safety`, `time_critical_failure`. Rate limit priority per sender. Every priority send writes an audit event.

When a run is interrupted, record which run, why, whether partial output is safe to reuse, and whether it should resume, restart, or be abandoned. Never silently resume a superseded run.

```sql
create table runs_lanes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id),
  agent_id uuid references agents(id),
  lane text not null,
  status text not null default 'queued', -- queued | running | paused | done | failed | cancelled
  interrupt_reason text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);
```

### 6. Permission service

The `permissions` jsonb on each agent becomes real enforcement, server side, in the worker. Not documentation, not a UI hint.

- Three standing modes per capability: `always`, `ask`, `never`. Default is `ask`.
- `ask` creates an approval request and pauses the run. It does not proceed optimistically.
- An `allow once` approval is scoped to that agent, that action, that target, and that run. It expires when the run scope completes. Pending asks expire after 10 minutes.
- A denial is remembered for the current run so the agent cannot immediately ask again for the same thing.
- **Repetition never becomes consent.** Approving the same action five times does not create a standing allow. Only you changing the mode to `always` does that.
- `never` is a hard block, not a suggestion.
- Every authorization decision writes an audit row.

```sql
create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id),
  agent_id uuid references agents(id),
  action text not null,                 -- generate | publish | write_knowledge | mcp_write | use_cli
  target text,
  detail jsonb,
  resolution text,                      -- allow_once | deny | always | never | expired
  expires_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  run_id uuid references runs(id),
  action text not null,
  target text,
  decision text,
  detail jsonb,
  created_at timestamptz default now()
);
```

---

## Part C — Context Assembly

Before every turn the worker builds a context envelope. This is the Agent Two layer.

```
context = {
  identity:        agent.instructions + agent.name + agent.tagline,
  brand:           active brand record (colors, voice, audience, restrictions),
  brief:           the current Run's inputs and constraints,
  recent_chat:     tail of this agent's transcript only,
  memory:          budgeted recall across agent, brand, and global scopes,
  manifest:        asset manifest metadata only, never file bytes,
  roster:          which agents this one may hand off to,
  tools:           what permissions allow right now,
  request:         the incoming turn
}
```

The hierarchy matters. Brand rules are global and durable. The brief is local and temporary. The brief may add constraints, it may never silently override a brand restriction.

**Precedence when two things conflict:**

1. Platform safety and legal policy
2. Your explicit instruction in the current turn
3. Brand record approved rules
4. Agent instructions
5. Locked artifact constraints
6. Current brief
7. Unapproved suggestions

If two agents disagree, the system does not silently pick. It surfaces the conflict and asks you.

**Make the envelope inspectable.** A `Show context` action in the work panel renders exactly what was sent for that turn. This is how you debug a bad output without guessing.

---

## Part D — The Turn Loop

```
on_request(request):
  agent = resolve_agent(request)
  enqueue(agent, lane='user', payload=request)

run_turn(agent, payload):
  ctx = build_context(agent, payload)
  result = model.stream(ctx, allowed_tools(agent))
  for event in result:
    if event is tool_call:
      decision = permissions.authorize(agent, event)
      if decision == 'ask': pause_run_and_create_approval(); return
      if decision == 'never': record_block(); continue
      execute(event)
    if event is handoff:
      messages.send(packet)            # returns immediately
    if event is output:
      save_asset(output); append_step(run)
    append_message(agent, event)
  memory.propose(agent, result)        # proposals only, never direct writes
  publish(result)
```

**The model proposes, the host commits.** No state change happens because a model said so. Queues, runs, memory writes, approvals, and costs are all written by the worker after its own checks.

---

## Part E — Learning Proposals

Agents may propose changes to permanent knowledge. They may never write it.

```sql
create table learning_proposals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  run_id uuid references runs(id),
  kind text,                            -- brand_rule | instruction | knowledge_doc | memory_fact
  target_id uuid,
  description text not null,
  proposed_change jsonb not null,
  status text default 'pending',        -- pending | approved | rejected
  created_at timestamptz default now(),
  reviewed_at timestamptz
);
```

Approved proposals write to the target, commit to the Obsidian vault with a clear message, and log. Rejected proposals archive and change nothing.

---

## Part F — Build One Agent First

Do not deploy six agents. Order of work:

1. One agent, one thread, durable transcript, context envelope, real model call, cost logged.
2. Approval pause and resume working correctly.
3. A second agent with a fully isolated transcript.
4. Fire and forget handoff between them, with a durable wake.
5. Restart the worker mid handoff. The message must survive and wake exactly once.
6. Run lanes, then priority interruption with the user lane protected.
7. Scoped memory retrieval with a real budget.
8. Obsidian sync running on the worker.

Each step works before the next one starts.

---

## Part G — Six Invariants

These stay true regardless of what changes later.

1. Your active turn outranks all internal work.
2. A delivered message survives a restart and wakes its recipient at most once.
3. Private transcripts and agent-scoped memory never enter another agent's prompt by default.
4. The model proposes a state change. Only the host commits it.
5. Every external or destructive side effect has an authorization decision and an audit record.
6. Any run can be cancelled without leaving hidden work that later resumes blindly.

---

## Acceptance Criteria

- [ ] Worker deployed separately from Vercel, reachable only via authenticated internal endpoint
- [ ] One agent completes a real turn end to end with cost logged and the context envelope inspectable
- [ ] A second agent has a fully isolated transcript and does not see the first agent's history
- [ ] Agent A can hand off to Agent B without waiting for a reply in the same turn
- [ ] Restarting the worker mid handoff loses nothing and wakes the recipient exactly once
- [ ] A normal packet does not interrupt an active run
- [ ] A priority packet interrupts non-user work and never interrupts the user lane
- [ ] `ask` pauses the run and creates an approval, and the run resumes correctly on approval
- [ ] Approving the same action repeatedly does not create a standing allow
- [ ] `never` is a hard block
- [ ] A denied action is not immediately requested again in the same run
- [ ] Memory retrieval stays inside its declared scope and respects the token budget
- [ ] Every side effect has an audit row
- [ ] Learning proposals require explicit approval before touching Knowledge
- [ ] Obsidian sync runs on the worker, Supabase always wins a conflict
- [ ] Cancelling a run leaves no hidden work that later resumes

## Deliverable

A real runtime you own. Two agents, isolated, coordinating through durable typed handoffs, pausing for your approval, spending inside caps, and recording every decision.
