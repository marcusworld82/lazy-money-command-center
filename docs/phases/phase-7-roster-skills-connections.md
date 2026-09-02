# Phase 7 — Roster, Skills, and Connections
## MARCO Command Center

> Phase 6 must be complete with two agents coordinating correctly. This phase fills out the roster, builds the skill system, wires MCP servers and CLI runners, and stands up the planner plus executor pair for code.

---

## Goal

The full working team, each agent with its own knowledge, skills, models, and permissions, plus the ability to give any of them new capability by installing a skill or connecting a tool.

---

## Part A — The Roster

Six agents seeded in Phase 4.6 now become functional. The names below are placeholders. **Every name, tagline, color, instruction set, model, and surface list is editable from Settings at any time, including after the agent has run.** Renaming must never break a thread, a run, a cost record, or a handoff, which is why everything keys on `agent_id`.

Split by craft, not by topic. The test: split when the model, the knowledge, or the way you judge the output differs. Do not split just because the subject changed.

| Placeholder | Owns | Hands off to | Surfaces |
|---|---|---|---|
| Chief | Routing, status synthesis, one answer instead of six threads. Produces no work of its own | all | chat |
| Atelier | Apparel design and product. Both clothing lines. Fabric, fit blocks, construction, trim | Voice, Studio | chat, build |
| Voice | Every word that ships. Captions, reel scripts, storefront copy, client site copy, email | none | chat, build |
| Studio | Image and video generation. Owns the manifest and the render models | none | chat, build |
| Social | Scheduling, platform adaptation, automations | Voice, Studio | chat, build |
| Builder | Code. Planner plus executor pair | none | chat, build |

Surfaces are `chat` and `build` only. Canvas was removed as a Run view in Phase 6.5 — Studio's generation controls (aspect ratio, reference tiles, model picks) live inside Build, not a separate pane.

**Why Voice is separate.** One owner for wording, or the brand voice drifts into six versions. Atelier knows stitching. It should not also be the keeper of the register.

**Why brand data is not owned by an agent.** Colors, voice rules, audience, and restrictions live in the `brands` table. Every agent reads the active record. Switching the brand switcher changes what all of them read. If brand data lived inside agents you would be updating your palette in six places.

### Chief

Chief is a synthesizer, not a producer. Given a vague question it queries the other agents' state and returns one answer covering what is complete, what is blocked, what changed, and what needs a decision. Views to support:

- Executive summary
- Per agent status
- Decision queue, what is waiting on you
- Risk report, conflicts and missing inputs
- Change impact, if you change X which artifacts go stale
- Usage report, which agents spent the most

### Change impact

When a brand rule or a locked decision changes, do not blindly rewrite everything downstream. Produce an impact report first: how many approved artifacts, pending runs, and rules are affected. Then ask whether to propagate selectively.

---

## Part B — The Builder Pair

Not two peer agents arguing. One lane with a contract.

1. You give Builder a request.
2. **Claude Code plans.** Files to touch, interfaces, acceptance tests. No implementation code.
3. The plan lands in the thread as an approval card. You approve or steer. **This gate cannot be disabled.**
4. **Codex executes** against the approved plan. Branch and PR only.
5. Claude Code reviews the diff against its own acceptance tests. Pass, or send a priority packet back to Codex naming the specific failure.
6. Cap at two rounds. The third failure escalates to you with what is stuck.

Rules:
- Codex never merges. Merge stays yours.
- The handoff between planner and executor is a typed packet, same as any other handoff.
- Both halves log cost separately so you can see which one is expensive.
- Model selection for the pair is configurable per agent like everything else.

```sql
create table build_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id),
  repo text not null,
  branch text,
  pr_url text,
  plan jsonb,
  plan_approved_at timestamptz,
  review_rounds integer default 0,
  status text default 'planning',   -- planning | awaiting_approval | executing | reviewing | escalated | done | failed
  created_at timestamptz default now()
);
```

---

## Part C — Skills

A skill is reusable instruction plus optional helper files, attachable to specific agents.

