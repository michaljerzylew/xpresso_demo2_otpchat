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
- [ ] Phase 2: DOMAIN (7 answers distilled, sourced job list approved) [1/11]
- [ ] Phase 3: MODEL (Entities, fields, IndexedDB persistence target formalized) [1/11]
- [ ] Phase 4: COMPOSE (Module registration, route wiring, starter deletion) [1/11]
- [ ] Phase 5: SHAPE (5-class form implementations, screens registry) [1/11]
- [ ] Phase 6: SKIN (Theme configuration, PWA assets, icons) [1/11]
- [ ] Phase 7: BUILD (Thin E2E chat stream, breadth matrix completion) [1/11]
- [ ] Phase 8: EVIDENCE (Gate script, TypeScript check, unit & browser test sweep) [1/11]
- [ ] Phase 9: VERIFY (3-pass adversarial review) [1/11]
- [ ] Phase 10: SHIP (Cloudflare Worker deployment, DNS record, Access OTP application) [1/11]
- [ ] Phase 11: REPORT (Final release notes, GitHub repo publishing, v1.0.0 tag) [1/11]

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

---

## OPEN QUESTIONS
1. **Local Development Auth Simulation**: How should the Worker identify users when running locally via `vite` without Cloudflare Access?  
   *Assumption/Default*: Provide a fallback header simulator (`Cf-Access-Authenticated-User-Email: dev@milkies.me`) when running in `import.meta.env.DEV`. Test: verify `/api/me` returns mock user on localhost.
2. **Offline Mode for PWA**: Can previous chats be browsed offline without network access?  
   *Assumption/Default*: Yes, IndexedDB provides full offline read access; composer displays offline banner if network is disconnected.

---

## NEXT
Advance to DOMAIN phase: distill the 7 domain answers and specify the sourced job list.
