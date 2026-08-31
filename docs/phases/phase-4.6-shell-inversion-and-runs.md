# Phase 4.6 — Shell Inversion, the Run Object, and Mobile
## MARCO Command Center

> This phase sits between Phase 4 and Phase 5. Phases 1 through 4 are already built and stay. This phase does not add a single model call, database write to a new provider, or agent. It replaces the page-per-feature shell with a thread-first, three pane shell, introduces the Run object that every later phase depends on, and makes the whole app work on a phone.
>
> Reference: `marco-shell-wireframe.html`. That file is the visual and behavioral source of truth for this phase. Where this document and the wireframe disagree, the wireframe wins on layout and the document wins on data.

---

## Rename

The product is now **MARCO**. Not Lazy Money OS, not Command Center alone.

- Repo stays `lazy-money-command-center`. Do not rename the repo.
- Update the `<Logo />` component to the MARCO wordmark plus the sticker-head mark.
- Update `# CLAUDE.md — Lazy Money OS Command Center.md` to `CLAUDE.md`, retitle it MARCO, and correct the color rule. It currently says green `#166E16`, black, white. The real palette is below.
- Update `<title>` and any page metadata.

## Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0F0E0E` | App background |
| `--panel` | `#1A1818` | Panels, rail, cards |
| `--panel-2` | `#211E1E` | Raised surfaces, card headers |
| `--line` | `#2E2A2A` | Borders |
| `--line-2` | `#3A3434` | Hover borders |
| `--red` | `#AD0000` | Primary accent |
| `--red-hi` | `#E01414` | Hover, alert numbers |
| `--pink` | `#FF3D8A` | Secondary accent, one agent color |
| `--txt` | `#F2EFEF` | Primary text |
| `--txt-dim` | `#8B8383` | Secondary text |
| `--txt-mute` | `#5E5757` | Labels, eyebrows |

Dark is default. Light mode stays toggleable but is not a priority in this phase. No hardcoded hex outside the token definitions.

---

## Goal

Stop treating each capability as a destination. Make conversation the app, make every unit of work a Run, and give each Run three interchangeable views.

## Explicitly Out of Scope

- No OpenRouter calls, no fal calls, no real generation. Phase 5.
- No agent runtime, no messaging, no memory. Phase 6.
- No skills intake, no MCP, no CLI. Phase 7.
- No Telegram, no scheduling, no real Meta API. Phase 8.
- No auth changes. Single user, no login, permanently.

Everything in this phase runs on placeholder data or on the Supabase tables that already exist from Phase 3.

---

## Part A — The Run Object

This is the most important thing in the phase. Everything after it depends on this shape.

A Run is one unit of work. It has inputs, a manifest of assets, a plan of ordered steps, outputs, cost, and an approval state. Chat, Build, and Canvas are three renderings of the same Run.

### Schema

