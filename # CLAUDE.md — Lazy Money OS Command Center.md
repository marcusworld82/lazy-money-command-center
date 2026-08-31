CLAUDE.md — MARCO Command Center
Before any work

Read the current phase file in /docs/phases/ before writing a line of code. The phase files are the source of truth, in order:

phase-4.6-shell-inversion-and-runs.md
phase-5-generation-layer.md
phase-6-agent-runtime.md
phase-7-roster-skills-connections.md
phase-8-playbooks-automation-mobile.md

Phases 1 through 4 are already built and live in this repo. Their original files are historical. Do not rebuild them.

/docs/marco-shell-wireframe.html is the layout and behavior source of truth for Phase 4.6. Open it before touching the shell. Where the wireframe and a phase file disagree, the wireframe wins on layout and the phase file wins on data.

What this is

MARCO is a single-user personal command center for one person running several brands. It is thread-first, not page-first. Every unit of work is a Run, and Chat, Build, and Canvas are three renderings of the same Run.

It is not a product. It is never sold, never multi-tenant, never onboarded.

Hard rules
Single user, permanently. Never add login, signup, roles, permissions between people, teams, seats, or client-facing accounts. If a phase file seems to ask for one, stop and ask.
Agents are database rows, never constants. Names, colors, taglines, instructions, models, and enabled surfaces are all editable at any time. Everything internal keys on agent_id. A rename must never break a thread, a run, a cost record, or a handoff.
No hardcoded hex outside the token definitions. Palette below.
No API key ever reaches a client bundle. Server side only. Verify by grepping the build output.
The model proposes, the host commits. No state change happens because a model said so. Queues, memory writes, approvals, and costs are written by the worker after its own checks.
Supabase is the system of record. Obsidian is a mirror. Supabase always wins a conflict.
Never claim something happened that did not. Nothing is marked published without a successful publish call. Nothing is marked saved if the write failed. Never fabricate a cost or a metric. Store null and label it unavailable.
Repetition is not consent. Approving the same action repeatedly never creates a standing allow. Only the user changing a permission mode does that.
Skill helper scripts are stored at import, never executed at import. They run only inside the worker sandbox when the skill actually fires.
Palette
Token	Hex	Usage
--bg	
#0F0E0E	App background
--panel	
#1A1818	Panels, rail, cards
--panel-2	
#211E1E	Raised surfaces, card headers
--line	
#2E2A2A	Borders
--line-2	
#3A3434	Hover borders
--red	
#AD0000	Primary accent
--red-hi	
#E01414	Hover, alert numbers
--pink	
#FF3D8A	Secondary accent
--txt	
#F2EFEF	Primary text
--txt-dim	
#8B8383	Secondary text
--txt-mute	
#5E5757	Labels, eyebrows

Dark is default. Light mode exists but is low priority. Sharp street-luxury character, nothing soft or rounded or cutesy. Subtle motion only.

Architecture
Next.js on Vercel. Interface only. From Phase 6 onward it never calls a model directly.
Worker on Railway or Fly. Long-lived Node process. Run scheduler, message queue, tool executors, Obsidian sync. Vercel functions time out and cannot hold an agent turn.
Supabase. Postgres plus Storage. RLS on every table, scoped to the single owner.
OpenRouter for all text, behind lib/openrouter.ts. Nothing calls it anywhere else.
fal for all image and video, behind lib/fal.ts. Nothing calls it anywhere else.
Six invariants

These stay true regardless of what changes later.

The user's active turn outranks all internal work.
A delivered message survives a restart and wakes its recipient at most once.
Private transcripts and agent-scoped memory never enter another agent's prompt by default.
The model proposes a state change. Only the host commits it.
Every external or destructive side effect has an authorization decision and an audit record.
Any run can be cancelled without leaving hidden work that later resumes blindly.
Working agreement
Claude Code plans. Codex executes. Claude produces the file list, interfaces, and acceptance tests before any code is written, and does not write implementation. Codex 5.6 on high writes the code.
Claude reviews the diff against its own acceptance tests. Two rounds maximum, then escalate to the user.
Codex opens a PR. Codex never merges. Merge stays with the user.
Branch per phase. Commit incrementally with clear messages, never one commit per phase.
Do not skip ahead to a later phase's features. Build only what the current phase file specifies.
Do not install a dependency without saying what and why first.
If a phase file conflicts with what is already in the repo, stop and ask. Do not guess.
After each phase, summarize what was built, what deviated from spec, and wait for confirmation before starting the next.
Do not start a phase until every acceptance criterion of the previous one passes.
Writing style in the product

Copy in the UI follows the same rules as the rest of this repo. No em dashes. Periods and commas only. Plain verbs, sentence case, no filler. Name things by what the person controls, not by how the system is built. Errors say what went wrong and how to fix it. An empty screen is an invitation to act.
