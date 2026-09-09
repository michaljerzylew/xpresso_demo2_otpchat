---
name: xpresso_boilerplate
description: >-
  One-shot a complete, premium, installable application on the Xpresso Boilerplate, built from
  scratch on a bare generated project: model its data, cover its entire surface, compose every
  screen from the shell, kit, primitives and blocks while reading the demo only as a reference,
  give every screen five genuinely native device-class forms, skin it, certify it with the QA
  harness and deploy it to Cloudflare Workers. Use for "build me an app for X", "zrób apkę do X",
  "one-shot an app", adding or reshaping screens, changing the theme, pulling blocks from
  xpresso-studio, or shipping the app. Does NOT cover: repository process (use
  github-agentic-project-management), pure backend work with no UI surface, or Airtable/NocoDB base
  modeling (use human-data-and-assets-relationship-and-role-modeling).
---

# xpresso_boilerplate

You are building a finished product in one unattended run: a data-modelled, feature-complete,
installable application that looks and behaves like a flagship app on a phone, on a tablet in both
orientations, on a laptop and on a 2000px desktop, from one codebase, certified by evidence, live on
its own origin.

One-shot does not mean thin. It means the operator writes what they want, goes to sleep, and wakes up
to a shipped app they do not have to fix.

## 0. What this is, and what it categorically is not

**Is:** the law and the loop for turning an app request into a certified product on this boilerplate,
built from scratch on a **bare** generated project: the shell, runtime, theme, motion, kit library,
auth and QA harness come with it, the app's own modules are composed on top of them, and the seven
HARBOR product modules (home, inbox, calendar, copilot, offers, venue, work) stay in the source
checkout as worked reference implementations you read and never copy; the demo's other two
directories, `auth` and the `kit` library, ship in every bare project. The parts bin is the vendored
`xpresso-studio`: 67 manifested blocks, the shells in `packages/xp-shells` (70 source files) and 16
primitives, indexed by studio's catalog of 762 source variants.

**Is not:** a scaffolding tutorial, a component gallery, or a licence to ship three screens. It is
also not the repository process: Issues, branches, PRs, reviews and releases belong to
`github-agentic-project-management`. Data modeling for table platforms belongs to
`human-data-and-assets-relationship-and-role-modeling`; this skill applies the same modeling law to
an application's own data.

**The bar, stated once so it cannot be misread:** every screen must be indistinguishable from a
product that a design team polished over a thousand iterations. Mobile reads as a native app someone
downloaded and liked. Tablet reads as a real tablet app in portrait and in landscape, not a stretched
phone. Laptop and wide desktop read as a desktop application, not a centred blog. Anything less is
not a smaller success. It is a failure of this skill.

## 1. Supreme law

1. **Model the data before you write a component.** Entities, roles, keys, derivations, one home per
   fact. Code written before the model gets deleted and rewritten, not patched.
2. **Cover the whole surface.** Every entity gets its full lifecycle, every screen gets its five
   forms and its empty, loading and error states, every collection gets search, filter and sort,
   every gesture gets a keyboard twin. Silently shipping a subset is the gravest failure here, and
   the parity table in your report will expose it.
3. **Never invent what you can read, and never copy what you read.** Unknown pattern: read the HARBOR
   module that already solves it in the source checkout (`PATTERNS.md`), then `xpresso-studio`
   (`STUDIO.md`), then the live system, then research the current production-grade ultra-premium
   standard for exactly this case. Guessing is not a shortcut, it is a defect with a delayed cost.
   Copying the reference file and renaming its nouns is the other defect: a reference is a worked
   answer to a different domain, and your screen is written for yours, in your nouns, on the same
   shell contracts.
4. **Premium is measurable, not adjectival.** `DESIGN.md` states the thresholds: tap floors, row
   grids, safe areas, type scale, motion budgets, contrast, icon and install assets. A screen that
   passes the gates but reads cheap is not done; a screen that looks nice and fails a gate is not
   done either.
5. **Evidence, or it did not happen.** A build is not a layout. A passing unit test is not a
   rendered screen. Only a QA run with a manifest, plus the gates, certify a screen. Reporting
   success without the raw output is a fabrication and voids every other claim you made.
6. **The goal lives in the ledger, not in your context.** GOAL verbatim, surface counters, decisions,
   next action. Re-read it from disk before every phase and as the first action after any compaction.
7. **The demo is not your app, and it is not in your project.** `scripts/create_project.sh` generates
   a bare project: shell, theme, motion, kit library, auth, configurator, QA harness and one starter
   screen. Seven of the nine HARBOR module directories (home, inbox, calendar, copilot, offers, venue,
   work), their routes, data, tests and docs are not copied; `auth` and the `kit` library ship with
   every project. The seven live in the source checkout recorded in `apps/web/project.json` as `source`, and `--with-demo` exists
   only to reproduce the showcase for study, never as the base of a product. **Zero tails law:** a
   shipped app contains no demo module, no demo noun, no demo seed and no file byte-identical to a
   reference file. The first external one-shot on this boilerplate shipped all nine demo modules
   under a correct ledger, because it was told to strip and stripping is the first work a ship-it
   prompt drops; this generator removes the choice. A product that ships a screen the operator
   never asked for is a failure, and counting that screen in your report is a fabrication.
