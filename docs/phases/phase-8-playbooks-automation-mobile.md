# Phase 8 — Playbooks, Automation, and Mobile Control
## MARCO Command Center

> Final phase. Phases 1 through 7 must be complete. This phase turns good workflows into repeatable operations, wires real publishing and DM automation, adds scheduling, and puts approvals in your pocket through Telegram.

---

## Goal

Stop starting from zero. A playbook runs a proven sequence on a schedule, posts go out for real, comment triggers fire DMs, and anything waiting on you reaches your phone.

---

## Part A — Playbooks

A playbook is an executable workflow, not a text document. It is what a saved canvas template becomes once it can run itself.

```sql
create table playbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  brand_id uuid references brands(id),
  canvas_id uuid references workflow_canvases(id),
  steps jsonb not null default '[]',
  mode text default 'guided',       -- preview | guided | autonomous_within_limits
  budget_cap numeric(10,4),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table playbook_runs (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid references playbooks(id),
  run_id uuid references runs(id),
  status text default 'running',
  current_step integer default 0,
  log jsonb default '[]',
  started_at timestamptz default now(),
  ended_at timestamptz
);
```

### Step contract

Every step declares:

- Input contract, what it needs
- Output contract, what it produces
- Which agent runs it
- Tool permissions for that step
- Approval policy
- Retry policy
- Completion test, how the system knows the step succeeded

### Modes

- **Preview.** Shows the whole plan, runs nothing.
- **Guided.** Runs, pauses at every approval gate. This is the default.
- **Autonomous within limits.** Runs without pausing, but only inside the playbook's budget cap, and only for steps whose permission is `always`. Any `ask` still stops it. Any failure stops it.

Seed playbooks: Drop launch, Client onboarding, Weekly content batch, Lookbook to reels.

---

## Part B — Scheduling

```sql
create table scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,           -- playbook | daily_brief | report | sync | post
  target_id uuid,
  schedule_cron text not null,
  timezone text default 'America/New_York',
  config jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz,
  status text default 'active',     -- active | paused | error
  last_error text,
  created_at timestamptz default now()
);
```

- Scheduler runs in the Phase 6 worker, not in Vercel cron.
- Scheduled work enters the `automation` lane. It never outranks you or a peer packet.
- A scheduled job that fails writes the error and does not silently retry forever. Cap retries, then pause the job and notify.
- Minimum: a morning brief, and a recurring playbook trigger.

---

## Part C — Publishing

Finish what Phase 4 stubbed.

- Wire the Meta Graph API for Instagram and Facebook once your app review is approved. Leave the integration points clearly marked until then.
- Wire any other platform whose API you actually have.
- **Manual approval stays the default.** Auto publish is opt in, per brand, and never the default for a new brand.

### The rule that does not bend

Never mark something published if it was not. Any platform without a working publish connector produces `READY_TO_POST`: a complete manual pack with the caption, the hashtags, correctly sized media, and a suggested time. That is an honest state, not a failure state.

Other rules carried from Phase 4:
- Preserve every item in `facts_to_preserve` unchanged across every adaptation. No rounding numbers, no softening claims, no inventing them.
- Apply the brand voice record consistently, including words to avoid and emoji and hashtag rules.
- Never fabricate analytics. Store `null` and label it unavailable.

---

## Part D — Auto-Engage

Finish the DM automation from Phase 4. This is the Mini Chat style behavior.

- A comment containing a trigger keyword fires a DM.
- Follow gate is optional per flow.
- Multi step DM sequences supported.
- Every fire is logged with the contact identifier, the result, and the timestamp.
- Rate limit per flow so a viral post does not get the account flagged.
- Flows attach to specific posts, not just globally.
- The Social agent may suggest a flow. It may never turn one on without your approval.

---

## Part E — Telegram

Telegram, not iMessage. Telegram has an official bot API built for exactly this. Apple does not offer an equivalent.

### Setup

- Bot via BotFather, token in `TELEGRAM_BOT_TOKEN`, server side.
- Webhook at `/api/telegram/webhook`.
- **The bot responds only to your Telegram user ID.** Every other ID is ignored silently.

