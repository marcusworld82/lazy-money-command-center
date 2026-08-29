# Lazy Money OS Command Center — Master Build Spec

> This is the single source of truth for this project. Any future session, agent, or developer should read this file first before making architecture or design decisions. Do not rely on chat memory — rely on this document.

---

## 1. Identity

- **Name:** Lazy Money OS Command Center
- **Type:** Personal, single-user operating system for running multiple businesses
- **Auth:** None. Personal use only. No login, no teams, no client accounts in V1.
- **Temporary logo:** `LM` monogram, sharp street-luxury style
- **Visual direction:** Executive control room × creative studio blend, "Glassporium" aesthetic (ethereal/transparent glass panels, not smoky/opaque)
- **Theme modes:** Dark mode (default) and light mode

## 2. Brand Colors (OS-wide, used everywhere — no per-workspace variation)

| Role | Hex | Notes |
|---|---|---|
| Main / background | `#166E16` | Deep green, dominant OS background |
| Primary accent | `#000000` | Structural panels, dark text on light surfaces |
| Secondary accent | `#FFFFFF` | Primary text, light surfaces |

**Adaptive text rule:** Text color flips based on the background of the specific screen/panel — white text on green/black surfaces, black text on white surfaces. Build as design tokens (`text-on-dark` / `text-on-light`), not hardcoded per component.

**Important:** Money Gap System's own brand bible (black `#000000`, white `#FFFFFF`, gray `#666666`, purple `#7F478F`/`#4A035C`) applies ONLY to Money Gap's external marketing/website. It does NOT change the Money Gap workspace's appearance inside the OS — that stays identical to every other workspace.

## 3. Navigation Structure

```
Command Center
├── Command Center (home)
├── Workspaces
│   ├── Shared OS
│   ├── Clothing Brand
│   ├── AI-Cinematic
│   └── Money Gap System
├── Content Command
├── Auto-Engage
├── Build
│   ├── Projects
│   ├── Workflows
│   ├── Assets
│   └── Knowledge Library
├── Intelligence
│   └── Agents (Coming Soon)
├── Spend & Usage
└── Settings
```

Sidebar is wide/labeled by default, fully toggleable to collapse for full-screen work.

## 4. Business Workspaces

### Shared OS
Cross-business orchestration, agent registry (future), research, dev/build tools, analytics.

### Clothing Brand
Product concepts, lookbooks, campaigns, Shopify catalog, content calendar, influencer outreach.

### AI-Cinematic
Cinematic video production for real estate, private jets, yachts, RVs, Airbnb listings.
Flagship workflow: Client Brief → Asset/Listing Upload → Creative Treatment → Shot List → Reference Frames → Image Generation → Image-to-Video → Clip Selection → Edit/Delivery → Case Study/Repurposing.

### Money Gap System
**Category:** Revenue Recovery and Business Systems.
**Core idea:** "Businesses do not always need more leads. They often need to stop losing the opportunities they already have."
**Primary audience:** HVAC and plumbing owners (primary), other local service businesses (secondary).
**The 7-part Money Gap System (functional areas, not automatic packages):**
1. Digital Storefront
2. Revenue Recovery
3. Reputation and Referral
4. Lead Nurturing
5. Missed Call Recovery
6. Sales Improvement
7. Growth Engine

**Master message:** "You may not need more leads. You may need to stop losing the ones you already have."
**Voice rules:** Direct, diagnostic, plain language, no hype, no em dashes, no fabricated stats/results/testimonials.
**Existing commercial offer (from prior memory):** $997/month, 15-minute setup call, live within 7 days. Audit lead magnet: 10 questions, captures name/email before showing results, results shown as ranges with opportunity language, honest disclaimer included.

**Workspace dashboard modules:**
```
Money Gap System Workspace
├── Gap Diagnostic (audit funnel status, new submissions)
├── Revenue Recovery Board (Missed Call Recovery, Lead Nurturing, Reputation & Referral)
├── Digital Storefront (website/listing status)
├── Sales Improvement
├── Growth Engine
└── Client Pipeline (setup call → 7-day live)
```

## 5. Content Command Module

Built from the "AI Content Machine" specification (source file: AI-CONTENT-MACHINE.md).

