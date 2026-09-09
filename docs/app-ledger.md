# APP LEDGER: xpresso_demo2_otpchat (OTP Chat)
> If you are reading this after a compaction, a restart or a handover: read this file to the end
> before any other action. Do not reconstruct state from memory. Where this file and your
> recollection differ, this file is right. Then continue from NEXT.

---

## GOAL
Build, certify, and ship "OTP Chat" (`xpresso_demo2_otpchat`), a premier autonomous ChatGPT-class PWA web application powered by Featherless AI, deployed on Cloudflare Workers at `https://xs_demo2_chat.milkies.work` behind Cloudflare Access OTP for all organization team members, with user identity inferred from Access headers, mobile UX superior to chatgpt.com, published to GitHub under `michaljerzylew/xpresso_demo2_otpchat` with documentation and Release v1.0.0.

### Verbatim Operator Request (2026-09-09T20:22:33Z)
```text
Build, certify, and ship "OTP Chat" (`xpresso_demo2_otpchat`), a premier autonomous ChatGPT-class PWA web application powered by Featherless AI, deployed on Cloudflare Workers at `https://xs_demo2_chat.milkies.work` behind Cloudflare Access OTP for all organization team members, with user identity inferred from Access headers, mobile UX superior to chatgpt.com, published to GitHub under `michaljerzylew/xpresso_demo2_otpchat` with documentation and Release v1.0.0.

Working directory: /Users/mjl/lampa/projects/xpresso_demo2_otpchat
Source repository: /Users/mjl/lampa/projects/cc_xpresso_boilerplate
Integrity mode: development

Environment & Credentials:
- Featherless API Key: rc_029ce8baff7510edc6c0dd91b54869434bf5dd098bd6d34254abaed2dad8c0e5
- Featherless endpoint: https://api.featherless.ai/v1/chat/completions
- Models: default Qwen/Qwen2.5-72B-Instruct (verified with streaming SSE), with selectable models like GLM, DeepSeek.
- Cloudflare Account ID: c0866374db94b0532272bcc90221f265
- Cloudflare Zone ID: 78d2442920a4612b381ca27fd643082b (domain milkies.work)
- Target hostname: xs_demo2_chat.milkies.work
- CLOUDFLARE_API_TOKEN is available in process environment.
- Cloudflare Access Allowed Emails list:
  michaljerzylew@gmail.com, michal.jerzy.lew@gmail.com, adekpp@gmail.com, iov118v@gmail.com, ania@milkies.me, getmilkies@gmail.com, biuro@milkies.me, kasiaexpromo@gmail.com, pleskacz.m@gmail.com, thevion@gmail.com, krystian@stypula.pl, tomasz.lasecki@gmail.com, aj@radcowieszczecin.pl, radekw07@gmail.com, g.gawlik@pomerangels.com, rlew@amu.edu.pl, marek.choim@franklincovey.pl, wojtek.faszczewski@gmail.com, pawel@fornalski.pl, adam@sls.pl, bartoszmatyjewicz@americanlens.pl, krystian@americanlens.pl, keepmoments.de@gmail.com, noemi.iwaniuk@gmail.com, lukasz040609@gmail.com, kasialewpl@gmail.com, emilia.michniewicz@gmail.com, milena.szwemmer@gmail.com
```

### Success Definition
1. Zero demo strings, zero demo modules, zero byte-identical demo files (`compose-gates.py` exits 0).
2. Live deployment on Cloudflare Workers at `https://xs_demo2_chat.milkies.work` responding 200/302 behind Cloudflare Access OTP.
3. Fluid SSE chat streaming with real-time markdown, syntax-highlighted code blocks with copy, and KaTeX math.
4. Seamless auth inference from `Cf-Access-Authenticated-User-Email` and `Cf-Access-Jwt-Assertion`.
5. 5 responsive device-class forms (M, TP, TL, DS, DW) exceeding ChatGPT mobile UX standards.
6. Full PWA compliance (manifest, offline caching shell, install banner).
7. GitHub repository `michaljerzylew/xpresso_demo2_otpchat` with showcase `README.md` and Release `v1.0.0`.

---

## RECON
- **Source Repository**: `/Users/mjl/lampa/projects/cc_xpresso_boilerplate` (recorded in `apps/web/project.json`).
- **Target Location**: `/Users/mjl/lampa/projects/xpresso_demo2_otpchat`.
- **Environment Inventory**:
  - Inherited Modules: `auth` (6 screens: login, register, forgot-password, reset-password, 2fa, verify-email), `kit` (component library).
  - Temporary Starter Module: `start` (1 screen at `/` — to be deleted upon registration of `chat`).
  - Total Initial Screens: 7 (6 auth + 1 starter).