8. **Your denominator comes from outside you.** The job list is sourced: the operator's own words,
   or a researched standard for this app category with its date and link, per row. A surface matrix
   you invented and then satisfied proves nothing, and reporting it as proof is the exact dishonesty
   this skill exists to prevent.
9. **Full autonomy, and full responsibility.** Do not stop to ask. Uncertain: take the reversible
   option, log it, keep building. Only irreversible or outward-facing actions (production deploy to
   a domain, deleting the operator's data, sending anything out) need a word first.

## 2. Input contract

Extract from the prompt, and write into the ledger before anything else:

- **The verbatim request.** Copy the operator's own words. They are the success definition and you
  will not remember them accurately in three hours.
- **The domain.** What business or life activity the app serves, and who uses it. If the prompt is
  one line ("zrób apkę do zarządzania warsztatem"), the domain still has to be understood in full:
  work the ladder in §5 until you can name its entities, its daily jobs and its edge cases without
  hedging. A thin prompt is not permission to build a thin app; it is an instruction to think.
- **The surface.** Which entities exist, which actions the user performs on each, which questions
  they ask the data. Enumerated, counted, in the ledger. See §4.
- **The identity.** Name, brand tone, one of the six theme presets or a custom seed set, target
  origin. Missing: pick, log it as reversible, and make it look deliberate.
- **The language and the locale.** Decide before the first screen, because they are written into
  every label, every seed record, every date and every currency, and changing them later means
  rewriting all of it. Default to the language the operator wrote the prompt in, with the locale its
  market implies, and say which you chose in the report.
- **The scale floor.** Never below: every modelled entity has index, detail, create, edit, and
  delete or archive; auth; settings; one cross-entity surface that proves the graph (dashboard,
  assistant or search); every screen in five forms with three data states; a real PWA install.

Never assume the operator wants less than the domain implies. Never widen into a different product.
Ambiguity between two readings that change the work: take the one that serves the stated job, log the
other in OPEN QUESTIONS, keep moving.

## 3. The loop

**RECON → DOMAIN → MODEL → COMPOSE → SHAPE → SKIN → BUILD → EVIDENCE → VERIFY → SHIP → REPORT.**

Phases stretch to fit. A phase with nothing to do gets one ledger line saying so, **except COMPOSE
and VERIFY, which always have something to do**: a bare project has no screens of yours until you
compose them, and an app you built always needs auditing by someone who did not build it. "COMPOSE:
I used the reference modules" and "VERIFY: the gates are green" are not ledger lines, they are the
two failures this loop exists to prevent. Never manufacture analysis that does not change what gets
built, and never skip a phase because the prompt was short.

### RECON
**Input:** the prompt and this repository.
**Do:** create the project (`WORKFLOW.md` A, bare by default) or confirm you are in one, and write
the `source` path from `apps/web/project.json` into the ledger: that checkout is where every
reference module lives, and nothing in it is yours. Read, in full, `<source>/docs/product/vision.md`
§2, §3, §5, §6 (the generated project carries a 19-line stub at `docs/product/vision.md`, yours to
replace at SKIN; the doctrine lives only in the source checkout) and this skill's `DESIGN.md`. In the
source repository also read `RULES.md` §12; a generated project does not carry that file (the
generator copies `apps/web`, `packages`, `docs`, this skill, the QA scripts, the colour gate, the
secret scanner, the deploy script, the manifests, the lockfile and the licence, and nothing else).
Then `git init` the project and commit the generated tree untouched: that first commit is the witness
every later order check is measured against (MODEL before the first component, the starter gone at
the first registration). Open the ledger with GOAL verbatim, at the path `WORKFLOW.md` A step 6
creates. Map the environment before you touch it: what runs, what the harness expects, and the
full list of what is already registered, module by module, with counts. In a bare project that
inventory is auth, configure and the starter, and the starter is the only one you delete.
**Done when:** the ledger holds GOAL, the `source` path, the environment map with the inherited
screen count, and a working `pnpm -r build`.

### DOMAIN
**Input:** GOAL.
**Do:** understand the domain the way `/distill` demands. Answer, in the ledger, in one sentence
each: what this app is and what it categorically is not; the simplest technical truth of the domain;
what friction it removes; what it is hard-wired to; the hidden assumptions; the shortest executable
form; where the truth about the domain lives. Then enumerate the user's jobs: every task a real user
performs in a day, a week and a quarter, including the unpleasant ones (correcting a mistake,
handling a conflict, exporting for someone else, arriving with nothing set up yet).
**Done when:** every job on that list maps to a screen or an action that appears in §4's surface
matrix. A job with no home is either out of scope with a stated reason, or a hole.

### MODEL
**Input:** the domain and its jobs.
**Do:** apply `DATA.md` in full. Entities on the backbone, one kind of thing per entity, every fact
with exactly one home, links named as roles in both directions, derived values computed and never
typed, closed lists as enumerations. Then choose the persistence, and choose it explicitly rather than inheriting it: **the default is the
in-memory graph with the URL carrying shareable state**, which means a reload resets the data and the
report says so in those words. Choose a real store (D1, SQLite, Postgres, MySQL) when the domain
needs truth that outlives a tab, more than one user, or real authentication: then the model is
expressed as a schema, and `DATA.md` §5 carries the constraints, including the policy directive that
will otherwise refuse every cross-origin call. Write the model spec
into the ledger before you write a component.
**Done when:** MODEL in the ledger names every entity, its fields with types, its links with role
names, its derived fields with formulas, and its persistence target.

### COMPOSE
**Input:** the model, the sourced job list, the parts inventory (`REFERENCE.md`, `PATTERNS.md`,
`STUDIO.md`) and the `source` path from RECON.
**Do:** decide, screen family by screen family, what each screen is made of, and write it down
before you write it. A bare project has the shell, the kit library, the primitives, the blocks and
one starter screen; everything a user of your app will see is composed here, from those parts, in
your nouns. Per row of the surface matrix:

- **Anatomy:** which shell form carries it on each class (`RoutePanes` list, detail and inspector; a
  sheet, a drawer, a docked pane), per `<source>/docs/product/vision.md` §3 and the inspector ladder
  in `PATTERNS.md`.
- **Parts:** the kit components, primitives and blocks it uses, by export name.
- **Reference:** the file in the source checkout that already solves the closest pattern, cited as
  `<source>/apps/web/src/modules/<demo>/<file>:<line>`, and one line on what is different in your
  domain. A row with no reference is a row where you are about to invent; a row whose reference you
  plan to copy is a row where you are about to ship a tail.
- **Registration:** the module directory under `apps/web/src/modules/<yours>/` with its `forms.ts`
  per class, its route files, its registry entries in `apps/web/src/qa/screens.ts`, its state
  producers, its browser suite, and **one registration in `apps/web/src/app-modules.ts`**. That file
  is the only seam the shell reads: modules, sections, brand, session hooks, the cadence probe's
  routes and the vendor gate's prefixes all come from it. Nothing else in the shell is edited to add
  a module, and a module that needed a shell edit is a module wired wrong.

Delete the starter module, its registration and its own test file under `apps/web/tests` (generated from `scripts/bare/apps/web/tests/starter.test.mjs`)
the moment your first module registers, after giving the `*` fallback route in `apps/web/src/App.tsx`
a not-found screen of your own, because until then it renders the starter's markup. The starter
exists so the bare project builds and runs the harness on day zero, and from the first commit of your
own it is a tail.

**The evidence layer is yours to write.** A bare project ships the shell's own suites and none for
your screens, because none exist yet. Every module of yours gets at least one browser suite covering
the overlays, the sheets, the keyboard twins and the cross-screen links that `DESIGN.md` §9 layer
three requires. Shipping with zero interaction tests is not a green run, it is a missing layer. The
gate does not count suites, because a six-line suite that asserts one heading is a suite; it counts a
set difference: every screen of yours with an overlay state (`sheet-open`, `panel-open`,
`record-panel-open`, `dialog`, `menu`, `popover`, `actions-menu`) is driven by a suite under `apps/web/tests/` that imports the harness, awaits `prepare()` or
`openRoutePane()`, and names the screen in code (`.id === "<id>"` or `.module === "<module>"`).
The gate reads the suite with its comments stripped, so a comment, a stray word or a heading
assertion does not count, and a suite that only clicks through the app without one of the two
harness drivers does not count either: the reference suites that open panes by hand are the demo's,
not the contract. Screens with an overlay state and no such suite: 0
(`skills/xpresso_boilerplate/scripts/compose-gates.py` prints it).

**You read the reference. You never copy it.** The demo is a hospitality product: its nouns, its
seed people, its copy and its states are answers to a different domain. A reference file copied into
your tree, byte-identical or with the nouns swapped, is the exact failure this phase exists to
prevent, and §8 counts it. Reuse happens through the shell contracts, the kit, the primitives and the
blocks, which are yours by design. The model's fastest move is a rename, so the load-bearing checks
are structural: **entity kinds in the shipped graph that MODEL does not name: 0**, and **routes
served that the matrix does not contain: 0**, both set differences you can print.

**Done when**, each line a number you can print:

- Every row of the surface matrix has a COMPOSE entry in the ledger: anatomy per class, parts,
  reference with `file:line`, difference. Rows without one: 0.
- `apps/web/src/app-modules.ts` registers exactly your modules plus auth. Directories under
  `apps/web/src/modules/` other than `auth`, `kit` and your registered modules: 0. The starter: gone.
- Files in your tree whose content hash equals a demo file's (the seven demo modules, the demo
  routes and the demo data in the source checkout, minus what the generator ships), at any path: 0
  (`skills/xpresso_boilerplate/scripts/compose-gates.py` prints it; 0 on a fresh project, 1 the moment
  a demo file is planted under another name, and the shipped-file allowlist is read from the
  generator in the source checkout so it cannot drift).
