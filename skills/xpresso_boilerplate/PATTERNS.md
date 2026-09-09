# PATTERNS.md: the nine HARBOR modules as reference implementations

**Read this before building any pattern.** Every anchor below was verified on v2.0.0 and re-checked
for v3.0.0. Inventing something a module already solves is a defect, not initiative: it costs a
review round, it drifts from the shell contract, and it re-introduces defects this codebase already
paid for. Copying the module is the other defect: its nouns, seed and copy belong to a hospitality
demo, and §8 of `SKILL.md` counts every byte-identical file and every demo string in your tree.

**Where these files are.** Since v3.0.0 a generated project does not contain HARBOR. Every path
below is relative to `apps/web/src/` **in the source checkout**, whose absolute path is the `source`
field of your project's `apps/web/project.json`. Read there; write in your own project. The parts
you build with (`@xp/*`, `modules/kit`, the shell) are in both trees and identical.

HARBOR is not a decoration on the boilerplate. It is nine module directories (seven product modules
plus `auth` and the `kit` library, which also ship in every bare project), 88 registered screens
and about 10,000 certified screen-class-theme-state cases of working answers to the questions your app
is about to ask. Treat it as the library you read, not the inventory you ship.

Two facts about the registry before you use it: it carries **ten** module ids, because `settings`
labels two shell-owned routes (`/settings` and `/configure`) and has no module directory of its own;
and the filter accepts any id present in the registry, since the known set is derived from it
(`scripts/qa/capture.mjs:42`).

## The one structural idea to copy first

Every module declares its **per-device-class form vocabulary as executable data** in
`modules/<name>/forms.ts`, and every screen reads that table. No screen reads a viewport.

| Module | Form table | Screen reads it at |
|---|---|---|
| calendar | `modules/calendar/forms.ts:96` (`forms`), `:120`, `:141` | `modules/calendar/Calendar.tsx:33` via `resolveForm` |
| inbox | `modules/inbox/forms.ts:39` (`descriptors`), derived `:69` | `modules/inbox/components.tsx:52` (`useInboxForm` `:35`) |
| venue | `modules/venue/forms.ts:40` (`base`) + `:53` → `:60` | `modules/venue/components.tsx:48` |
| work | `modules/work/forms.ts:6` (`anatomy`) → `:13` | `modules/work/WorkScreen.tsx:24` |
| offers | `modules/offers/forms.ts:40` (`screenForms`), ladders `:27`-`:30` | `modules/offers/Frame.tsx:19` |
| home | `modules/home/forms.ts:7` (`anatomy`), `:14` → `:21` | `modules/home/shared.tsx:22` |
| copilot | `modules/copilot/forms.ts:3` → `:13` | `modules/copilot/shared.tsx:42` |
| kit | `modules/kit/forms.ts:3` | `modules/kit/Kit.tsx:64` |
| auth | `modules/auth/forms.ts:6`, `:17` (`registrationForms`) | `modules/auth/AuthScreen.tsx:28`, `shell/AuthShell.tsx:28` |

Paths are relative to `apps/web/src/`.

**The inspector ladder is identical in seven modules. Copy it verbatim:**
`M: sheet, TP: sheet, TL: drawer-side, DS: toggle-pane, DW: persistent-pane`
(`inbox/forms.ts:67`, `offers/forms.ts:27`, `work/forms.ts:6`, `home/forms.ts:8`,
`copilot/forms.ts:4`, `kit/forms.ts:4`, `venue/forms.ts:41`).

**Your app does the same thing:** one `forms.ts` per module directory with the class table, one hook that
resolves it, zero viewport reads in route content.

## Pattern to reference implementation

Paths relative to `apps/web/src/`. Where two modules solve a pattern, the pick is the generic one.