**Core pipeline:** POST → ADAPT → RESIZE → CAPTION → APPROVE → PUBLISH → TRACK → IMPROVE

**Structure:**
```
Content Command
├── Create (drop one post → generate every platform version)
├── Content Library (all drafts, versions, statuses)
├── Calendar (Today/Week/Month — both calendar AND Kanban views of same data)
├── Approvals (DRAFT → READY_FOR_REVIEW → APPROVED → SCHEDULED → PUBLISHED/READY_TO_POST)
├── Platforms (connection status: YouTube, Instagram, TikTok, Threads, Facebook, X, Pinterest)
└── Analytics (per-platform performance + content memory insights)
```

**Key architectural rules from source spec:**
- Content Analyzer extracts a single source of truth (core_idea, hook, key_points, facts_to_preserve) BEFORE any platform rewriting, to prevent "meaning drift" across adaptations.
- Platform adapters must produce genuinely platform-native output, never copy-paste between platforms.
- Every platform connector implements the same 4-method interface: `validateConnection()`, `publish()`, `getStatus()`, `getAnalytics()`.
- If a platform's API doesn't support publishing, content is saved as `READY_TO_POST` (a complete manual-post pack) — never falsely marked as published.
- Idempotency keys required on all scheduled posts to prevent duplicate publishing on retry.
- All social tokens encrypted server-side; never exposed to frontend code.
- **Default safety setting: `HUMAN_APPROVAL_REQUIRED=true`, `AUTO_PUBLISH=false`.** Both auto-publish and manual-approval modes must be built as toggleable, with manual approval as default.

**Tech stack referenced in source spec:** Next.js + TypeScript, Supabase/PostgreSQL, Vercel, cloud storage, platform APIs.

## 6. Auto-Engage Module (Mini Chat–style DM automation)

**Confirmed platforms: Instagram and Facebook only** — the only platforms with a realistic, approvable Meta Business/Messenger Platform path for keyword-triggered DM automation.

```
Auto-Engage
├── Keyword Triggers (e.g. comment "GUIDE" → auto-DM link/file)
├── Follow-Gate Rules (must follow first → then receive DM)
├── Flows (multi-step DM sequences)
├── Platform Rules (Instagram, Facebook)
└── Automation Log (who triggered what, when, what was sent)
```

**Compliance requirements:**
- Requires Business/Creator account linked to a Facebook Page.
- Requires Meta app review/approval for messaging permissions.
- Must respect Meta's 24-hour messaging response window.
- Build in draft/simulation mode first; apply for correct permissions before enabling live auto-DMs.

## 7. Spend & Usage Module

Tracks real money spent on OpenRouter (LLMs) and fal (image/video generation).

**Required displays:**
- Live remaining balance + 30-day spend for OpenRouter and fal separately.
- Per-model token usage and cost breakdown (Claude, GPT/Codex, Gemini, Grok, Kimi, etc.).
- Per-generation cost shown at the moment each image/video job runs (not just in aggregate reports).
- Agent usage ranking (once agents exist): which agents consume the most tokens/cost, ranked highest to lowest.
- Date range filter: today / 7 days / 30 days / all time.

## 8. Knowledge Library

```
Knowledge Library
├── My Businesses
│   ├── Clothing Brand (Brand Bible, Colors/Typography, Product Knowledge, SOPs, Approved Assets)
│   ├── AI-Cinematic (Service Offers, Creative Standards, Client Intake SOP, Shot Templates, Delivery SOPs)
│   └── Money Gap System (Master Brand Bible, System, Capabilities, Content Standards, Sales SOPs, Delivery Systems)
├── Client Businesses
│   └── [One folder per client] (Brand Kit, Brand Bible, Voice, Colors/Fonts/Logos, SOPs, Offers, Approved Assets)
├── Shared Playbooks (Website Build, AI-Cinematic Production, Content Creation, Lead Gen, Sales/Outreach, Automation SOPs)
├── Reference Vault (Research, Prompt Libraries, Model Guides, Tool Docs, Design References)
├── Design System
│   ├── Design DNA Skills (one locked style folder per design identity — see Section 9)
│   ├── Reconstruction Tests
│   └── In-Progress Codifications
└── Templates (Brand Bible, Client Onboarding, SOP, Website Brief, AI-Cinematic Brief)
```