- Demo strings in `apps/web/src`, `scripts/qa` and `docs/product`, registry and shell included
  (`skills/xpresso_boilerplate/scripts/compose-gates.py` carries the list; the copied engineering docs and this skill name the demo on
  purpose and are out of scope): 0.
- `pnpm --filter web typecheck` and `pnpm -r test` pass with your registrations in place, before a
  single screen is finished.

### SHAPE
**Input:** the model and the jobs.
**Do:** build the surface matrix (§4). For every screen decide the five forms deliberately, using
`docs/product/vision.md` §3 anatomy and the reference module in `PATTERNS.md` that already solves the closest
pattern. Name each screen's job in one word: glance, browse, compare, read, act, navigate. Register
every screen and every state in `apps/web/src/qa/screens.ts` now, before implementation, so the
matrix counts what you owe.
**Done when:** the registry count equals the surface matrix count, and every screen has a named
reference implementation to build against.

### SKIN
**Input:** identity.
**Do:** choose or compose the theme, check contrast in both modes, set the default in every place
`DESIGN.md` lists, generate real PWA assets, replace icons, favicons, screenshots and names. No
placeholder brand survives this phase.
**Done when:** both modes pass contrast, the install assets are the app's own, and first paint
carries the right colours with no flash.

### BUILD
**Input:** everything above.
**Do:** thin end-to-end first: one entity, its index and detail, its create and edit, on all five
classes, with real motion and a registered state, deployed to a preview. That is the "it works"
moment and it comes early. Then breadth, entity by entity, walking the matrix in a declared order,
checkpointing the ledger and showing the counter (37/100). Consume the shell's existing motion,
sheet, FLIP and press bindings; never bind a second animation to the same target. Mutations go
through one store, never into component state.
**Done when:** every cell of the matrix is built and the counter reads N/N.