```sql
create table runs (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null,          -- '0114', shown in the UI
  agent_id uuid references agents(id),
  brand_id uuid references brands(id),
  thread_id uuid references threads(id),
  title text,
  inputs jsonb not null default '{}',     -- prompt, brief, form field values
  asset_manifest jsonb not null default '[]',
  steps jsonb not null default '[]',
  outputs jsonb not null default '[]',
  status text not null default 'draft',   -- draft | running | needs_approval | completed | failed | cancelled
  approval_state text,                    -- null | pending | approved | rejected
  cost numeric(10,4) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  brand_id uuid references brands(id),
  title text,
  last_message_preview text,
  unread boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete cascade,
  run_id uuid references runs(id),
  role text not null,                     -- user | agent | system
  agent_id uuid references agents(id),    -- which agent spoke, for handoffs shown in one thread
  kind text not null default 'text',      -- text | handoff | approval | manifest | plan | status
  body text,
  payload jsonb,                          -- structured content for non-text kinds
  created_at timestamptz default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  kind text,                              -- own | client
  colors jsonb,
  typography text,
  voice jsonb,                            -- register, words_to_use, words_to_avoid, emoji and hashtag rules
  audience text,
  offers text,
  restrictions text,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### asset_manifest shape

Never store file contents. Store references plus a role.

```json
[
  { "asset_id": "uuid", "role": "character_ref", "order": 1 },
  { "asset_id": "uuid", "role": "style_ref", "order": 2 },
  { "asset_id": "uuid", "role": "location", "order": 3 },
  { "asset_id": "uuid", "role": "product", "order": 4 },
  { "asset_id": "uuid", "role": "audio_bed", "order": 5 },
  { "asset_id": "uuid", "role": "document", "order": 6, "extracted_text_ref": "uuid" }
]
```

Allowed roles: `character_ref`, `style_ref`, `location`, `product`, `audio_bed`, `document`, `reference`. Store the list in `lib/manifest-roles.ts` so Phase 5 and 7 read from one place.

### steps shape

```json
[
  { "n": 1, "label": "Brief read, brand context loaded", "status": "done", "cost": 0 },
  { "n": 2, "label": "3 directions designed", "status": "done", "cost": 0.31 },
  { "n": 3, "label": "Handoff to Voice, copy returned", "status": "done", "cost": 0.09 },
  { "n": 4, "label": "Render", "status": "blocked", "blocked_on": "approval", "cost": 0 },
  { "n": 5, "label": "Stage to Social", "status": "pending", "cost": 0 }
]
```

Step statuses: `pending`, `running`, `done`, `blocked`, `failed`, `skipped`.

### Bundles

A bundle is a saved manifest. Nothing more.

```sql
create table asset_bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_id uuid references brands(id),
  manifest jsonb not null default '[]',   -- same shape as runs.asset_manifest
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## Part B — The Agent Registry

Agents are database rows, never hardcoded. `lib/agents.ts` currently hardcodes four agents as a TypeScript constant. Delete that constant and replace it with a Supabase-backed registry.

**Names, colors, roles, instructions, model choices, and enabled surfaces must all be editable from the UI at any time.** The six agents below are seed data with placeholder names, not a fixed roster. Renaming an agent must not break threads, runs, messages, or costs, which is why everything references `agent_id` and never a name string.

### Schema

Extend the `agents` table from Phase 3.

```sql
alter table agents add column if not exists slug text;
alter table agents add column if not exists tagline text;
alter table agents add column if not exists instructions text;
alter table agents add column if not exists avatar_color text default '#AD0000';
alter table agents add column if not exists surfaces text[] default '{chat}';   -- chat | build | canvas
alter table agents add column if not exists model_reasoning text;
alter table agents add column if not exists model_fast text;
alter table agents add column if not exists model_render text;
alter table agents add column if not exists permissions jsonb default '{}';
alter table agents add column if not exists can_handoff_to uuid[];
alter table agents add column if not exists sort_order integer default 0;
alter table agents alter column status set default 'paused';
```

`avatar_url` from Phase 3 is no longer used for the roster. Every agent renders the same sticker-head mark on a solid circle of `avatar_color`. Store the mark once in `/public/agent-mark.png` and reference it from a single `<AgentAvatar />` component.

### Seed data, placeholder names only

| Placeholder name | Owns | Surfaces | Color |
|---|---|---|---|
| Chief | Routing and status. Produces no work of its own | chat | `#7FD1B9` |
| Atelier | Apparel design and product | chat, build, canvas | `#AD0000` |
| Voice | Every word that ships, on every surface | chat, build | `#E8C468` |
| Studio | Images and video | chat, build, canvas | `#FF3D8A` |
| Social | Scheduling, platform adaptation, automations | chat, build, canvas | `#6FA8FF` |
| Builder | Planner plus executor pair for code | chat, build | `#9B8CFF` |

Seed them as `status = 'paused'`. Activation is a deliberate act.