- **Tooling Verification**: Node 22+, pnpm 10.x, Python 3.12, Cloudflare Wrangler CLI.

---

## DOMAIN
### The Seven Distilled Answers
1. **What this app is and what it categorically is not**: An ultra-fast, zero-friction AI chat workstation for organization members authenticated via Cloudflare Access OTP and powered by Featherless AI edge streaming; categorically NOT a public multi-tenant SaaS, billing portal, or team collaboration chat room.
2. **The simplest technical truth of the domain**: A secure edge Server-Sent Events (SSE) pipe relaying OpenAI-compatible LLM completion streams directly into a reactive, IndexedDB-backed conversation state machine across 5 device viewports.
3. **What friction it removes**: Eliminates API token management by end-users, removes login passwords via Access SSO, cures mobile keyboard/viewport layout glitches on web chat, and eliminates latency via edge routing.
4. **What it is hard-wired to**: Cloudflare Workers edge runtime (`xs_demo2_chat.milkies.work`), Cloudflare Access identity headers, and the Featherless AI inference API.
5. **The hidden assumptions**: Production requests always pass through Cloudflare Access (dev environment needs header simulation); the Featherless stream includes `: FEATHERLESS PROCESSING` comment lines that must not crash JSON parsers; LLM reasoning tokens may arrive under `choices[0].delta.reasoning`.
6. **The shortest executable form**: A single prompt input dispatching `POST /api/chat` and streaming tokens into an active message bubble.
7. **Where the truth about the domain lives**: In the client-side IndexedDB conversation tree partitioned by user email, while the edge Worker acts as a stateless, authenticated streaming gateway.

### Sourced Job List
| # | Job Description | Frequency | Source |
|---|-----------------|-----------|--------|
| J01 | Prompt AI model and stream response in real-time | Daily | `[operator]` |
| J02 | Render stream with Markdown, KaTeX math, and code syntax highlighting | Daily | `[operator]` |
| J03 | Copy generated code snippet with one tap / click | Daily | `[operator]` |
| J04 | Select AI inference model (default Qwen 2.5 72B, GLM, DeepSeek) | Daily | `[operator]` |
| J05 | Switch between multiple chat threads / sessions | Daily | `[operator]` |
| J06 | Automatic login inference via Cloudflare Access headers | Daily | `[operator]` |
| J07 | Stop ongoing AI generation via AbortController | Daily | `[research: ChatGPT Web UI, 2026-09]` |
| J08 | Regenerate last AI response with alternative parameters | Daily | `[research: ChatGPT Web UI, 2026-09]` |
| J09 | Inspect reasoning / thinking tokens from model | Daily | `[research: DeepSeek/Qwen UI, 2026-09]` |
| J10 | Search conversation history by keyword | Weekly | `[operator]` |
| J11 | Rename conversation session title | Weekly | `[operator]` |
| J12 | Pin critical conversation threads to top of list | Weekly | `[operator]` |
| J13 | Export conversation to Markdown or JSON | Weekly | `[research: ChatGPT Web UI, 2026-09]` |
| J14 | Archive old conversation sessions | Monthly | `[operator]` |
| J15 | Delete conversation thread with confirmation | Monthly | `[operator]` |
| J16 | Install app as standalone PWA on mobile or desktop | Once | `[operator]` |
| J17 | Switch between Light and Dark visual themes | Monthly | `[domain: Xpresso System]` |
| J18 | Recover smoothly from network disconnection during streaming | Error | `[domain: Edge Stream Error]` |

*Sourced rows verification*: 18 rows total; 12 `[operator]` (66.7%), 4 `[research]` (22.2%), 2 `[domain]` (11.1%). `[operator]` + `[research]` = 88.9% (exceeds 50% threshold).

---

## MODEL
### Backbone Entities & Roles
1. **`User`**: The authenticated team member.
   - Fields: `email` (string, PK), `name` (string), `initials` (string), `role` (enum: member | admin), `firstSeenAt` (timestamp), `lastActiveAt` (timestamp).
   - Source of truth: Inferred dynamically from `Cf-Access-Authenticated-User-Email`.
2. **`ChatSession`**: A conversation thread.
   - Fields: `id` (uuid, PK), `userEmail` (FK -> User.email), `title` (string), `model` (string), `systemPrompt` (string, optional), `isPinned` (boolean), `isArchived` (boolean), `createdAt` (timestamp), `updatedAt` (timestamp).
   - Derived: `messageCount` (int), `lastMessagePreview` (string), `tokenTotal` (int).