### EVIDENCE
**Input:** the built app.
**Do:** the gates and the harness, in this order: `pnpm -r build`, `pnpm --filter web typecheck`,
`pnpm -r test`, the colour gate, the CSS budget, every browser suite, then one QA capture run over
the whole registry, then the perceiver, then cadence on a quiet host. Read the manifest for the
verdict, never the progress line. Fix what fails, re-run only what failed, then stop. Do not restart
a capture run under a rebuild: a run that spans two builds certifies nothing.
**Two harness dependencies to know before you plan this phase:**

- **The perceiver needs the `codex` CLI.** `scripts/qa/perceiver.mjs:23` runs its help command and
  fails when the CLI is missing, unauthenticated or out of quota; the harness surfaces that as exit
  3. Exit 3 is an invocation failure, never a verdict: it does not mean CLEAN and it does not mean
  broken. When it happens, record the exact error and the date in the ledger's EVIDENCE section,
  substitute your own frame review (open the captured images for every screen on DS and M in both
  modes and judge them against `DESIGN.md` §9), say so plainly in the report, and continue. A
  perceiver outage never blocks a release and never becomes a silent pass.
- **Cadence needs a quiet host.** `scripts/qa/perf.mjs` refuses to certify while other Chrome
  processes run and reports INCONCLUSIVE, which is not a failure either. Record the raw figures per
  window as the evidence, put the quiet-host rerun on the follow-up list, and never rerun hoping for
  a lucky pass.

**Done when:** the manifest reports zero non-PASS cases, the perceiver returned CLEAN or its outage
is recorded with your substitute review, and the cadence figures are recorded with their verdict.

### VERIFY
**Input:** a certified app.
**Do:** one adversarial pass over the **product**, not over your process, because every check before
this point was authored by you.

**The conditions are the point, not the passes.** Each pass runs in **fresh context**: a subagent
that has not built this app. Never your own conversation, and never three prose sections written from
the context that built the app, which reproduces the blind spots that made the gap. If the harness
has no subagents, the passes are still fresh: open a new session and hand it its inputs and nothing
else.

**What each pass is given matters as much as its freshness.** Pass A gets the operator's verbatim
request and the running app, **and not the job list**, because a pass handed your list will check
your list; that is the one thing it exists not to do. Pass B gets the running app and the evidence
run. Pass C gets everything, including A's and B's findings and the job list, and reconciles them.

**Each pass writes its own file** under the evidence directory and reports its path. You paste
nothing on their behalf: a transcription is a place where a finding can quietly soften, and a
fabricated section and a real one look identical in a ledger.

**Each pass returns gaps only.** Not a verdict on quality, not confirmation, not praise. A pass that
reports that the app is good has not done its job.

**CRITICAL is defined, so grading is not a lever.** A finding is CRITICAL when any one of these
holds:

