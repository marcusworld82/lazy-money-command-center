# Lazy Money OS Command Center — Master Build Spec (v2)

> This is the single source of truth for this project. Any future session, agent, or developer should read this file first before making architecture or design decisions. Do not rely on chat memory — rely on this document.
>
> **v2 changelog:** Corrected color hierarchy (black is now primary background; green is accent/highlight only, not the dominant fill). Corrected sidebar collapse button position. Added Settings API key/MCP placeholder requirement. This supersedes v1 on all points below — where v1 and v2 conflict, v2 is correct.

---

## 1. Identity

- **Name:** Lazy Money OS Command Center
- **Type:** Personal, single-user operating system for running multiple businesses
- **Auth:** None. Personal use only. No login, no teams, no client accounts in V1.
- **Temporary logo:** `LM` monogram, sharp street-luxury style
- **Visual direction:** Executive control room × creative studio blend, "Glassporium" aesthetic (ethereal/transparent glass panels, not smoky/opaque)
- **Theme modes:** Dark mode (default) and light mode

## 2. Brand Colors (CORRECTED — OS-wide, used everywhere, no per-workspace variation)

| Role | Hex | Usage |
|---|---|---|
| **Primary background** | `#000000` | Dominant fill for all major surfaces — page backgrounds, sidebar, panel fills. This is the base of the OS, not an accent. |
| **Accent / highlight** | `#166E16` | Used selectively: active nav states, buttons, borders on hover/focus, key metric numbers, progress indicators, highlight moments. NEVER used as a large background fill. |
| **Text / outline** | `#FFFFFF` | Primary text color, panel outlines, borders, dividers. |

**Critical correction from v1:** In the original spec, green was mistakenly treated as the dominant background color. That was wrong and has been corrected. **Black is the primary background. Green is strictly an accent/highlight color used sparingly** — the OS should read as a black command-center interface with green highlights and white text/outlines, not a green interface with black/white accents.

**Adaptive text rule:** Text is white (`#FFFFFF`) on black surfaces by default. On the rare light-mode or light-surface case, text switches to black. Implement as design tokens: `--color-background` (black), `--color-accent` (green), `--text-primary` (white), `--text-on-light` (black, light-mode only).

**Money Gap System's own external brand palette** (black `#000000`, white `#FFFFFF`, gray `#666666`, purple `#7F478F`/`#4A035C`) still applies ONLY to Money Gap's external marketing/website — it does NOT change the Money Gap workspace's appearance inside the OS, which stays identical to every other workspace under this corrected black/green/white system.

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

### Sidebar Behavior (CORRECTED)

- Default state: wide, labeled (icon + text visible)
- Must be fully collapsible/toggleable to an icon-only or fully-hidden state for full-screen work
- **The collapse/expand toggle control must be positioned at the TOP of the sidebar, directly adjacent to (or immediately below) the "Lazy Money OS" logo/wordmark — not at the bottom of the sidebar.** This was built incorrectly in Phase 1 and must be moved.
- Collapse state should persist across navigation (local state or localStorage)

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
**Existing commercial offer:** $997/month, 15-minute setup call, live within 7 days. Audit lead magnet: 10 questions, captures name/email before showing results, results shown as ranges with opportunity language, honest disclaimer included.

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

**Key architectural rules:**
- Content Analyzer extracts a single source of truth (core_idea, hook, key_points, facts_to_preserve) BEFORE any platform rewriting, to prevent "meaning drift" across adaptations.
- Platform adapters must produce genuinely platform-native output, never copy-paste between platforms.
- Every platform connector implements the same 4-method interface: `validateConnection()`, `publish()`, `getStatus()`, `getAnalytics()`.
- If a platform's API doesn't support publishing, content is saved as `READY_TO_POST` — never falsely marked as published.
- Idempotency keys required on all scheduled posts to prevent duplicate publishing on retry.
- All social tokens encrypted server-side; never exposed to frontend code.
- **Default safety setting: `HUMAN_APPROVAL_REQUIRED=true`, `AUTO_PUBLISH=false`.** Both modes must be built as toggleable, with manual approval as default.

**Note:** As of this v2 update, Content Command is built at the Phase 1 shell level only. Real functionality (Content Analyzer, platform adapters, live generation) is Phase 4. Absence of working generation/adaptation right now is expected, not a bug.

**Tech stack:** Next.js + TypeScript, Supabase/PostgreSQL, Vercel, cloud storage, platform APIs.

## 6. Auto-Engage Module (Mini Chat–style DM automation)

**Confirmed platforms: Instagram and Facebook only.**

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

**Build phase: Phase 4 (simulation mode), real Meta API wiring only after approval is obtained.**

## 7. Spend & Usage Module

Tracks real money spent on OpenRouter (LLMs) and fal (image/video generation).

**Required displays:**
- Live remaining balance + 30-day spend for OpenRouter and fal separately.
- Per-model token usage and cost breakdown (Claude, GPT/Codex, Gemini, Grok, Kimi, etc.).
- Per-generation cost shown at the moment each image/video job runs (not just in aggregate reports).
- Agent usage ranking (once agents exist): which agents consume the most tokens/cost, ranked highest to lowest.
- Date range filter: today / 7 days / 30 days / all time.