### Commands

| Command | Behavior |
|---|---|
| `/status` | Chief's synthesized summary: active runs, blocked items, pending approvals, today's spend |
| `/approve` | Pending approvals and learning proposals with inline approve and reject buttons |
| `/ask [agent] [question]` | Route directly to an agent by name |
| `/run [playbook]` | Trigger a playbook |
| `/task [text]` | Create a task |
| `/note [text]` | Create a note |
| `/spend` | Today, 7 day, 30 day |

Agent names in commands resolve against the current name in the database, so renaming an agent updates the command surface automatically.

### Voice notes

- Accept voice notes, transcribe them, and route the text through the same intent parsing as typed commands.
- If intent is ambiguous, ask a clarifying question. Never guess and act.

### Approvals

- Any pending approval can push a Telegram message with Approve, Reject, and Open in app.
- Approving in Telegram writes the same Supabase records the web app uses. Both surfaces stay in sync, always.
- A settings toggle controls which approval types push to Telegram, since some are too complex for a phone decision.

### Notifications

- Generation job finished
- Agent run completed or failed
- New learning proposal
- Budget threshold at 80 and 100 percent
- Scheduled daily brief at a configurable time

---

## Part F — Mobile Polish

The responsive work landed in Phase 4.6. This phase verifies it against the finished app.

- Re-audit every page built in Phases 5 through 7 at phone width. Skills, connections, playbooks, and the approval queue are all new since the original pass.
- Approvals must be excellent on a phone. That is the primary mobile use case, and it is the one thing you will do daily from your pocket.
- Confirm the home screen icon and standalone launch still behave after all the additions.
- Test in real Safari, not devtools.

---

## Acceptance Criteria

- [ ] A playbook runs end to end in guided mode, pausing at every gate
- [ ] Autonomous mode respects the budget cap and stops on any `ask` or failure
- [ ] Scheduled jobs run in the worker, in the automation lane, and never outrank you
- [ ] A failing scheduled job pauses itself and notifies rather than retrying forever
- [ ] Nothing is ever marked published without a successful publish call
- [ ] Unsupported platforms produce a complete READY_TO_POST pack
- [ ] Manual approval is the default for every brand
- [ ] Auto-Engage fires real DMs on keyword with an optional follow gate, rate limited and logged
- [ ] Telegram bot ignores every user except you
- [ ] All commands work, and agent names resolve to current database names
- [ ] Voice notes transcribe and route correctly, and ask when ambiguous
- [ ] Approving in Telegram and approving in the web app write the same records
- [ ] All notification types fire
- [ ] Every page from Phases 5 through 7 works at phone width with no horizontal scroll
- [ ] Home screen icon and standalone launch work

## Deliverable

MARCO complete. A thread-first command center for every brand you run, with a real agent team, a Run object underneath everything, exact cost visibility, repeatable playbooks on a schedule, real publishing and DM automation, an Obsidian mirror, and full control from your phone.

---

## Handoff to Codex

Planning is done. Execution runs on **Codex 5.6 on high**, connected through Claude Code.

### Division of labor

- **Claude Code plans.** For each phase it produces the file list, interfaces, and acceptance tests before any code is written. It does not write implementation.
- **Codex 5.6 high executes.** Branch per phase, incremental commits, PR at the end of each phase.
- **Claude Code reviews** the diff against its own acceptance tests. Two rounds maximum, then it escalates to you.
- **You merge.** Codex never merges.

### Order

Strictly sequential. Do not start a phase until the previous one's acceptance criteria all pass.

`4.6` then `5` then `6` then `7` then `8`

### Standing rules for both

- Single user. Never add login, signup, roles, or team features.
- No hardcoded hex outside the token definitions.
- No API key ever reaches a client bundle.
- Do not install a dependency without saying what and why first.
- Commit incrementally with clear messages, never one commit per phase.
- If a phase file conflicts with something already in the repo, stop and ask. Do not guess.
- After each phase, summarize what was built, what deviated from spec, and wait for confirmation before continuing.