1. A task on the job list cannot be completed in the app at all.
2. **A task a practitioner of this domain performs routinely cannot be done in the app, whether or
   not the job list names it.** This test exists because the first one points back at a list the
   builder wrote, and the whole purpose of pass A is to see past that list.
3. A screen loses its job on one of the five classes.
4. Data can be lost or silently overwritten.
5. A destructive action has no confirmation and no way back.
6. A claim in the report does not reconcile with the manifest, the registry or the tree.

Anything else is MAJOR or MINOR. You may not downgrade a finding that meets one of those tests.

**Pass C grades the other two.** Its input includes A's and B's findings, and it rules on whether any
was graded down. The builder does not grade its own audit.

- **A, a user who wants something:** name every task a real user of this domain would attempt that
  this app cannot do, or can do only awkwardly. Also name every noun this app models that a
  practitioner of the domain would not recognise, and every noun they would expect and not find. Its
  input is the domain and the app, never the matrix, so it can see what the matrix never enumerated.
- **B, a stranger on five devices:** open the app cold on each class and name every screen that reads
  as a website, a stretched phone, a centred column, or a fragment; every place where the primary
  action is not obvious; every dead end.
- **C, an auditor:** compare the report's claims against the manifest, the registry and the tree,
  citing a file and a number for every discrepancy so its own grading is auditable later. Name every
  number that does not reconcile, every screen counted but inherited, every state claimed but
  unregistered, every gate reported as passing while INACTIVE. Then rule on A's and B's grading
  against the six tests above, and compare A's findings with the job list: a task A named that the
  list never contained is the list's failure, not A's.

Fix every CRITICAL, and **close it by re-running the pass that raised it**, not by your own
inspection. Record the rest in OPEN QUESTIONS with a reason.
**Done when:** the three passes ran in fresh context with the inputs above, their own files exist and
are linked from the ledger, pass C ruled on the grading and cited its numbers, every CRITICAL was
re-checked by its own pass, and none remains open.

### SHIP
**Do:** `WORKFLOW.md` F. Dry run first (`wrangler deploy --dry-run`), then deploy, then verify the live
origin with real requests: the app's routes, the security headers, the deep links, the install.
Record the current version id first, so a rollback is one command.
**Authority, stated once so it cannot be read two ways.** The operator asking for a live app
authorises publishing that app to its own new origin, including a `workers.dev` subdomain and a
subdomain the project already owns. It does not authorise a DNS change, a new custom domain, or
publishing over an origin that already serves something else: for those, finish the dry run, name the
account, the Worker and the route in the report, and ask. Never invent an origin.
**Done when:** the live URL serves the app, you have checked it with requests rather than assumed it,
and the rollback version id is in the ledger.

### REPORT
**Do:** §9.

## 4. Full surface contract

The natural failure of a model is to build one thing well and call the app finished. This section
makes that arithmetically impossible.

**The denominator has to come from outside you.** Before the matrix, every job-list row carries a
source, and the cheap tag is deliberately the expensive one to use:

- `[operator]` a task the request names. Checkable against the prompt.
- `[research: <source>, <date>]` a task the current standard for this category of app includes. It
  needs a matching entry in the ledger's RUNGS section: what you opened, when, what you took, with a
  URL a reviewer can open. A RUNGS entry without an openable source is not research, and the row it
  backs is `[domain]` at best.
- `[domain: <artefact>]` a task the domain's own artefacts imply. It must name the artefact: the form
  the business already fills in, the report it already produces, the regulation it already obeys. A
  bare `[domain]` is not a source, it is your opinion wearing a tag.

**At least half the rows must be `[operator]` or `[research]`.** A list that is mostly `[domain]` is
a list you wrote about yourself. A row with no source is a row you invented, and a matrix built from
invented rows is worthless however well it balances.

**Build the matrix after that**, in the ledger, from the model and the sourced job list:

| Dimension | How to enumerate |
|---|---|
| Entities | every entity in MODEL |
| Actions per entity | list, read, create, update, delete or archive, search, filter, sort, plus every domain verb from the job list (assign, confirm, cancel, pay, publish, export, merge, restore) |
| Screens | every action that needs a surface of its own, plus the cross-entity surfaces |
| Device classes | M, TP, TL, DS, DW, always five |
| Themes | light and dark, always both |
| Motion | normal and reduced, always both: the harness multiplies by it (`scripts/qa/capture.mjs`), so a matrix that omits it under-counts by half |
| States | default, empty, loading, error, plus every meaningful domain state. **The names are a closed union**: `CaptureState` at `apps/web/src/qa/screens.ts:2` has 45 members in the source registry and 9 in a bare project's generated one; a state you invent will not typecheck. Use a member, or extend the union deliberately and add its producer to your module's state file |

**Prove it in the report:**

| Dimension | Enumerated | Delivered | Deliberately omitted, with the reason |
|---|---:|---:|---|

Delivered plus omitted must equal enumerated. An omission without a reason is a defect, not a
decision. "I did the ones that were easy" counts as not doing the task.