| # | Pattern | Copy from |
|---:|---|---|
| 1 | Per-class form vocabulary as data | `modules/calendar/forms.ts:96` (the richest table: 19 fields per class row); base+overrides variant `modules/venue/forms.ts:53` |
| 2 | List + detail panes | `modules/inbox/components.tsx:81` |
| 3 | Three-pane workspace (list + detail + inspector) | `modules/inbox/forms.ts:73` with `shell/AppShell.tsx:452` |
| 4 | Per-screen pane override | `modules/offers/Track.tsx:64`, override at `modules/offers/forms.ts:51` |
| 5 | Conversation transcript | `modules/inbox/components.tsx:302` |
| 6 | Message composer (tabs, tools, suggestions) | `modules/inbox/components.tsx:361` |
| 7 | Streaming assistant reply with Stop | `modules/copilot/store.tsx:29`, control `modules/copilot/shared.tsx:81` |
| 8 | Attachments (pick, list, remove, revoke) | `modules/copilot/shared.tsx:82`; persisted variant `data/harbor-session.ts:76` |
| 9 | Saved replies / snippet insertion | `modules/inbox/SavedReplyPicker.tsx:8`, expansion `modules/inbox/saved-reply.ts:8` |
| 10 | Month grid with cell overflow | `modules/calendar/views.tsx:26`, per-class capacity in the class rows at `calendar/forms.ts:97-101` |
| 11 | Week / day hour grid | `modules/calendar/views.tsx:78` |
| 12 | Agenda list with day headings | `modules/calendar/views.tsx:235` |
| 13 | Drag to create a range | `modules/calendar/views.tsx:120`, class gate in the same rows, `calendar/forms.ts:97-101` |
| 14 | Floor plan / spatial canvas | `modules/venue/components.tsx:165` |
| 15 | Board / kanban | `modules/venue/components.tsx:243`; screen-specific `modules/work/WorkScreen.tsx:118` |
| 16 | Table with numeric columns | `modules/kit/components.tsx:72` + `modules/offers/Transactions.tsx:32` |
| 17 | Sortable table with typed accessors | `modules/inbox/screens/Tickets.tsx:164` |
| 18 | Record deck / pager on compact classes | `modules/work/forms.ts:29` + `modules/work/WorkScreen.tsx:117` |
| 19 | Swipeable one-at-a-time deck | `modules/venue/components.tsx:223` |
| 20 | Section chip strip that scroll-aligns its current chip | `shell/AppShell.tsx:38` (scroll-padding arithmetic, not a rail primitive; for a real snap rail use `SnapRail`, `packages/xp-primitives/src/snap-rail.tsx:201`) |
| 21 | Wizard / multi-step flow | `modules/offers/Book.tsx:33` + `modules/offers/components.tsx:262` |
| 22 | Two-step form on compact classes only | `modules/auth/AuthScreen.tsx:70`, gate `auth/forms.ts:17` |
| 23 | Payment / checkout | `modules/offers/Book.tsx:126`, commit `:56` |
| 24 | Inspector folds | `modules/kit/components.tsx:25`; compact-only variant `modules/inbox/components.tsx:258` |
| 25 | Popover menu with roving keyboard focus | `modules/kit/Kit.tsx:96` |
| 26 | Sheet / dialog / popover as one API | `shell/KitLayer.tsx:18`, class picks the surface `:26` |
| 27 | Bottom sheet primitive | `shell/Sheet.tsx` (shell-owned; reach it via `KitLayer` or `RoutePanes`) |
| 28 | Skeleton loading | `modules/inbox/components.tsx:170` (carries `data-kit-state="loading"`) |
| 29 | Empty / loading / error surface | `modules/kit/components.tsx:56` (shared `State`) |
| 30 | Per-screen recovery copy as data | `modules/work/emptyStates.ts`, consumed `modules/work/WorkScreen.tsx:95` |
| 31 | Search / filter / sort toolbar | `modules/inbox/components.tsx:185` (folds on compact) |
| 32 | Chip filters with counts, disabled at zero | `modules/offers/Frame.tsx:66`; honest null-counts case `:57` |
| 33 | Saved view / persisted filter set | `modules/work/WorkScreen.tsx:45` resolves the view, `:55` and `:59-60` hold the persisted set with its params-then-saved-then-view precedence, `:63` applies it |
| 34 | Tag editing | `modules/inbox/components.tsx:504`, chip `modules/kit/components.tsx:16` |
| 35 | Notifications centre | `modules/work/WorkScreen.tsx:139` |
| 36 | Settings form (section, fold, save bar) | `modules/inbox/components.tsx:246` (reused across 11 settings screens) |
| 37 | Auth flows (six of them, one component) | `modules/auth/AuthScreen.tsx:22`, layout `shell/AuthShell.tsx:28` |
| 38 | Error pages 401/403/404/500/maintenance | `modules/home/ErrorPage.tsx:15`, form row `home/forms.ts:14` |
| 39 | Destructive confirm | `modules/work/WorkScreen.tsx:158` |
| 40 | Toast | `modules/kit/components.tsx:63` |
| 41 | KPI / stat tiles | `modules/venue/components.tsx:82`; collapse-to-one-line `modules/inbox/components.tsx:207` |
| 42 | Cross-module record links | `modules/home/shared.tsx:15` (`EntityLink` over `EntityRef`) |
| 43 | CSV download | `modules/home/shared.tsx:44` |
| 44 | Module-owned write facade over a shared store | `modules/venue/session.ts:5` |
| 45 | Graph reconciliation on write | `modules/work/graph.ts:9` (the reconciliation moved beside Work in v3), throws on a missing target `:17` |