### Permissions shape

Enforced server side starting in Phase 6. Stored now so the Settings UI is real.

```json
{
  "generate": "ask",
  "publish": "never",
  "write_knowledge": "ask",
  "use_cli": "never",
  "mcp_write": "ask",
  "budget_cap_per_run": 5.00
}
```

Values are `always`, `ask`, or `never`, matching the three mode pattern. `ask` is the default for anything that costs money or leaves the system.

---

## Part C — The Shell

Replace `components/layout/app-shell.tsx`. It currently renders a sidebar plus a single centered column. It becomes a three pane grid.

```
┌────────────┬──────────────────────────┬──────────────┐
│  Rail      │  Center                  │  Work        │
│  266px     │  1fr                     │  364px       │
└────────────┴──────────────────────────┴──────────────┘
```

### Rail

Rewrite `components/layout/sidebar.tsx`.

1. Brand row. MARCO mark, wordmark, and the collapse toggle on the right of that row.
2. Brand context switcher directly below, with a red left border. Switching brands changes which brand record every agent reads from. This replaces the old workspace switcher entirely.
3. Threads section with a `+` that opens the New Agent screen.
4. Library section, six items only: Calendar, Automations, Assets, Knowledge, Spend, Settings.

Delete the Phase 1 workspace tree and the Phase 4.5 tool-first `NAV_CONFIG` groups. `lib/nav-config.ts` shrinks to the six library items. The Social sub-nav goes away, its children become tabs inside their own pages or move into the Social agent's Build view.

**Collapse behavior.** Toggle collapses the rail to 66px. In collapsed state show the mark, the toggle stacked under it, a `CO` style brand pip, agent avatars, and library icons. Nothing else. Rail must have `overflow: hidden` so no label text bleeds out. Persist the collapsed state in localStorage.

### Center

Top bar holds the active agent avatar, name, tagline, the view switcher, a gear, and the work panel toggle.

**View switcher.** Renders only the surfaces that agent has enabled. An agent with `surfaces = {chat}` shows no tabs at all. Selecting an agent whose enabled surfaces do not include the current view falls back to Chat.

- **Chat view** renders the thread. Message kinds render differently: `text` as a bubble, `handoff` as a packet card, `approval` as a red-bordered card with action buttons, `manifest` as role-tagged pills, `plan` as a review card.
- **Build view** renders the Run as numbered blocks ending in a red run bar with the estimated cost. Promote `components/features/generation-studio.tsx` into this renderer.
- **Canvas view** renders the Run as a graph. See Part D.

Composer sits at the bottom in Chat and Build, hidden in Canvas.

### Work panel

Right pane. Shows the active Run: outputs, status, assets in, outputs out, cost so far, and the step list. Collapses to zero via the top bar toggle or the X in its header. Persist the open state.

In Canvas view the work panel becomes the create chat instead of the run summary. A large greeting, quick action pills, and a `What do you want to create?` box. This is how nodes get onto the canvas by conversation instead of dragging.

### Components to add

- `<ThreadList />`, `<ThreadRow />`
- `<AgentAvatar agentId size />`
- `<ViewSwitcher />`
- `<WorkPanel />`
- `<RunSteps />`, `<RunCostBar />`
- `<ApprovalCard />`, `<HandoffCard />`, `<ManifestCard />`
- `<BuildBlock n title>` for the numbered Build sections
- `<PermissionTri />` for the always, ask, never control
- `<MobileTabBar />`

### Components to retire

`components/layout/sidebar-nav-group.tsx` and `page-hero.tsx` are no longer used by the new shell. Leave `global-command-bar.tsx` in place but reduce it to search plus theme toggle. The quick actions it holds are now agent requests, not buttons.

---

## Part D — Canvas

Rebuild the canvas surface to match the wireframe. Keep `@xyflow/react`, keep `components/features/workflow-canvas.tsx` and `workflow-nodes.tsx` as the engine underneath.