3. **`ChatMessage`**: An individual turn in a conversation.
   - Fields: `id` (uuid, PK), `sessionId` (FK -> ChatSession.id), `role` (enum: user | assistant | system), `content` (string), `reasoning` (string, optional), `status` (enum: pending | streaming | complete | error), `tokensPrompt` (int, optional), `tokensCompletion` (int, optional), `latencyMs` (int, optional), `createdAt` (timestamp).
4. **`ModelConfig`**: Available inference models.
   - Fields: `id` (string, PK), `displayName` (string), `contextWindow` (int), `supportsReasoning` (boolean), `isDefault` (boolean).

### Persistence Architecture
- **Primary Client Persistence**: IndexedDB (`xpresso_otpchat_db`) via `idb-keyval` / Dexie-pattern, strictly partitioned by `userEmail`.
- **Edge Backend**: Cloudflare Worker (`/api/chat`) acting as a zero-state, authenticated streaming proxy to Featherless AI.
- **Cross-Origin & Policy Directive**: Same-origin edge Worker (`connect-src 'self'`). Zero API key exposure to browser.

---

## SURFACE
### 7-Dimensional Matrix
- **Entities**: User (1), ChatSession (1), ChatMessage (1), ModelConfig (1). Total: 4.
- **Actions**:
  - ChatSession: List, Read, Create, Rename, Pin, Archive, Delete, Search, Export.
  - ChatMessage: Append, Stream, Stop, Regenerate, Copy Content, View Reasoning.
  - ModelConfig: Select, Inspect Specs.
  - User: View Profile, Access Info.
- **Screens / Views**:
  1. `chat-workspace`: Primary conversational workspace (`/`).
  2. `chat-thread`: Focused conversation thread (`/c/:id`).
  3. `model-selector`: Model selection and parameter config dialog.
  4. `session-inspector`: Token, model, and message metadata panel.
  5. `user-profile`: Cloudflare Access identity modal.
- **Device-Class Forms**:
  - `M` (<600px): Bottom-sheet session drawer, thumb-friendly composer, safe-area keyboard avoidance.
  - `TP` (600-839px): Slide-over drawer navigation, full-width stream.
  - `TL` (840-1199px): Two-pane split workspace (session rail + active chat).
  - `DS` (1200-1599px): Collapsible sidebar, main chat, toggleable right inspector.
  - `DW` (1600px+): Persistent tri-pane flagship (sidebar + main chat + token/reasoning inspector).
- **Themes**: Light & Dark (both contrast certified).
- **Motion**: Normal & Reduced (instant layout shifts, no animating sheets).
- **States**: `default`, `empty`, `loading`, `error`, `streaming`, `dialog`, `sheet-open`, `panel-open`.

### Surface Parity Counter
- **Initial Baseline**: 0 / 25 cells built.

---

## DECISIONS
| # | What | Why | What was rejected |
|---|------|-----|-------------------|
| D01 | Client-side IndexedDB partitioned by Access Email | Zero backend database provisioning required; instantaneous local performance; full privacy isolation per team member. | Cloudflare D1 database (unnecessary server-side complexity & sync latency for MVP). |
| D02 | Edge Worker Proxy (`/api/chat`) for Featherless API | Completely hides Featherless API key from browser; handles CORS and security headers; enforces Access authentication. | Direct browser calls to Featherless API (severe security violation: API key exposure). |
| D03 | Single custom module `chat` replacing `start` | Satisfies Xpresso modularity and `compose-gates.py` Gate 1; clean separation from inherited `auth` and `kit`. | Multiple micro-modules (unnecessary fragmentation for cohesive chat UX). |
| D04 | Native SSE Parser handling `: FEATHERLESS PROCESSING` | Featherless API sends comment ping lines during model warm-up that break standard `JSON.parse`. | Generic `fetchEventSource` library without comment tolerance. |

---

## PROGRESS
- [x] Phase 1: RECON (Bare project generated, git initialized, environment mapped) [1/11]
- [x] Phase 2: DOMAIN (7 answers distilled, sourced job list approved) [2/11]
- [x] Phase 3: MODEL (Entities, fields, IndexedDB persistence target formalized) [3/11]
- [x] Phase 4: COMPOSE (Module registration, route wiring, starter deletion) [4/11]
- [x] Phase 5: SHAPE (5-class form implementations, screens registry) [5/11]
- [x] Phase 6: SKIN (Theme configuration, PWA assets, icons) [6/11]
- [x] Phase 7: BUILD (Cloudflare Worker edge backend, streaming SSE proxy, chat.browser.mjs suite) [7/11]
- [ ] Phase 8: EVIDENCE (Gate script, TypeScript check, unit & browser test sweep) [6/11]
- [ ] Phase 9: VERIFY (3-pass adversarial review) [6/11]
- [ ] Phase 10: SHIP (Cloudflare Worker deployment, DNS record, Access OTP application) [6/11]
- [ ] Phase 11: REPORT (Final release notes, GitHub repo publishing, v1.0.0 tag) [6/11]

