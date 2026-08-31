# Phase 5 — Generation Layer
## MARCO Command Center

> Phase 4.6 must be complete. This phase makes Runs actually produce something. It wires OpenRouter for text and fal for image and video, both behind single server-side services, adds per agent model slots and asset bundles, and rebuilds Spend on real data. Still no agent runtime, no autonomous behavior. Every call in this phase is started by you pressing a button.

---

## Goal

A Run can now execute. You fill in a Build view, press Run, and real text, images, or video come back with the exact cost shown at the moment it happens.

## Explicitly Out of Scope

- No autonomous agents, no agent-to-agent messaging, no memory. Phase 6.
- No skills, no MCP, no CLI runners. Phase 7.
- No scheduling, no Telegram, no real publishing. Phase 8.

---

## Part A — OpenRouter Service

Build one file, `lib/openrouter.ts`. It replaces `lib/llm/openrouter.ts`. Nothing in the codebase calls OpenRouter anywhere else.

### Interface

```ts
type CompletionRequest = {
  model: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  runId?: string
  agentId?: string
  jsonMode?: boolean
}

type CompletionResult = {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost: number
  }
  model: string
}
```

### Rules

- `OPENROUTER_API_KEY` is server side only. It never appears in a client bundle. Verify by grepping the built output.
- Every call writes a `model_usage_log` row before returning, tagged with `run_id` and `agent_id`.
- Cost comes from OpenRouter's response headers or usage object. Do not estimate from a hardcoded price table, since prices change.
- On failure, write the log row with `status = 'failed'` and the error, then throw. A failed call still costs tokens sometimes, so it must be recorded.
- Retries: one retry on 429 and 5xx with backoff, then fail. Never silently retry a call that already succeeded.

### Model catalog

Fetch OpenRouter's model list at build time or on a cached server route, do not hardcode model IDs. Support at minimum Claude, GPT, Gemini, Grok, and Kimi families. Cache the catalog for an hour.

---

## Part B — fal Service

Build `lib/fal.ts`. Same discipline: one file, every image and video call goes through it.

### Interface

```ts
type GenerationRequest = {
  modelId: string
  prompt: string
  manifest?: ManifestEntry[]     // from runs.asset_manifest
  aspectRatio?: string
  duration?: number
  variations?: number
  runId?: string
  agentId?: string
}

type GenerationResult = {
  jobId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  outputs: { url: string; type: 'image' | 'video'; width?: number; height?: number }[]
  cost: number
}
```

### Manifest handling

This is the part that matters most.

1. Read `asset_manifest` from the Run. Never read file bytes into a prompt.
2. Resolve each entry to a signed URL from Supabase Storage.
3. Group by role. The role determines where each URL goes in the fal payload, and different models accept different slots. Build a per model adapter that maps roles onto that model's parameters, and fails loudly when a model cannot accept a role that the manifest contains.
4. `document` entries never reach the model. Their extracted text is injected into the prompt as context instead. Extraction happens at asset upload time, not at generation time.
5. Enforce a per model cap on manifest size. If the model accepts fewer references than the manifest holds, do not silently truncate. Show which entries will be dropped and require confirmation.

### Model catalog

Check fal's live catalog at build time. Do not hardcode assumptions about exact model names. Support at minimum the image and video models actually in use, including the SeeDance family, and store the per model reference cap and accepted roles in `lib/fal-models.ts`.

### Polling

Long video jobs do not complete inside a request. Write the job row immediately with `status = 'queued'`, return the job ID, and poll from a server route. The Run's step goes to `running` and the work panel shows progress.