**Three ways this table can lie, and what closes each:**

1. **Counting what you inherited.** Only screens your product owns count. Auth and the configurator
   arrive with the bare project: state them as inherited beside the table, never as delivered. A
   demo module in the tree means the project was generated with `--with-demo`, which is a
   generation failure for a product, and a demo screen in the parity table is a fabrication.
2. **A denominator you authored.** Hence the sources above, and pass A of VERIFY, whose whole job is
   to name what the matrix never enumerated.
3. **Passing by having nothing to measure.** The machine gates measure what exists: an empty screen
   with no dialog, no image and no overflowing list passes almost all of them, and a gate that
   observed nothing is recorded INACTIVE inside a PASS case (`scripts/qa/capture.mjs:112`). So the
   gate in §8 counts registered lifecycle coverage per entity, and pass B of VERIFY looks at the
   frames as a stranger. Absence is not proven by green.

**Size floor, so the same prompt does not yield a third of an app.** The model's entity count comes
from the domain, not from your patience: every noun the sourced job list acts on is an entity or a
field of one, and you state which. Then every entity in the model appears in the matrix with its full
lifecycle. If the resulting matrix is smaller than the job list needs, the model is wrong, not the
matrix.

**Completeness floor, non-negotiable.** An app that displays data but cannot change it is a mockup.
Every collection is searchable, filterable and sortable. Every destructive action is confirmable and
reversible or clearly final. Every form validates and says what is wrong in words. Every list has a
skeleton, an empty state that offers the next action, and an error state that offers a retry. Every
flow has a way back. Every gesture has a keyboard twin, and keyboard-initiated surfaces do not
animate.

## 5. Know-don't-guess

Stop at the first rung that answers. Log the rung you used for any non-obvious decision.

1. **The source checkout and this project.** The seven HARBOR product modules are working,
   reviewed, certified implementations of most patterns an app needs, and they live at the `source`
   path in `apps/web/project.json`, not in your project: read `PATTERNS.md` and go to the file there.
   `auth` and the `kit` library are the two demo directories that ship in your project as well. The
   shell, kit, runtime, theme, motion and QA harness are the contract and they are in your project:
   `REFERENCE.md`. The docs under `docs/engineering/` and `docs/product/` are the doctrine. Code
   beats documentation when they disagree, and you say so.
2. **`xpresso-studio`** (`STUDIO.md`): 762 device-native source modules in 64 families, 67 blocks, 15
   shells, 16 primitives, with a public catalog. Use it for a form of layout this repository does not
   already contain. Obey its consumption rules exactly.
3. **The live system**, when one exists: read it safely before you model around it.
4. **The operator's notes**: `~/lampa/projects/`, project `MEMORY.md`, `okgp brief` / `okgp search`
   when available. Hints, not truth.
5. **Research the current production-grade ultra-premium standard** for exactly the case in front of
   you, when the pattern is in neither repository. Not "how it is usually done": what the best
   shipping product in that category does today, with the nuances the other rungs impose. Record the
   date, the source and what you took. Never copy vendor code, assets, class names or sentences into
   the product: `shadcn_templates/` and any licensed reference are read-only inspiration, and the
   vendor gate is `apps/web/tests/vendor-copy.test.mjs` (a fixed sentence list plus seven vendor brand
   names, run by `pnpm -r test`); `scripts/qa/inbox-vendor-sentences.mjs` is a source-checkout tool
   that needs the gitignored templates and never runs in a generated project.
6. **Only now, assume:** take the reversible option, mark it visibly in the deliverable, log it in
   OPEN QUESTIONS with the shortest test that would settle it.

**Consolidate perspectives.** When the operator describes one thing in three places, the three
descriptions carry three different nuances. Merge the thing, keep every nuance, and tag each to its
source. Picking one description and ignoring the other two is worse than missing all three, because it
looks like work.

## 6. Ledger and compaction protocol

One file at one path, so a post-compaction agent finds it without remembering anything:
**`docs/app-ledger.md`**. `docs/` is one of the roots the generator copies; `memory/` is not, so a
ledger written there in a generated project is a file nobody will find. Name it in one line at the
top of the project's own `README.md` too, because that is the file an agent opens first. Opened in RECON, checkpointed after every phase and every batch by **appending, never by rewriting**
(a ledger rewritten at the end is a story, not a record), and **committed at the end of every phase
with the subject `ledger: <PHASE>`** (`ledger: DOMAIN`, `ledger: MODEL`, …): the git history is the
only witness of the order the phases ran in, and §8 reads it. Delivered with the report.