**Client Brand Kit record structure:**
```
Business Name, Industry, Website/Social Links, Primary Contact, Logo Files,
Color Palette (Primary/Secondary/Neutrals/Usage Notes), Typography, Brand Voice,
Audience, Offers/Services, Brand Bible, SOPs, Approved Visual References,
Approved Copy Examples, Restrictions/Do-Not-Use Rules, Linked Projects/Assets
```

**Distinction rule:**
- Knowledge Library = durable business facts, SOPs, brand rules, reusable context.
- Projects = a defined piece of work with a goal, tasks, deadlines, deliverables.
- Assets = images, videos, logos, source media, exports, files.
- Workflows = reusable repeatable sequences.

## 9. Design DNA — "Lock This Style" System

Source: Notion page "Design DNA: One beautiful design into a permanent skill."

**Core principle:** A design loop finds one beautiful result. Design DNA codifies WHY it's beautiful into a permanent, testable, reusable skill — applicable to any output type (website, poster, motion graphic, carousel, deck, cinematic frame), not just static designs.

**The six things that carry a design's identity:**
1. Ratios, not raw numbers (e.g., "headline is 8x body, never under 6x")
2. Coverage percentages, not just color choice (60/30/10 vs 90/8/2 are different designs)
3. The one deliberate "weird move" / break in the system
4. Refusals (what the design deliberately does NOT use)
5. Absence as design decision (no shadows, no icons, no curves, etc.)
6. Named layouts/archetypes (so output #8 matches output #1 as a set)

**Two-file architecture:**
- `dna.json` — the full exhaustive record (for humans/build tools, any size, never enters a prompt)
- `PROMPT.md` — the model-facing payload (hard cap: 2KB, contains: reference image, one-line soul, the weird move, 3-9 signature moves as ratios, bans, palette/type roles+coverage only, archetype names, self-check tests last)

**Bans outperform instructions:** Negative constraints run on their own vector for image models and eliminate whole categories of bad output in one line; positive instructions are one weak vote against the model's training-data average.

**Mandatory validation step:** Reconstruct the original design from the spec alone, diff against the original, fold every gap back into the spec, repeat until indistinguishable. A spec never tested this way has never been tested.

**Skill folder structure:**
```
<style-slug>/
  SKILL.md        (how to use this style)
  PROMPT.md       (the 2KB payload)
  dna.json        (full record, never pasted into a prompt)
  reference/      (original reference image, kept forever)
  example/        (one worked/proven output)
  tools/check.py  (automated pass/fail tests, 8-12 minimum, binary/measurable)
```

**Build phase:** Phase 6-7 (requires an agent/model to run the 7-step codification process). Reserve the folder structure in Knowledge Library now; do not build the automated codification tooling in Phase 1.

**Future OS feature:** A "Lock This Style" button on any generated output in the creative canvas, which runs the codification process and saves the result directly into Knowledge Library → Design System.

## 10. External Repos and Their Confirmed Roles

| Repo | Role | Status |
|---|---|---|
| `NousResearch/hermes-agent` | Core agent runtime/harness — persistent memory, self-improving skills, gateway integrations (Telegram, etc.) | Phase 6 dependency |
| `AaravKashyap12/advise-project-approach` | Internal build-planning skill/standard (discovery → scope → architecture → plan → evals) | Use as planning method, not app framework |
| `AkuchiS/Yap` | Optional communications/voice experiment | Research later; not connected to OS core yet |
| `OSideMedia/higgsfield-ai-prompt-skill` | Creative-production discipline library (prompt rules, model guides, templates, benchmarks, vocab, ledger system) — adapt to fal, not Higgsfield itself | Use as knowledge base for AI-Cinematic + Design System |
| `msitarzewski/agency-agents` | Agent role template library (marketing, sales, research, engineering, design, product, PM divisions + machine-readable `divisions.json`/`tools.json`) | Reserve for Phase 6 agent-roster definition |

## 11. Core Architecture Principles

- **Your OS owns:** businesses, data, workflows, UI, permissions, assets, provider adapters.
- **Hermes runs:** specific agents, self-improvement/learning loops.
- **Obsidian stores:** durable, human-owned knowledge agents can retrieve and propose updates to (never silently overwritten by agents — approval-gated).
- **Supabase is:** the system of record for live app data, execution history, costs, logs.
- **OpenRouter routes:** all text/reasoning LLM calls (Claude, GPT/Codex, Gemini, Grok, Kimi).
- **fal handles:** all image/video generation (Nano Banana, Seedance, ChatGPT Image Model 2, etc.) through one unified API.
- Generic node/API naming (`text.generate`, `image.generate`, `video.generate`) so providers can swap without rebuilding the canvas.
- Long-running video/image jobs run through a durable job queue, not directly inside Vercel serverless functions.

## 12. Learning Loop (Agent Improvement Process)

```
Agent executes task
→ OS stores execution trace, model, cost, assets, result, approval/rejection (Supabase)
→ Agent identifies a reusable lesson
→ Agent creates a proposed skill/workflow update
→ User approves via OS or Telegram
→ Approved update written into Obsidian vault, versioned in Git
```

## 13. Mobile Access

- **Primary:** Telegram (bot-friendly, supports commands, media, group chats, approvals).
- **iMessage:** deferred to later phase; no official bot-friendly API, would require an iPhone Shortcuts bridge eventually.

## 14. Full Build Order (Phases)

1. **Foundation Shell** — layout, sidebar, business switcher, theme tokens, empty states. NO backend, NO agents, sample data only.
2. **Core Dashboard Experience** — Command Center home, workspace dashboards, projects/tasks, activity feed, notes, asset library UI, workflow canvas UI.
3. **Data and Login (Supabase)** — auth (if ever needed), businesses/workspaces/projects/tasks/assets/workflows/activity records, persistence.
4. **Workflows, Knowledge, and Assets** — workflow canvas build-out, reusable templates, asset upload/tagging/approvals, Obsidian vault connection, Content Command + Auto-Engage build.
5. **AI Generation Layer** — OpenRouter routing, fal image/video generation, Spend & Usage module, generation history/approval flow.
6. **Agents and Learning** — agent registry, Hermes integration, agency-agents role templates, task delegation, execution logs, approval gates, Design DNA codification tooling.
7. **Phone Access and Automation** — Telegram command interface, voice-note intake, approvals, scheduled reporting.

## 15. First Build Target (Phase 1 Scope)

```
Lazy Money OS Command Center
├── Sidebar (collapsible, wide/labeled default)
│   ├── Command Center
│   ├── Businesses (Shared OS / Clothing Brand / AI-Cinematic / Money Gap System)
│   ├── Projects
│   ├── Workflows
│   ├── Assets
│   ├── Knowledge Library
│   ├── Content Command (shell only)
│   ├── Auto-Engage (shell only)
│   ├── Spend & Usage (shell only)
│   ├── Agents (Coming Soon)
│   └── Settings
├── Business Switcher
├── Main Dashboard
│   ├── Daily focus / welcome card
│   ├── Priority projects
│   ├── Task progress
│   ├── Recent activity
│   ├── Quick actions
│   └── Placeholder agent status
└── Global Command Bar (search, create project, add task, start workflow, add asset)
```

## 16. Confirmed Design Decisions Log

- [x] Dark mode default, light mode available
- [x] Green `#166E16` background, black `#000000` + white `#FFFFFF` accents
- [x] Adaptive text color per background
- [x] Wide labeled sidebar, fully collapsible
- [x] Glassmorphism, ethereal/transparent (not smoky/opaque)
- [x] Executive control room × creative studio blend
- [x] No login/auth, single-user
- [x] All workspaces share one unified color system
- [x] `LM` monogram, sharp street-luxury style
- [x] Future agents get unique character-style avatars (not generic robot icons)
- [x] Auto-Engage limited to Instagram + Facebook
- [x] Both auto-publish and manual-approval modes built; manual approval is default

## 17. Open Questions (None Blocking Phase 1)

None currently blocking. All Phase 1 decisions are locked. Future phases will surface new questions as they're reached (e.g., specific agent names/personalities, Obsidian vault sync method, first client business to onboard into Knowledge Library).
