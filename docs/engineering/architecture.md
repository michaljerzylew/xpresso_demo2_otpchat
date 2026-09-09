# Architecture

## In 10 lines
1. `AGENTS.md` is the single constitution; `CLAUDE.md`, `GEMINI.md`, `.cursorrules` are relative symlinks to it (mode 120000).
2. `SOUL.md` = identity and the 17-faculty ambient MIND; `USER.md` = the owner's profile and communication covenant; `TOOLS.md` = the machine.
3. Memory is two Markdown channels: `MEMORY.md` (curated invariants, under 250 lines) and `memory/YYYY-MM-DD.md` (daily journal). No database, no daemon.
4. `skills/<name>/SKILL.md` (+ optional `scripts/`, `tests/`) are discovered through `.skills`, `.claude/skills`, `.agents/skills` symlinks.
5. `scripts/verify_*.py`, `audit_branding.py`, `test_all_skills.py`, `scan_secrets.py` are the local verification suite (Python 3.12, standard library).
6. `.githooks/pre-push` runs the secret scan; `scripts/install_hooks.sh` wires it.
7. `.github/` holds Issue/PR/RFC templates, `labels.yml` (closed taxonomy), `CODEOWNERS` (convention), and a `workflows/` folder that stays empty.
8. `docs/` is the documentation tree with `docs/README.md` as the only index; `docs/decisions/` holds ADRs.
9. GitHub objects: one Project (v2) with Status/Priority/Area/Size/Agent fields and 4 views; Milestones = versions; Discussions for RFC/Decisions/Agents/Q&A/Announcements.
10. The process itself is a skill: `skills/github-agentic-project-management/` (SKILL, WORKFLOW, TEMPLATES, FREE-TIER, LEARNINGS, scripts).

## Data flow of a change
```
Issue (template, labels, milestone, Project=Ready)
  -> branch type/#N-slug
  -> commits (pre-push: scan_secrets.py)
  -> PR (template, "Tested locally", Closes #N, Project=In review)
  -> review COMMENT by another agent: VERDICT: APPROVED
  -> execution report comment on the Issue
  -> squash merge (one commit on main, branch deleted, Issue closed, Project=Done)
  -> CHANGELOG Unreleased / README / docs updated in the same PR
  -> release PR at milestone end: tag vX.Y.Z + GitHub Release
```

## Repository layout (authoritative)
```
.
├── AGENTS.md  CLAUDE.md->AGENTS.md  GEMINI.md->AGENTS.md  .cursorrules->AGENTS.md
├── SOUL.md  USER.md  TOOLS.md  MEMORY.md  memory/YYYY-MM-DD.md
├── README.md  RULES.md  CHANGELOG.md  LICENSE.md  SECURITY.md  DATA-AND-PRIVACY.md
├── PROJECT.md  SKILLS_MANIFEST.md  ORIGINAL_REQUEST.md  TEST_INFRA.md
├── .github/  (ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE.md, DISCUSSION_TEMPLATE, labels.yml, CODEOWNERS, workflows/README.md)
├── .githooks/pre-push
├── package.json  pnpm-workspace.yaml  pnpm-lock.yaml
├── apps/web/  (Vite SPA, React Router, Workers asset entry)
├── packages/  (xp-core, xp-runtime, xp-primitives, xp-shells, xp-blocks, xp-theme, xp-motion)
├── docs/  (README.md index, product/, engineering/, decisions/, runbooks/, agents/)
├── scripts/  (verify_*.py, audit_branding.py, test_all_skills.py, scan_secrets.py, install_hooks.sh, sync_labels.sh)
└── skills/  (33 skill packages; .skills, .claude/skills, .agents/skills point here)
```

## Why these choices
Each non-obvious choice has an ADR in `docs/decisions/`. Start with 0001 (squash) and 0002 (GitHub as the only PM system).

## Product package map

| Path | Package | Responsibility |
|---|---|---|
| `apps/web` | `web` | Vite 6 + React 19 SPA, strict TypeScript, Tailwind 4 Vite plugin, React Router 7 library routes, Workers asset entry |
| `packages/xp-core` | `@xp/core` | Token and style generation, layout algebra, manifest schemas and validation |
| `packages/xp-runtime` | `@xp/runtime` | Device-class policy, input tokens, React context and interaction locks |
| `packages/xp-primitives` | `@xp/primitives` | React primitives; device-class exports share the runtime context |
| `packages/xp-shells` | `@xp/shells` | Navigation, app bars and shells built on primitives |
| `packages/xp-blocks` | `@xp/blocks` | Composed UI blocks built on primitives |
| `packages/xp-theme` | `@xp/theme` | Semantic colours, fonts, shadows, metric multipliers, presets and runtime mode ([guide](theming.md)) |
| `packages/xp-motion` | `@xp/motion` | GSAP primitives, gesture physics, reduced-motion hooks and generated CSS motion tokens |

The web workspace depends on all six packages. pnpm builds dependencies before the web app; `@xp/core` generates `tokens/dist` and `styles/dist`, then `@xp/theme` generates default theme CSS and metric adapters in its `dist`. These outputs are kept locally but ignored by Git, as is `apps/web/dist`. A fresh clone uses `pnpm i && pnpm dev` or `pnpm build` to generate them.