```sql
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id),
  agent_id uuid references agents(id),
  provider text not null,               -- 'fal'
  model_name text not null,
  fal_request_id text,
  status text default 'queued',
  prompt text,
  manifest jsonb,
  outputs jsonb default '[]',
  cost numeric(10,4),
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

---

## Part C — Per Agent Model Slots

The `model_reasoning`, `model_fast`, and `model_render` columns added in Phase 4.6 now do something.

- Every call resolves its model in this order: explicit override in the Build view, then the agent's slot, then the global default in settings.
- The Build view's model picker shows the agent's slot as the pre-selected value and marks it as the default.
- Changing a model in a Build view affects that Run only. Changing it in Settings changes the agent's default.
- Store global defaults in a `settings` table keyed by feature, so a rename of an agent never orphans a default.

---

## Part D — Asset Bundles

The `asset_bundles` table from Phase 4.6 becomes usable.

- Assets page gets a bundle strip: All, plus one chip per bundle, plus New bundle.
- Selecting assets and saving creates a bundle. Bundles carry role tags, not just file lists.
- Build views load a bundle by name into `asset_manifest` in one action.
- The Build view manifest control supports retagging a role, reordering, removing, and adding without leaving the page.
- Extracted document text is stored once per asset, not per bundle.

```sql
alter table assets add column if not exists extracted_text text;
alter table assets add column if not exists extracted_at timestamptz;
alter table assets add column if not exists default_role text;
```

Extraction runs on upload for PDFs, docs, and text files. Images and video get no extraction.

---

## Part E — Where Generation Connects

- **Build view run bar.** The main entry point. Fill the blocks, press Run.
- **Canvas prompt and agent nodes.** Running a canvas executes its nodes in dependency order and stops at any Approval node.
- **Content adaptation.** The Phase 4 analyzer and platform adapters in `lib/content/analyzer.ts` and `lib/content/adapters.ts` stop calling any provider directly and route through `lib/openrouter.ts`.
- **Every output becomes an Asset.** Generated files are saved into Supabase Storage and written as `assets` rows, tagged to the brand and linked to the Run that produced them.

```sql
alter table assets add column if not exists run_id uuid references runs(id);
alter table assets add column if not exists brand_id uuid references brands(id);
alter table assets add column if not exists is_generated boolean default false;
```

---

## Part F — Cost Visibility

**Non negotiable requirement.** The cost of a single generation is shown to you at the moment it completes, in the UI, next to the output. Not only in an aggregate report later.

- The Build run bar shows an estimate before you press Run, and the actual after.
- The work panel's `Cost so far` updates live as steps complete.
- Canvas nodes each show their own cost.
- Every Run row accumulates `cost` from its steps.

### model_usage_log

Extend the Phase 3 table.

```sql
alter table model_usage_log add column if not exists run_id uuid references runs(id);
alter table model_usage_log add column if not exists agent_id uuid references agents(id);
alter table model_usage_log add column if not exists status text default 'ok';   -- ok | failed
alter table model_usage_log add column if not exists error text;
alter table model_usage_log add column if not exists latency_ms integer;

create index if not exists idx_usage_created on model_usage_log(created_at desc);
create index if not exists idx_usage_agent on model_usage_log(agent_id);
```

---

## Part G — Spend Page

Rewrite `app/spend-usage/page.tsx` on real data, matching the wireframe.

1. **Cap bar** at the top. A progress bar against the monthly cap with the percent. Warn at 80, block new runs at 100 if hard stop is enabled.
2. **Hero row.** Today, 7 day, 30 day, and the split between fal and OpenRouter.
3. **Spend by agent.** Horizontal bars with the agent avatar, ranked highest first. Reads `model_usage_log` grouped by `agent_id`.
4. **Spend by model.** Same treatment grouped by `model_name`.
5. **Recent runs table.** Run short ID, agent, model, output summary, cost.
6. **Date range filter** applied to all of the above: today, 7, 30, all time.

Budget settings live in the `settings` table: monthly cap, hard stop on or off.

---

## Part H — Failure Behavior

- A failed generation puts the Run into `failed` with the error visible in the work panel and the step marked failed. Never leave a Run stuck in `running`.
- A Run that exceeds an agent's `budget_cap_per_run` fails before the call is made, with a clear message. It does not partially run and then stop.
- Never mark an output as saved if the storage write failed.
- Never fabricate a cost. If a provider returns no cost, store `null` and label it unknown in the UI rather than guessing.

---

## Acceptance Criteria

- [ ] Every text call in the codebase routes through `lib/openrouter.ts`, nothing calls the API ad hoc
- [ ] Every image and video call routes through `lib/fal.ts`
- [ ] Model catalogs are fetched, not hardcoded
- [ ] Per agent model slots resolve correctly, and a Build view override applies to that Run only
- [ ] A 40 plus asset manifest runs end to end with correct role mapping, and document entries are injected as text, never sent as files
- [ ] A model that cannot accept the full manifest surfaces which entries will be dropped and requires confirmation
- [ ] Long video jobs poll to completion without blocking a request, and the Run step reflects progress
- [ ] Every call writes `model_usage_log` with run and agent, including failures
- [ ] Individual generation cost is visible at the moment of generation
- [ ] Generated outputs save as Assets, tagged to brand and Run
- [ ] Bundles can be created, loaded, retagged, and reordered
- [ ] Spend page shows real cap, hero, by agent, by model, and recent runs with a working date filter
- [ ] Per run budget cap blocks a run before spending
- [ ] No API key reaches the browser bundle

## Deliverable

Runs that actually produce work, with exact cost shown the moment it is spent, and a Spend page that tells the truth.