- Full bleed. No card frame, no page padding. Dot grid on `#141212`.
- Floating vertical tool dock on the left edge, rounded pill, roughly 36px circular buttons: add, select, pan, cut, frame, comment, divider, undo, redo, settings.
- Saved template chips across the top left.
- Page indicator and zoom control bottom.
- **Group regions.** A node can belong to a labeled, tinted, bordered group with its label sitting above the box. Seed group types: Reference Images, Uploaded Images, Prompts, Final Images. This is the main visual difference from a plain node graph and it is what makes a 40 asset run readable.
- Wires are bezier bundles, not straight lines.
- Node types carry through from Phase 4 and gain: Agent node, Approval node, Asset Bundle node, Group node.
- Every node shows its own status and cost once Phase 5 lands. Render the fields now, zeroed.

Saving a canvas writes to `workflow_canvases` as before, plus a link to the Run it was built from.

```sql
alter table workflow_canvases add column if not exists run_id uuid references runs(id);
alter table workflow_canvases add column if not exists is_template boolean default false;
alter table workflow_canvases add column if not exists groups jsonb default '[]';
```

---

## Part E — New Agent Screen

Reached from the `+` next to Threads. Six numbered blocks plus a live preview column.

1. **Identity.** Name, one line tagline, avatar background. The color control is eight preset swatches, each rendering the sticker mark, plus a native color input for any custom hex, a live hex readout, and a Random button. The preview column updates immediately.
2. **What it owns.** Instructions textarea, plus a template picker that copies instructions from an existing agent as a starting point.
3. **Surfaces.** Chat is locked on and cannot be disabled. Build and Canvas are toggles.
4. **Models.** Reasoning, fast, render. Render is optional and may be none.
5. **Knowledge and skills.** Attach knowledge documents and enable skills. In this phase the pickers are real but the lists are seeded.
6. **Permissions and handoffs.** The always, ask, never control per permission, the per run spend cap, and which agents this one may hand off to.

New agents are created with `status = 'paused'`. The Create button writes the row and routes to that agent's new thread.

Editing an existing agent uses the same form, reached from Settings.

---

## Part F — Settings

Rewrite `app/settings/page.tsx`. Left column is a section list, right column is the pane.

- **Agents.** One row per agent. Opens the same form as New Agent.
- **Providers and keys.** OpenRouter, fal, plus platform keys for Meta, TikTok, YouTube, Shopify, Telegram. Each row shows a masked value, a Connected or Missing badge, and Edit. Keys are stored server side only and never reach the browser. In this phase the rows read from environment variable presence, they do not store keys in the database.
- **Connections.** MCP servers and CLI runners. UI only in this phase, wired in Phase 7.
- **Brand records.** List and edit brands.
- **Sync.** Obsidian and Supabase status. See Part G.
- **Appearance.** Theme, accent, work panel auto-hide.

---

## Part G — Obsidian and Supabase Sync

Supabase remains the system of record. Obsidian is a mirror, not a second source of truth.

### Rules

1. Supabase is authoritative for every table. Obsidian never wins a conflict.
2. Sync is one directional by default, Supabase to Obsidian, writing markdown files into a Git-backed vault.
3. Optional inbound is limited to `knowledge_documents` only. If a document's file changes in the vault and the vault commit is newer than `updated_at`, surface it as a pending change the user approves. Never auto-overwrite.
4. Nothing syncs outbound that contains a secret. No keys, no tokens, no permission rows.

### What mirrors to the vault

```
vault/
├── Brands/<brand>/brand-record.md
├── Knowledge/<folder path>/<document>.md
├── Agents/<agent>/instructions.md
├── Runs/<YYYY-MM>/<short_id>.md        # summary, steps, cost, output links
└── Threads/<agent>/<thread>.md          # transcript, append only
```

### Schema

