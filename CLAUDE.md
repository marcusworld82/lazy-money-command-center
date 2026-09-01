# CLAUDE.md — MARCO Command Center

## Project Overview

MARCO is a thread-first command center for every brand Marcus runs. It is built as a Next.js application with Supabase as the system of record and deploys through Vercel.

The product is called **MARCO**. The repository remains `lazy-money-command-center`.

## Product Rules

- Single user only. Never add login, signup, roles, teams, organizations, or invitations.
- The app is a command center, not a dashboard of disconnected tools.
- Conversation is the primary interface.
- Every unit of work is a Run.
- Chat, Build, and Canvas are three views of the same Run.
- Supabase is the system of record.
- Obsidian is a mirror only, never a competing source of truth.
- Agents are database rows. Never hardcode agent names, colors, roles, models, or permissions.
- Names are display values only. Internal references always use `agent_id`.
- Never silently make expensive, external, or destructive changes.
- Never fabricate costs, analytics, publish states, model results, or tool results.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS and shadcn/ui where appropriate
- Supabase for database and storage
- Vercel for the web application
- Railway or Fly for long-running agent worker processes beginning in Phase 6
- OpenRouter for text models beginning in Phase 5
- fal for image and video generation beginning in Phase 5

## Visual System

Use the MARCO visual system. Dark mode is the default.

```css
:root {
  --bg: #0F0E0E;
  --panel: #1A1818;
  --panel-2: #211E1E;
  --line: #2E2A2A;
  --line-2: #3A3434;
  --red: #AD0000;
  --red-hi: #E01414;
  --pink: #FF3D8A;
  --txt: #F2EFEF;
  --txt-dim: #8B8383;
  --txt-mute: #5E5757;
}
```

- No hardcoded hex values outside the token definitions.
- Use red as the main accent. Do not use green as the primary brand color.
- The logo is the MARCO wordmark plus the sticker-head mark.
- Use the wireframe at `docs/marco-shell-wireframe.html` as the visual and behavior reference for the shell.
- When a phase document and the wireframe disagree, the wireframe wins on layout and the phase document wins on data behavior.

## Architecture Rules

### Runs

A Run is the universal work object. It contains:

- Inputs
- Asset manifest
- Ordered steps
- Outputs
- Status
- Approval state
- Cost

Do not build feature-specific work objects when a Run should be used instead.

### Asset manifests

- Never put file bytes into prompts.
- A manifest stores asset references, role tags, and order only.
- Allowed roles live in one shared location: `lib/manifest-roles.ts`.
- Documents are extracted at upload time. Their text can be injected as context, but document files do not go to image or video models.
- If a model cannot accept a full manifest, do not silently truncate it. Explain which assets would be dropped and require confirmation.

### Agents

- All agent settings are editable from the UI: name, tagline, avatar color, instructions, models, enabled surfaces, permissions, and handoff permissions.
- New agents start paused.
- Agent status, costs, messages, threads, runs, and handoffs must survive a rename.
- Each agent reads the active brand record. Brand data never belongs inside agent records.
- Agent transcript data is private by default. Cross-agent context moves only through typed handoff packets.

### Brand records

Brands hold shared facts such as palette, typography, voice, audience, offers, and restrictions.

Precedence for conflicting instructions:

1. Platform safety and legal policy
2. Marcus’s explicit instruction in the current turn
3. Approved brand rules
4. Agent instructions
5. Locked artifact constraints
6. Current brief
7. Unapproved suggestions

A brief may add constraints but may never silently override a brand restriction.

### Approvals and permissions

Permission modes are `always`, `ask`, and `never`.

- `ask` pauses the Run and creates an approval request.
- `never` is a hard block.
- “Allow once” is scoped to the agent, action, target, and Run. It expires with the Run.
- Repetition never becomes consent.
- A denied action cannot be immediately requested again during the same Run.
- Every external, costly, or destructive effect needs an authorization decision and audit log entry.

### Costs