```markdown
# APP LEDGER: <name>
> If you are reading this after a compaction, a restart or a handover: read this file to the end
> before any other action. Do not reconstruct state from memory. Where this file and your
> recollection differ, this file is right. Then continue from NEXT.
## GOAL     : the operator's request verbatim + success definition. Re-read FROM FILE each phase
## DOMAIN   : the seven answers, one sentence each; the job list
## MODEL    : entities, fields, links with role names, derived fields, persistence target
## SURFACE  : the matrix with counters (the denominators of completeness)
## COMPOSE  : screen family | anatomy per class | parts | reference file:line in `source` | difference
## DECISIONS: # | what | why | what was rejected
## PROGRESS : matrix cell → status, with the counter (37/100)
## RUNGS    : knowledge-ladder record: question | rung used | source or path | date | what was taken
## EVIDENCE : gate | command | raw result | date
## OPEN QUESTIONS: unknowns, assumptions taken, reversible defaults chosen
## NEXT     : the single next action
```

After any compaction or interruption, your first action is to read this file from disk, in full. Not
your summary of it. If the file and your memory disagree, the file is right.

## 7. The twelve traps in this loop

| # | Trap | Where the countermeasure lives |
|---:|---|---|
| 1 | Duplicated intent | DOMAIN's job list is deduplicated before SHAPE; one screen per job, never three for one intent |
| 2 | Lost perspectives | §5's consolidation rule: merge the thing, keep every nuance with its source |
| 3 | Forgotten goal | GOAL verbatim in the ledger at RECON; re-read from file at every phase transition |
| 4 | Hallucinated decisions | §5's ladder with concrete addresses; assumptions logged and marked in the app |
| 5 | Gates instead of work | BUILD's thin end-to-end path first; EVIDENCE is one pass, fix and re-run only failures |
| 6 | Context drift | Phase transitions re-anchor on GOAL and the matrix; scope changes only as logged decisions |
| 7 | False success | Only manifest counts and raw command output may support a success claim; unverified is labelled |
| 8 | Compact decay | Ledger checkpoints after every phase and batch; first action after compaction is reading it |
| 9 | Cascade failure | One-fix rule: an error surviving one fix is an assumption problem. Name it, verify it at the source. Three failed rounds: fresh-eyes subagent with the problem written out |
| 10 | Premature convergence | §4's enumerated matrix, declared walking order, visible counter, parity table in the report |
| 11 | State blindness | RECON maps the environment before mutation; never rebuild under a running capture; check what reads a file before changing it |
| 12 | Determinism decay | The ledger is the only stabiliser. If batch N is thinner than batch 1, stop, re-read GOAL and the last clean batch, resume at that standard |

## 8. Quality gate

Countable only. Every line compares two numbers or two lists.

- [ ] MODEL exists and predates the first component, witnessed by git: the commit whose subject is
      `ledger: MODEL` precedes the first commit that adds a file under `apps/web/src/modules/<yours>/`
      (`skills/xpresso_boilerplate/scripts/compose-gates.py` prints the verdict). Order violations: 0.
      Entities without a stated home for each fact: 0.
- [ ] COMPOSE done. Matrix rows without a COMPOSE entry citing a reference `file:line`: 0. Modules
      registered in `apps/web/src/app-modules.ts` versus module directories other than `auth` and
      `kit`: difference 0. Starter module present: 0. Files whose content hash equals a demo file's, at any path: 0. Demo strings in `apps/web/src`,
      `scripts/qa` and `docs/product`: 0. Registered screens whose
      module is not in the model: 0. Entity kinds in the shipped graph that MODEL does not name: 0.
      Routes served that the matrix does not contain: 0. Screens of yours with an overlay state and no suite that drives them (harness import, awaited
      `prepare()` or `openRoutePane()`, the screen named in code with comments stripped): 0. Inherited (auth, configure) and own counts
      stated.
- [ ] Job list rows without a source tag: 0. Rows tagged `[domain]` without a named artefact: 0.
      Share of rows tagged `[operator]` or `[research]`: at least half. `[research]` rows without a
      RUNGS entry that carries an openable URL and a date: 0.
- [ ] Lifecycle coverage: for every entity in the model, the registry contains a screen for its
      index, its detail, its create and edit forms and its delete-or-archive action (screens, not
      state names: the state union is closed). Entities missing any of the five: 0, or listed with a
      domain reason (a record the user may never create, for instance).
- [ ] Ledger exists at the path for this environment, has an entry per phase, and its last entry is
      this report. Phases with no ledger entry: 0.
- [ ] Surface matrix delivered plus omitted equals enumerated. Omissions without a reason: 0.
- [ ] Registry count equals matrix screen-state count. Difference: 0.
- [ ] `pnpm -r build`, `typecheck`, `pnpm -r test`: exit 0. Failing suites: 0.
- [ ] Colour gate, CSS budget, animation budget, `apps/web/tests/vendor-copy.test.mjs`: pass.
      Violations: 0.
- [ ] Browser suites: all green, the sweep derived from `test:browser:*` in `apps/web/package.json`,
      so your own module suites are inside it (`WORKFLOW.md` E). Red suites: 0. Suites without a
      script: 0.
- [ ] QA capture over the whole registry: non-PASS cases in `manifest.json`: 0.
- [ ] INACTIVE gate instances in the manifest: 0, or each one listed with the reason it observed
      nothing. A case passes with an INACTIVE gate inside it (`scripts/qa/capture.mjs:112`), so an
      uncounted INACTIVE is a screen with nothing to measure claiming to be verified.
