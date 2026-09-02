# Phase 6.5 — Shell Redesign and Canvas Removal
## MARCO Command Center

> This phase sits between Phase 6 and Phase 7. Phase 6 (the durable worker runtime) is complete. This phase does not add a new agent, provider, or database table. It removes Canvas as a Run view, tightens and redensifies the shell layout, and adds a prompt-enhancer control to the composer. Phase 7 (Roster, Skills, Connections) already assumes `chat, build` as the only surfaces — see the updated table in `phase-7-roster-skills-connections.md`.

---

## Why

Canvas was scoped in Phase 4.6 as a third Run view — a node-based visual canvas alongside Chat and Build. In practice it duplicates what Build already does (manifest, model picks, aspect ratio) behind a heavier, less legible UI, and it's never been the primary way work gets done. Chat and Build cover everything: Chat is the conversation, Build is the structured control surface for a Run (prompt, asset manifest, model/output settings). Canvas comes out entirely as a Run view.

Direct image/video creation (dropping into a blank generation surface without a conversational Run) stays a real need, but it does not need its own pane in the three-pane shell. See Part B.

---

## Explicitly Out of Scope

- No new provider calls, no new database tables.
- No changes to the worker, dispatch, or runtime repository (Phase 6 is done and stays as-is).
- No Phase 7 roster/skills/MCP work.
- No auth changes.

---

## Part A — Remove Canvas as a Run View

### Files to touch

- `components/marco/marco-shell.tsx` — remove `"canvas"` from the `view` state type, delete `CanvasView`, `CanvasGroup`, `CanvasChat`, and every branch that renders them (`marco-stage` `is-canvas` class, the `WorkView` canvas branch, the composer's `view !== "canvas"` guard, the tabbar's Output button routing). `chooseView` only ever receives `"chat" | "build"`.
- `lib/marco-types.ts` — `MarcoAgent.surfaces` narrows from `("chat" | "build" | "canvas")[]` to `("chat" | "build")[]`.
- `lib/demo-marco-data.ts` — strip `"canvas"` out of every demo agent's `surfaces` array.
- `app/canvas/page.tsx` — delete the file and the route. Anything that linked to `/?view=canvas` (including the old `redirect("/?agent=studio&view=canvas")`) goes with it.
- `app/globals.css` (or wherever `.marco-canvas*`, `.marco-canvas-dock`, `.marco-canvas-group`, `.marco-canvas-node`, `.marco-canvas-chat`, `.marco-wires`, `.is-canvas` live) — delete those rules. Do not leave dead CSS.
- Any Settings UI that lists `canvas` as a togglable surface for an agent — remove the option.
- Search the repo for the literal string `canvas` (case-insensitive) after the above and confirm every remaining hit is either this phase doc, git history, or an unrelated word (e.g. HTML `<canvas>` if used for something else entirely) — not a live code path.

### Studio's generation controls

Studio (and any future image/video agent) keeps direct generation. It happens inside **Build**, not a third pane:

- Build's asset manifest, aspect ratio picker, model/output block, and "Create Run" button (already built in Phase 4.6/5) is the single place generation parameters live.
- If Studio needs a scratch space to generate without a full conversational brief, that is a Build-view affordance (e.g. a "Quick generate" mode inside Build), never a separate view in the shell's view switcher.

---

## Part B — Shell Redesign

Keep the token system exactly as-is — `--bg`, `--panel`, `--panel-2`, `--line`, `--line-2`, `--red`, `--red-hi`, `--pink`, `--txt`, `--txt-dim`, `--txt-mute`. No new hex values. This phase changes layout density and structure, not palette.

### Thread rail

- Increase row density in `.marco-rail-scroll` so more threads are visible without scrolling — tighter vertical padding per `.marco-thread` row, consistent with a contact-list/messenger feel rather than a spaced-out card list.
- Keep `AgentAvatar` + name + relative time + preview line, but align spacing so the avatar, name, and timestamp sit on one baseline (matching the existing `.marco-thread-copy` structure, just tightened).
- The brand-context switcher and Library section stay where they are; do not restructure navigation order in this phase.

### Composer — prompt enhancer

Add one control to the composer in `marco-shell.tsx`, next to the existing `Attach` / `Bundle` actions:

- A button (e.g. "Enhance") that takes the current `draft` text, sends it through the active agent's model via the existing `lib/openrouter.ts` path (a lightweight, separate call — not a Run, not persisted as a message), and replaces `draft` with the enhanced version before the person presses Send.
- This runs client-triggered, server-executed (an API route or server action, not a direct client call — `OPENROUTER_API_KEY` stays server-side per the existing provider rule).
- While enhancing, disable Send and show a pending state on the Enhance button. Never silently replace the draft without the pending state being visible.
- If the enhance call fails, leave the original draft untouched and surface the failure — do not clear the input.
- This is additive only. It never auto-sends, never auto-enhances without the person pressing the button.

### Mobile

- No new information architecture on mobile. Re-check `.marco-tabbar` after Canvas removal — the "Output" tab pointed at Canvas/Work; confirm it now opens the Work sheet only (Chat, Work, Library — three tabs, not four).
- Re-verify no horizontal scroll at phone width per the existing Development Workflow rule.

---

## Acceptance Criteria

- [ ] No code path renders a Canvas view. `view` state is `"chat" | "build"` only.
- [ ] `/canvas` route no longer exists.
- [ ] `MarcoAgent.surfaces` type and every demo/seeded agent record only ever contains `"chat"` and/or `"build"`.
- [ ] All `.marco-canvas*` CSS removed; no dead rules left behind.
- [ ] Settings no longer offers Canvas as a surface toggle.
- [ ] Build view is the only place generation parameters (manifest, aspect ratio, model, variations) are set — confirmed still working for Studio-style agents.
- [ ] Thread rail is visibly denser; more threads fit above the fold at default rail width.
- [ ] Composer has a working Enhance control: pending state while running, replaces draft on success, leaves draft untouched and surfaces the error on failure.
- [ ] Enhance calls route through the server; no OpenRouter key reachable from the browser bundle.
- [ ] Mobile tabbar has three destinations (Chat/Threads, Work, Library), no orphaned Output/Canvas tab.
- [ ] No horizontal scroll at phone width.
- [ ] `CLAUDE.md`, `PRODUCT.md`, and `phase-7-roster-skills-connections.md` are consistent with Chat/Build-only surfaces (already updated alongside this doc).

## Deliverable

A two-view shell (Chat, Build), a denser thread rail, and a working prompt-enhancer in the composer — same red/black/pink token system, no new providers or tables.