- Show generation costs when the generation completes, not only in a later report.
- Use provider-reported cost data. Do not estimate from hardcoded price tables.
- If a provider returns no cost, store `null` and display it as unknown.
- Log successful and failed calls. A failure may still have a cost.
- Apply run and agent budget caps before spending.

## Provider Rules

### OpenRouter

- All text-model calls route through `lib/openrouter.ts`.
- `OPENROUTER_API_KEY` is server-side only. It must never reach a browser bundle.
- Use a live or cached provider model catalog. Do not hardcode model IDs.
- Retry exactly once with backoff for 429 and 5xx responses, then fail clearly.

### fal

- All image and video calls route through `lib/fal.ts`.
- Long-running jobs must return a job ID, persist their state, and be polled from a server route or worker.
- Generated outputs save to Supabase Storage and become Asset records only after the storage write succeeds.
- Use the live catalog plus `lib/fal-models.ts` for model-specific adapters, accepted asset roles, and reference caps.

### Keys and secrets

- Keep API keys server-side only.
- Never expose a secret to the browser.
- Never store raw provider keys in database rows when environment variables or secret references are appropriate.
- Settings may show masked values and Connected or Missing state only.

## Runtime Rules

Starting in Phase 6, the Next.js app is the interface and the worker handles long-running agent work.

- The web app posts work to the worker through an authenticated internal endpoint using `MARCO_WORKER_SECRET`.
- The worker exposes only its internal endpoint and health check.
- Use typed repository functions shared between app and worker for database writes.
- The user lane always outranks internal work.
- Internal work must never interrupt Marcus mid-conversation.
- Handoffs are fire-and-forget typed packets. A reply is a later message, never a synchronous return value.
- The model proposes state changes. The host validates and commits them.
- Runs must be cancellable without leaving hidden work that resumes later.

## Builder Rules

Builder is a planner-plus-executor lane, not two peer agents.

1. Claude Code produces a plan with files, interfaces, and acceptance tests.
2. Marcus approves or steers the plan. This gate cannot be disabled.
3. Codex executes only the approved plan on a branch and opens a PR.
4. Codex never merges.
5. Claude Code reviews the diff against its acceptance tests.
6. Limit review loops to two. Escalate the third failure to Marcus.

## Development Workflow

- Work in the specified phase order. Do not begin a phase until the preceding phase meets its acceptance criteria.
- Before coding a significant feature, identify files to touch, interfaces, database migrations, and acceptance checks.
- Keep changes focused. Do not rewrite unrelated components.
- Do not install a dependency without stating what it is for and why it is needed.
- Use clear, incremental commits. Do not group an entire phase into one giant commit.
- If a specification conflicts with existing code or another phase document, stop and surface the conflict rather than guessing.
- Test desktop and phone layouts. No horizontal scrolling at phone width.
- Test responsive behavior in real Safari for mobile release checks, not only browser devtools.

## Data and UI Integrity

- Never mark content published unless a publish API call actually succeeded.
- Platforms without a working publish connector must create a truthful `READY_TO_POST` pack with caption, hashtags, media, and suggested time.
- Preserve `facts_to_preserve` exactly through content adaptation. Do not round, soften, omit, or invent claims.
- Analytics that are not available stay `null` and display as unavailable.
- Learning proposals require explicit approval before they change permanent knowledge.
- Skill imports preserve helper scripts but never execute them during import.
- MCP grants are per agent, never global.
- CLI runners execute only inside a worker sandbox, only for authorized agents, and log command plus exit code.

## Core Invariants

1. Marcus’s active turn outranks all internal work.
2. A delivered handoff survives a restart and wakes the recipient at most once.
3. Private transcripts and agent-scoped memory never enter another agent’s prompt by default.
4. Models propose state changes. The host commits them.
5. Every external or destructive effect has an authorization decision and audit entry.
6. Cancelling a Run leaves no hidden work that blindly resumes.

## Writing Style

- Use plain English.
- Be direct and specific.
- Avoid corporate filler and vague claims.
- Say what is real, what is pending, what failed, and what needs Marcus’s decision.
- Surface conflicts and uncertainty instead of guessing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