If your pattern is not in this table, it is either a variation of one of these (adapt the nearest) or
genuinely new (then §5 of `SKILL.md`: studio, then research the current premium standard).

## The modules in one line each

| Module | Route prefix | What it is the best example of |
|---|---|---|
| work | `/work` | Planning surfaces: boards, lists, decks, saved views, notifications, destructive confirm, per-screen recovery copy |
| inbox | `/inbox`, `/tickets`, `/contacts` | The AIDESK-class three-pane conversation workspace: transcript, composer, folds, tags, skeletons, settings forms |
| home | `/`, `/settings/*`, `/reports` | Dashboard, workspace settings, members and roles, notices, error pages, cross-module links, CSV export |
| venue | `/venue/*` | Spatial and operational surfaces: floor plan, service day, board, swipe deck, KPI tiles, write facade over a shared store |
| offers | `/offers/*`, `/me/*` | Commerce: catalogue, filters with counts, wizard, payment, tracking, transactions, account screens |
| copilot | `/copilot/*` | Assistant: streaming replies, attachments with correct object-URL lifetime, source cards drawn from every module |
| calendar | `/calendar/*` | Time: month, week, day, agenda, drag-create, event sheet, per-class capacity numbers |
| auth | `/auth/*` | Six flows in one component, paged on compact classes, its own shell. **The only module that does not use `RoutePanes`**: it mounts under `AuthShell` and its per-class forms are switched in the shell (`shell/AuthShell.tsx:28`), not in the screen |
| kit | `/kit` | The component library itself: tables, folds, popovers, toasts, chips, states, and the five-form policy per component |

## Shell contract

A module plugs into the shell, never around it. Read `shell/AppShell.tsx` before extending anything.

- **Route panes.** Compose the app-local `RoutePanes` (`shell/AppShell.tsx`) with `list`, `children`,
  `inspector`, `detailOpen`, and optionally `inspectorLabels`, `inspectorActions`. On M,
  `detailOpen=false` shows the list; selection sets it true; a visible Back action is mandatory.
  `RoutePanes` is app-local and is not exported by `@xp/shells`.