- [ ] Perceiver: CLEAN, or every finding fixed or recorded with a reason. Open findings unrecorded: 0.
- [ ] Cadence: raw figures recorded per interaction; interactions with no measurement: 0.
- [ ] Both themes checked on every screen; screens missing a mode: 0.
- [ ] Install assets are the app's own; placeholder icons, names or screenshots remaining: 0.
- [ ] Live origin verified by request, not assumption; unverified routes claimed as working: 0.
- [ ] VERIFY ran three adversarial passes over the product, each in fresh context, each with only
      its own inputs (A never saw the job list), each writing its own file. Passes whose file does not
      exist: 0. CRITICAL findings not re-checked by the pass that raised them: 0. Open CRITICAL
      findings: 0.

Zero may not be reported for a problem you only moved into OPEN QUESTIONS while it still blocks use.

**What this gate deliberately cannot prove:** that the app is worth using. Every line above is
countable, and countable checks cannot see a missing feature nobody enumerated or a screen that is
technically perfect and lifeless. That is what VERIFY's three passes are for, and why they are part
of the gate rather than a courtesy. Nor can it prove that a pass's file was written by a fresh
context rather than by you: the tree cannot tell the two apart, and pass C, which holds the job list,
can re-anchor on your denominator after A was kept from it. The only defence is the operator opening
the three files, which is why the report links them instead of summarising them. The
suite-coverage gate has the same floor: the `.id === "…"` claim it reads is a naming convention in
code, not proof that the named screen is the one the awaited driver opens; a dead string literal
satisfies it, and only a reviewer reading the suite sees the difference.

## 9. Report contract

First line: what works now and where it lives (the live URL). Then, in order: what was built (screen
and state counts for screens **this product owns**, plus the inherited, kept and deleted demo counts,
entities, files); the parity table from §4 with its sourced job list; the three VERIFY passes with
their findings; the ledger's path; decisions with their reasons; open
questions and assumptions taken; the quality gate with its numbers; an explicit **what I did not
build** list; one next action under two minutes. No preamble, no closing summary, no pleasantries.
Time estimates in concrete units.

An honest list of loose ends beats a confident summary.

## 10. Two warnings this codebase earned

- **The list pane's accessible name is hardcoded.** `apps/web/src/shell/AppShell.tsx:447` labels the
  list pane `aria-label="Conversations"`, which is right for an inbox and wrong for every other app.
  No gate catches it, because a label that exists satisfies the accessibility checks. The manifest
  does not carry it. Rename it, and its callers, during COMPOSE.
- **Never claim a module, screen or state exists until code and a test establish it.** Doctrine
  documents describe intent as well as reality; the registry and the manifest describe reality only.
  When the two disagree in your report, reality wins, and you say which document misled you.

## 11. Anti-bureaucracy clause

The method serves the app; the app serves the person using it. Skip any move that would not change
what ships, and say so in one line. **This clause does not reach COMPOSE, VERIFY, the ledger or the
quality gate**: those four are the load-bearing ones, and an exemption granted to yourself for a
check that constrains you is not a simplification. No documentation beyond the ledger, the report and the repository
docs a change actually invalidates. No test rounds beyond the gate in §8. No meta-commentary in the
delivered app, ever.

## Files

- [WORKFLOW.md](WORKFLOW.md): operational phases with verified commands: create, screen, theme,
  deploy. **Read the section you are in before running anything.**
- [PATTERNS.md](PATTERNS.md): the seven HARBOR product modules as reference implementations in the
  source checkout (plus `auth` and `kit`, which your project also carries), pattern to file:line. **Read before building any pattern; inventing what a module
  already solves is a defect, and copying the module is the other one.**
- [DESIGN.md](DESIGN.md): the premium and native-feel law: per-class anatomy, thresholds, type,
  spacing, motion repertoire, icons, PWA, install. **Read in full at RECON and again at SKIN.**
- [DATA.md](DATA.md): the data modeling law and the persistence choices. **Read in full at MODEL,
  before writing a component.**
- [STUDIO.md](STUDIO.md): consuming `xpresso-studio` blocks. **Read before pulling anything from
  it.**
- [REFERENCE.md](REFERENCE.md): the seven packages: exports, contracts, ownership boundaries.
  **Read before importing from a package.**
- [LEARNINGS.md](LEARNINGS.md): verified constraints and the failure modes this codebase already
  paid for. **Read at RECON.**

Canonical doctrine outside this skill: [device classes](../../docs/engineering/device-classes.md),
[motion doctrine](../../docs/engineering/motion-doctrine.md),
[motion wiring](../../docs/engineering/motion-wiring.md),
[theming](../../docs/engineering/theming.md), [QA harness](../../docs/engineering/qa-harness.md),
[architecture](../../docs/engineering/architecture.md),
[product vision](../../docs/product/vision.md).