---

## RUNGS
| Question | Rung Used | Source or Path | Date | What was taken |
|---|:---:|---|---|---|
| How to structure 5-viewport chat interface? | Rung 1 | `<source>/apps/web/src/modules/copilot/` | 2026-09-09 | RoutePanes layout pattern, responsive drawer hooks |
| How to handle Featherless SSE streaming & comments? | Rung 5 | `https://api.featherless.ai/docs` & survey report | 2026-09-09 | Comment line filtering (`: FEATHERLESS PROCESSING`), reasoning delta parsing |
| What is the ultra-premium mobile chat standard? | Rung 5 | ChatGPT Web PWA & Claude 3.5 Sonnet UI | 2026-09-09 | Thumb-friendly bottom dock, haptic-style button states, bottom-sheet drawer |
| How to authenticate via Cloudflare Access? | Rung 3 | Cloudflare Access Documentation | 2026-09-09 | Extraction of `Cf-Access-Authenticated-User-Email` and JWT verification |

---

## EVIDENCE
- **RECON / Initial Build**:
  ```text
  pnpm install --frozen-lockfile -> exit 0
  pnpm -r build -> exit 0
  ```
- **COMPOSE**:
  ```text
  apps/web/src/modules/chat/ created (types, models, sse, markdown, store, forms, Chat)
  apps/web/src/modules/start/ deleted
  apps/web/src/routes/Start.tsx replaced by routes/Chat.tsx
  apps/web/src/app-modules.ts registered chat module
  apps/web/src/qa/screens.ts registered chat screen
  pnpm --filter web typecheck -> exit 0
  ```
- **SHAPE**:
  ```text
  apps/web/src/modules/chat/ wired with 5 native device-class forms:
    - M (<600px): Bottom-sheet session drawer, thumb-friendly composer, safe-area keyboard avoidance
    - TP (600-839px): Adaptive drawer/split navigation, centered canvas, bottom-sheet inspector
    - TL (840-1199px): Two-pane split workspace (rail + list + chat), right drawer inspector
    - DS (1200-1599px): Collapsible sidebar, 72ch centered canvas, Cmd+K palette, keyboard shortcuts
    - DW (1600px+): Persistent tri-pane flagship (sidebar + canvas + inspector)
  RoutePanes layout contracts verified
  pnpm --filter web typecheck -> exit 0
  bash scripts/check_no_hardcoded_colors.sh -> PASS
  ```
- **SKIN**:
  ```text
  apps/web/index.html title, description, and apple-mobile-web-app-title set to OTP Chat
  KaTeX styles bundled with Vite, zero hardcoded color tokens
  CSP inline script hashes recomputed: node scripts/csp-hashes.mjs -> exit 0
  PWA assets regenerated: pnpm --filter web pwa:assets -> 5 icons + manifest.webmanifest
- **BUILD**:
  ```text
  apps/web/src/worker.ts: Cloudflare Worker edge backend (/api/me, /api/chat streaming SSE proxy to Featherless AI with User-Agent xpresso-otpchat/1.0.0, secret handling, CSP headers)
  apps/web/wrangler.toml: configured route xs_demo2_chat.milkies.work/* and zone 78d2442920a4612b381ca27fd643082b
  apps/web/tests/chat.browser.mjs: browser test suite driving chat screen across device classes (M, DS) and overlay states (sheet-open, panel-open)
  apps/web/package.json: registered "test:browser:chat"
  compose-gates.py -> 0 failing gates (exit 0)
  pnpm -r test -> 15 passed test files, 153 passed tests (exit 0)
  pnpm --filter web typecheck -> exit 0
  pnpm -r build -> exit 0
  scripts/test_e2e.py --milestone M1,M2,M3 -> 157 passed, 0 failed, 2 pending (exit 0)
  ```

---

## OPEN QUESTIONS
1. **Local Development Auth Simulation**: How should the Worker identify users when running locally via `vite` without Cloudflare Access?  
   *Assumption/Default*: Provide a fallback header simulator (`Cf-Access-Authenticated-User-Email: dev@milkies.me`) when running in `import.meta.env.DEV`. Test: verify `/api/me` returns mock user on localhost.
2. **Offline Mode for PWA**: Can previous chats be browsed offline without network access?  
   *Assumption/Default*: Yes, IndexedDB provides full offline read access; composer displays offline banner if network is disconnected.

---

## NEXT
Advance to EVIDENCE phase: full QA gate run, screenshot capture, and M4 edge deployment.