`src/main.tsx` starts theme-mode synchronization and mounts `BrowserRouter`; `src/App.tsx` defines `/`, `/inbox` and `/settings` under one app shell. The app-specific shell renders a handwritten semantic `<header>` (it does not use the exported `AppBar`), composes its own `@xp/motion` sheet and bottom-region arbitration, then allocates local `xp-slot` panes. `@xp/runtime` supplies one shared context for shell forms and primitive interaction locks. See [device classes](device-classes.md). The CSS entry preserves the import order: Tailwind, core, core Tailwind theme, primitives, the shells region protocol, app shell CSS, app route CSS, app PWA CSS, theme defaults, theme Tailwind mappings, then app `styles/theme.css`. Theme custom properties resolve at use time, including in the earlier shell and route rules. Only the CSS this app renders is imported: the vendored shell and block skins stay on disk for the design kit but never enter the bundle, because the app renders its own shell and three primitives (Issue #74). Tailwind runs with `source(none)` and an explicit `@source` list covering `apps/web/src` and the package sources the app bundles, so a vendored file cannot add utilities the app never asks for. Everything here styles with semantic classes, so the utility layer is near-empty by design. The build inlines the entry stylesheet into `index.html` and the app ships no render-blocking stylesheet request; `pnpm --filter web size:css` reports the payload and fails over 60 kB gzipped.


`apps/web/wrangler.toml` targets `xs_boilerplate.milkies.work/*` and binds `./dist` as `ASSETS` with SPA fallback. `src/worker.ts` forwards requests to that binding. Configuration is present; no production deployment or DNS changes are part of Issue #35.

Each vendored package has `PROVENANCE.md` with the source commit and excluded studio-only tests. The remaining local tests and manifest checks do not require the studio checkout. Stack and vendoring rationale: ADR [0009](../decisions/0009-vite-spa-on-workers.md) and [0010](../decisions/0010-vendor-xpresso-packages.md).

```bash
pnpm install
pnpm -r build
pnpm --filter web typecheck
pnpm --filter web build
pnpm -r test
```

`pnpm -r build` before `pnpm -r test` is not optional: the theme package's suite reads its own
`dist/theme.css`, so on an unbuilt tree it fails first and `pnpm -r` stops there before the web
package's tests run at all.

The web Vitest suite renders all three routes across all five classes through React's server renderer and enforces the route viewport boundary. It verifies integration, not browser layout. Runtime Vitest tests also exercise token publication and interaction locks in jsdom; Playwright is the separate browser evidence harness.

The shell imports `@xp/motion` eagerly (GSAP, Flip, ScrollTrigger and CustomEase ship in the entry chunk because every route transition, sheet and press uses them); `/motion` lazy-loads only the small self-contained demo page. `@xp/motion` follows the source-export build convention and generates its ignored `styles/motion.css`; the root dev command builds it before Vite starts. The doctrine and the wired shell behaviour are documented in [motion-doctrine.md](motion-doctrine.md) and [motion-wiring.md](motion-wiring.md).

For repeatable performance evidence, run `pnpm -r build`, start `pnpm --filter web preview --host 127.0.0.1 --port 4380`, then run `pnpm --filter web test:shell-fps` for the real shells (M route transitions and the M sheet drag) and `pnpm --filter web test:motion-fps` for the `/motion` lab. The harness uses system Chrome at 4x CPU throttle, checks active transform changes, counts rAF intervals only during panel transitions and a continuous sheet drag, and saves JSON plus responsive screenshots in ignored `apps/web/evidence/`. Both averages must be at least 58 fps in each harness. `pnpm --filter web test:browser:shell` checks the wired behaviour itself (direction, keyboard bypass, gesture, focus return, reduced motion) against a served app; see [motion wiring](motion-wiring.md). The counter measures callback cadence, not compositor presentation timestamps or physical-device smoothness.

## Verification
```
/opt/homebrew/bin/python3.12 scripts/verify_symlinks.py
/opt/homebrew/bin/python3.12 scripts/verify_memory.py
/opt/homebrew/bin/python3.12 scripts/verify_skills.py
/opt/homebrew/bin/python3.12 scripts/audit_branding.py --strict-nova
/opt/homebrew/bin/python3.12 scripts/test_all_skills.py
/opt/homebrew/bin/python3.12 scripts/scan_secrets.py --range origin/main..HEAD
```

## Application manifest and generation modes

`scripts/create_project.sh <name> <dir> [--template aidesk] [--with-demo]` creates a bare app by default.
The bare app has Start, six account routes, Configure, the kit library and all seven packages. It has no domain modules or records.
`--with-demo` copies the reference application; use it to study implementation, never as a product base.
Both modes record the absolute source checkout and a boolean `demo` in `apps/web/project.json`.

`src/app-modules.ts` is the registration seam. Each module declares its route prefixes, navigation sections and anatomy,
source prefix and QA producer. The manifest exports modules, secondaryTitles, sections, brand, the session subscription hook,
sourcePrefixes, and qa (perfScreen, perfRoutes, states). The generic shell and QA harness consume these declarations.
Adding a module means its directory, routes, registry entries and one manifest registration; no shell or harness branch is needed.
The manifest also owns auth destinations and PWA shortcuts so removing a domain cannot leave hidden redirect or install links.

`scripts/qa/common.mjs` owns serving, device sizes, waits and generic state setup. Module producers are loaded from the manifest
only when requested. The reference producer named by the manifest is omitted from bare output; auth has a reusable
producer of its own. The performance probe consumes the same manifest and exercises three real routed destinations.

`data/graph.ts` owns the application's vocabulary and initial entities. The session graph engine and React store import it;
domain operations belong to modules. Work's issue reconciliation and projections live in `modules/work/graph.ts` and
`modules/work/session.tsx`. Bare templates live under `scripts/bare/`, with explicit project-name/source placeholders.
The generator copies templates rather than rewriting reference components. Reference screenshots and domain tests are omitted;
generic guards and auth/theme interaction suites remain. The three reference product documentation pages get bare counterparts.