**Build phase: shell in Phase 1 (mock data, clearly marked as placeholder), real data in Phase 5.**

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

**Distinction rule:**
- Knowledge Library = durable business facts, SOPs, brand rules, reusable context.
- Projects = a defined piece of work with a goal, tasks, deadlines, deliverables.
- Assets = images, videos, logos, source media, exports, files.
- Workflows = reusable repeatable sequences (this is the "canvas"/"Spaces"-style feature — full build is Phase 4, shell-only in Phase 1).

## 9. Design DNA — "Lock This Style" System

**Core principle:** A design loop finds one beautiful result. Design DNA codifies WHY it's beautiful into a permanent, testable, reusable skill — applicable to any output type, not just static designs.

**The six things that carry a design's identity:**
1. Ratios, not raw numbers
2. Coverage percentages, not just color choice
3. The one deliberate "weird move" / break in the system
4. Refusals (what the design deliberately does NOT use)
5. Absence as design decision
6. Named layouts/archetypes

**Two-file architecture:**
- `dna.json` — full exhaustive record (never enters a prompt)
- `PROMPT.md` — model-facing payload (hard cap: 2KB)

**Skill folder structure:**
```
<style-slug>/
  SKILL.md
  PROMPT.md
  dna.json
  reference/
  example/
  tools/check.py
```

**Build phase:** Phase 6-7. Reserve the folder structure in Knowledge Library now.

## 10. External Repos and Their Confirmed Roles

| Repo | Role | Status |
|---|---|---|
| `NousResearch/hermes-agent` | Core agent runtime/harness | Phase 6 dependency |
| `AaravKashyap12/advise-project-approach` | Internal build-planning method | Use as planning method, not app framework |
| `AkuchiS/Yap` | Optional communications/voice experiment | Research later |
| `OSideMedia/higgsfield-ai-prompt-skill` | Creative-production discipline library | Knowledge base for AI-Cinematic + Design System |
| `msitarzewski/agency-agents` | Agent role template library | Phase 6 agent-roster definition |

## 11. Core Architecture Principles

- **Your OS owns:** businesses, data, workflows, UI, permissions, assets, provider adapters.
- **Hermes runs:** specific agents, self-improvement/learning loops.
- **Obsidian stores:** durable, human-owned knowledge (approval-gated agent updates).
- **Supabase is:** the system of record for live app data, execution history, costs, logs.
- **OpenRouter routes:** all text/reasoning LLM calls (Claude, GPT/Codex, Gemini, Grok, Kimi).
- **fal handles:** all image/video generation through one unified API.
- Generic node/API naming (`text.generate`, `image.generate`, `video.generate`).
- Long-running jobs run through a durable job queue, not directly inside Vercel serverless functions.

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

- **Primary:** Telegram (Phase 7)
- **Responsive web:** Same Vercel URL, fully responsive, no native app (Phase 8)
- **iMessage:** deferred indefinitely

## 14. Full Build Order (Phases)

1. Foundation Shell
2. Core Dashboard Experience
3. Data and Persistence (Supabase)
4. Workflows, Knowledge, Content Command, Auto-Engage
5. AI Generation Layer (OpenRouter + fal + Spend & Usage)
6. Agents and Learning (Hermes)
7. Mobile Access and Automation (Telegram)
8. Mobile-Responsive Web Experience

## 15. Settings Page Requirements (CORRECTED — clarified for Phase 1)

Phase 1 Settings must include, even though non-functional at this stage:

- Theme toggle (dark/light) — **must be fully functional in Phase 1**
- Sidebar behavior toggle
- **A visible "Connections & API Keys" section** with clearly labeled placeholder entries for: OpenRouter, fal, Supabase, Telegram, and a general "Connections/MCPs" area. Each entry should show a labeled input field or "Connect" button state, visually present but non-functional, with a small badge or note such as "Available starting Phase 5" so it reads as intentional, not broken or missing.

This section was underspecified in v1 and must be added/verified now if missing.

## 16. Confirmed Design Decisions Log

- [x] Dark mode default, light mode available
- [x] **Black `#000000` primary background; green `#166E16` accent/highlight only; white `#FFFFFF` text/outlines** (corrected in v2)
- [x] Adaptive text color per background
- [x] Wide labeled sidebar, fully collapsible
- [x] **Collapse toggle positioned at top of sidebar, near the logo** (corrected in v2)
- [x] Glassmorphism, ethereal/transparent (not smoky/opaque)
- [x] Executive control room × creative studio blend
- [x] No login/auth, single-user
- [x] All workspaces share one unified color system
- [x] `LM` monogram, sharp street-luxury style
- [x] Future agents get unique character-style avatars
- [x] Auto-Engage limited to Instagram + Facebook
- [x] Both auto-publish and manual-approval modes built; manual approval is default
- [x] Settings page includes visible (if non-functional) API key/connections section from Phase 1 onward

## 17. Guidance for Distinguishing "Not Built Yet" from "Bug"

Any page/feature belonging to a future phase (Workflows canvas, image/video generation, Agents, live social publishing) should display a small "Coming in Phase X" badge or empty-state message. This prevents confusion between intentional phase sequencing and actual build errors during review.

## 18. Open Questions

None currently blocking. Future phases will surface new questions as they're reached.