- **Navigation.** A module either owns its route tree (and gets its own section navigation) or lives
  on shared routes (and gets the shell's). Everything the shell knows about modules lives in one
  manifest, `apps/web/src/app-modules.ts`: the `modules` registrations (id, label, path, icon,
  prefixes, dock, `sourcePrefix`, `qaStates` and the section resolver), `secondaryTitles` for routes
  that are not a module's own, the `sections` map, `brand`, the session hook, `qa` and `pwa`.
  `shell/navigation.ts` and `shell/sections.ts` are generic resolvers over that manifest and are
  never edited to add a module; `AppShell` imports the manifest and nothing else.
- **Per class.** M gets the five-tab dock plus a More sheet. TP gets the top-bar title as the module
  sheet trigger. TL gets the icon rail and a section strip in the list pane. DS gets the sidebar with
  the module and section tree. DW gets rail, section sidebar, content and a persistent inspector.
  Doctrine: `docs/product/vision.md` §3. Measurements: `DESIGN.md`.
- **Motion.** Reuse the shell's bindings (route, press, sheet, FLIP, stagger, arrival). Never bind a
  second press or sheet animation to a target the shell already owns. New gestures acquire
  `useDeviceClassLock(active)` and release on cancellation.
- **Geometry.** Layout belongs in shell CSS or in the content's own container queries via `xp-slot`.
  Route content never reads a width and never uses a width media query.
- **Ask which surface the inspector actually got.** DS declares a docked toggle pane and still mounts
  a labelled drawer below 1400px, so the shell publishes the real answer through
  `useInspectorSurface` (`shell/AppShell.tsx:402`), returning `"docked"` or `"labelled"`. Reference
  consumer: `modules/offers/Frame.tsx:80`. A screen that assumes the declared surface will put its
  actions in the wrong place on a laptop.

## QA contract

A screen that is not registered does not exist: it is never captured, never gated, never perceived.

1. **Register the screen and every state** in `apps/web/src/qa/screens.ts` (id, path, module, name,
   route file, states). The `name` is the screen's own heading text: `apps/web/tests/app.test.mjs:20`
   asserts it is present in the rendered HTML of that screen on every class, so a label that the
   screen does not render fails five times. Do this in the SHAPE phase, before implementation, so the
   matrix counts what you owe.
2. **Implement the state's setup and readiness** in the module's own producer file
   (`scripts/qa/<module>-states.mjs`, named by `qaStates` in its registration; the demo's is
   `scripts/qa/harbor-states.mjs`). `scripts/qa/common.mjs` is the generic dispatcher and is never
   taught a module. A producer navigates,
   performs the interaction that creates the state, and waits for a settled signal. Producers must
   open the surface the class actually has: on TP the module sheet opens from the title, on M from
   the dock's More tab, on the wide classes from the anchored menu.
3. **Run it.** `pnpm qa <run-id>` captures the whole registry; `XP_QA_MODULES=<a,b> pnpm qa <run-id>`
   filters to modules while you iterate; `pnpm qa:perceive <run-id> [screen]` runs the per-screen
   perceiver; `node scripts/qa/perf.mjs <run-id>` measures cadence.
4. **Read the manifest, not the console.** `apps/web/evidence/<run>/manifest.json` and
   `qa-report.md` carry the verdict. A gate that observed nothing is INACTIVE and never a pass.
5. **Never rebuild under a running capture.** `pnpm qa` builds once and serves that build for hours;
   a run that spans two builds certifies nothing and must be discarded.

## Anomalies: do not copy blindly

| Item | Where | Note |
|---|---|---|
| `settings` is a registry module with no module directory | `qa/screens.ts:67`, `:78` | Its screens live in `routes/Settings.tsx` and the configurator |
| Two shared session mechanisms coexist | `data/harbor-session.ts:10` vs `modules/work/graph.ts:9` | Mutable-in-place with a revision counter, versus reconciled writes. Pick one per app: `DATA.md` |
| Three modules keep state entirely local | `home/store.tsx:3`, `copilot/store.tsx:6`, `calendar/store.ts:14` | Legitimate only because those modules own their data. Anything shared belongs in the shared store |
| `/kit/records/:id` renders the same component as `/kit` | `App.tsx:163` | Its states are the kit screen's `record` states, not a separate registration |
| Seven `home` settings routes are two-line re-exports | `home/Members.tsx:1` | The real screen is `modules/home/WorkspaceSettings.tsx` |
| `docs/product/modules/work-verification.md` has no module | `docs/product/modules/` | An extra document, not a tenth module |
| `warmMotion` is already bound, once | `apps/web/src/App.tsx:213`, imported at `:44` | Do not bind it again. A second owner is the double-binding defect this page forbids |
| `revealOnScroll` is bound only in the motion lab | `apps/web/src/motion/MotionDemo.tsx:43` | The lab is stripped from a generated project (`scripts/create_project.sh` excludes `apps/web/src/motion/`), so in your app it starts unbound. Bind it in the shell, once |
| `SnapRail` is genuinely unbound in the app | `packages/xp-primitives/src/snap-rail.tsx:201` | The primitive with embla physics and its own class lock. Twelve `xp-blocks` modules consume it; no app code does. It is what you want for a real snap rail |