### Schema

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  source text not null,             -- claude_code | perplexity | markdown | built_here | zip
  source_path text,
  instruction text not null,        -- the SKILL.md body
  triggers text[],
  files jsonb default '[]',         -- stored helper files, never executed at import
  status text default 'draft',      -- draft | installed | disabled
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table agent_skills (
  agent_id uuid references agents(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  enabled boolean default true,
  primary key (agent_id, skill_id)
);
```

### Accepted formats

- `SKILL.md` on its own
- A Claude Code skill folder, including helper scripts and reference files
- A Perplexity export
- Plain markdown
- A zip containing any of the above

### Import pipeline

Follow this exactly. It is a safety boundary.

1. Detect the manifest or instruction entry point.
2. Copy only the declared files. Do not sweep an entire directory.
3. Record the source ecosystem and the original path.
4. Normalize the name and description.
5. **Preserve helper scripts. Never execute them during import.** No install hooks, no setup scripts, no post-import commands.
6. Ask which agents may enable the skill.
7. When the skill actually fires during a run, its scripts execute inside the agent sandbox under normal permissions, subject to the `use_cli` permission and the per run budget cap.

Do not assume every ecosystem's skill format is identical. Write a separate parser per source and fail loudly on an unrecognized shape rather than guessing.

### Three ways a skill arrives

1. **Upload.** Drop a file or folder. The pipeline above runs.
2. **Save from a thread.** Any thread has a Save as skill action. It reads the conversation, drafts a skill, and lands it as `draft`.
3. **Build from scratch.** The skill builder panel, below.

### Skill builder

A chat panel on the Knowledge, Skills tab with its own model picker. You describe what the skill should do, it drafts the `SKILL.md`, shows it as a review card with format, triggers, what it reads, and which agent gets it. Nothing installs until you press Install.

### Skill retrieval

Skills are not all injected into every prompt. Match on triggers plus relevance, budget the same way memory is budgeted, and log which skills were active for a turn so a bad output can be traced.

---

## Part D — Knowledge Tabs

Rebuild `app/knowledge/page.tsx` with four tabs.

- **Library.** Agent instructions, playbooks, design DNA, reference vault, SOPs, templates. Markdown CRUD as built in Phase 4.
- **Skills.** Installed list with source badge, per agent enablement, and toggles. Plus the skill builder panel.
- **Brand records.** List and edit the `brands` table.
- **Learning proposals.** The pending queue from Phase 6, with approve and reject.

---

## Part E — MCP Servers

```sql
create table mcp_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  transport text default 'http',
  auth_ref text,                    -- reference to a secret, never the secret itself
  status text default 'disconnected',
  tools jsonb default '[]',         -- discovered tool list
  enabled boolean default false,
  created_at timestamptz default now()
);

create table agent_mcp_grants (
  agent_id uuid references agents(id) on delete cascade,
  server_id uuid references mcp_servers(id) on delete cascade,
  can_read boolean default true,
  can_write boolean default false,
  primary key (agent_id, server_id)
);
```

Rules:
- Grants are per agent, never global. Studio having Higgsfield does not mean Voice does.
- Reads may be `always`. Writes default to `ask`.
- Discover the tool list on connect and store it. Show the person exactly which tools a server exposes before granting it.
- Every MCP call writes an audit row.

Servers to support first: Notion, Shopify, Supabase, Higgsfield, Figma, Apify.

---

## Part F — CLI Runners

```sql
create table cli_runners (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- claude_code | codex | github | vercel
  kind text not null,
  config jsonb,
  status text default 'disconnected',
  enabled boolean default false,
  created_at timestamptz default now()
);
```

- Runners execute inside the worker's sandbox, never on your machine.
- Only agents explicitly granted `use_cli` may invoke one. Default is `never` for every agent except Builder.
- Every command is logged with the agent, the run, the exact command, and the exit code.
- Destructive commands are `ask` regardless of the standing mode.

---

## Part G — Settings Sections

Wire the Phase 4.6 UI to real data.

- **Agents.** Full CRUD including rename. Renaming updates every surface immediately.
- **Providers and keys.** Masked, server side only, presence checked.
- **Connections.** MCP servers and CLI runners with per agent grants, plus the audit log viewer.
- **Brand records.** CRUD.
- **Sync.** Obsidian status, last sync, pending inbound changes.
- **Appearance.**

---

## Acceptance Criteria

- [ ] All six agents functional, each with its own instructions, knowledge, skills, models, and permissions
- [ ] Renaming any agent, at any time, breaks nothing. Threads, runs, costs, and handoffs all survive
- [ ] Chief returns a real synthesized status across the other agents
- [ ] A change to a brand rule produces an impact report before anything propagates
- [ ] Builder pair works: plan, your approval, execute, review, cap at two rounds, escalate on the third
- [ ] Codex opens a PR and never merges
- [ ] Skills import from Claude Code folders, Perplexity exports, markdown, and zip
- [ ] Helper scripts are stored at import and never executed until the skill fires in a sandboxed run
- [ ] An unrecognized skill format fails loudly rather than importing something wrong
- [ ] Save as skill from a thread produces a usable draft
- [ ] The skill builder drafts, previews, and installs
- [ ] Skills are matched and budgeted per turn, and the active set is logged
- [ ] MCP grants are per agent, writes default to ask, and every call is audited
- [ ] CLI runners execute only in the worker sandbox, only for granted agents, fully logged
- [ ] Knowledge has all four tabs working on real data

## Deliverable

A real team. Six editable agents with their own capability, extendable by installing skills and connecting tools, all under scoped permissions and full audit.