```sql
create table sync_targets (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                    -- 'obsidian_git'
  repo_url text,
  branch text default 'main',
  vault_subpath text default '',
  direction text default 'outbound',     -- outbound | bidirectional_knowledge_only
  last_sync_at timestamptz,
  status text default 'idle',            -- idle | syncing | error
  last_error text,
  created_at timestamptz default now()
);

create table sync_log (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references sync_targets(id),
  direction text,
  table_name text,
  record_id uuid,
  file_path text,
  action text,                           -- created | updated | skipped | conflict
  created_at timestamptz default now()
);
```

Build the Settings UI and the schema in this phase. The actual Git write runs on the worker introduced in Phase 6. Until then, sync status reads `not configured`.

### Supabase hardening

- Confirm RLS is on for every new table in this phase, scoped to the single owner.
- Add indexes: `runs(agent_id)`, `runs(status)`, `messages(thread_id, created_at)`, `threads(updated_at desc)`.
- Add `updated_at` triggers on `runs`, `threads`, `brands`, `asset_bundles`.

---

## Part H — Mobile

Same codebase, same routes, same single Vercel URL. No native app.

Breakpoint is 900px.

- Rail becomes a slide-out drawer behind a hamburger in the top bar, with a scrim. Tapping a thread or a library item closes it.
- Bottom tab bar, four items: Threads, Work, Output, Library. Respect `env(safe-area-inset-bottom)`.
- Work panel becomes a bottom sheet that slides up from the Output tab, roughly 62vh, not a fixed column.
- Canvas goes read only with a banner: open on desktop to wire nodes. The tool dock rotates horizontal and sits at the bottom. Approval nodes and status must still work, since approving from a phone is a core use.
- All multi column grids collapse to one column. Calendar becomes a stacked agenda. Wide tables drop non essential columns rather than scrolling sideways.
- Every touch target is at least 34px tall, 44px for primary actions.
- Test in real Safari on iPhone, not only devtools, specifically the blur and viewport height behavior.

### Home screen icon

- `public/manifest.json` with the sticker mark at 192, 256, 384, 512.
- `apple-touch-icon` meta tags.
- `theme-color` set to `#0F0E0E`, `display: standalone`.

This is a nice to have, not a blocker.

---

## Acceptance Criteria

- [ ] App is branded MARCO, palette tokens updated, CLAUDE.md corrected
- [ ] Three pane shell replaces the page-per-feature layout
- [ ] Rail collapses to 66px with no text bleed, state persists
- [ ] Work panel toggles open and closed from the top bar and its own header, state persists
- [ ] Threads list is driven by the `threads` table, not a constant
- [ ] Agents are database rows. Renaming an agent in Settings updates every surface and breaks nothing
- [ ] View switcher shows only that agent's enabled surfaces, and falls back to Chat correctly
- [ ] The same Run renders in Chat, Build, and Canvas without losing state when switching
- [ ] `runs`, `threads`, `messages`, `brands`, `asset_bundles`, `sync_targets`, `sync_log` exist with RLS
- [ ] Canvas matches the wireframe: full bleed, floating dock, labeled group regions, bezier bundles
- [ ] Canvas view swaps the work panel to the create chat
- [ ] New Agent screen works end to end including the custom color picker, and creates paused agents
- [ ] Settings has Agents, Providers and keys, Connections, Brand records, Sync, Appearance
- [ ] Obsidian sync settings and schema exist, status reads not configured
- [ ] Under 900px: drawer rail, bottom tab bar, bottom sheet work panel, read-only canvas, no horizontal scroll on any page
- [ ] Manifest and apple-touch-icon added
- [ ] Zero model API calls anywhere in the codebase at the end of this phase

## Deliverable

The same repo, same Supabase, same Vercel URL, rebuilt as a thread-first command center. Every unit of work is a Run with three views. Agents are editable rows. The whole thing works on a phone. No intelligence yet.
