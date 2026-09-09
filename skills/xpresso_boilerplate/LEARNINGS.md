# Learnings

Verified constraints and the failure modes this codebase already paid for. **Read at RECON.** Every
entry cost a review round, a discarded certification run or both. Repeating one of them is not a new
mistake, it is an unread file.

## 2026-09-06: source code determines the template contract (#49)

The checkout has one original workspace and no `src/templates` directory. The `aidesk` profile names
that workspace; omission of the flag selects it too. The isolated motion lab is stripped, but shell
motion stays. Why: presenting unimplemented template choices or copying licensed references would
misrepresent what a generated project contains.

## 2026-09-06: preserve internal package identities (#49)

The public app, root and Worker identity can change independently of `web` and `@xp/*`. Workspace
dependency edges, pnpm filters and public export paths use those names. Why: a broad replacement
would break both the dependency graph and documented commands. Generated dependencies must be
installed and package CSS rebuilt, not borrowed through the source checkout's `node_modules` or
generated output.

## 2026-09-06: deployment identity reaches the PWA (#49)

The source PWA generator derives install matching from the source Worker route. A generated project
removes that route and starts with an empty related-app list; the generated project's `apps/web/project.json` provides the public
origin once selected. Why: changing only a Worker name would preserve another app's install identity.
Build and preview do not prove a successful real install, Worker headers or live deployment.

## 2026-09-08: eight union defects, or what happens when modules land in parallel (#101)

Seven HARBOR modules were built and reviewed on separate branches, then integrated. Every module
passed its own review. The integrated tree still carried eight defects that no single branch could
show, all of the same family: **a shared surface that was correct for a smaller app**.

| Defect | Root cause | The general lesson |
|---|---|---|
| A sheet that mounted already open never called `showModal` | `mounted` gated the portal, so the first effect ran on a null ref | A surface opened from a URL takes a different path than one opened by a click. Test both. |
| One module's 34px sidebar row broke another's 32px snap grid | Two modules chose row heights independently | Row geometry is a shell contract, not a module preference |
| A module's filter (`theme`) was carried as global query state | A shared helper listed it among the global keys | A query key that no shell code reads must not travel between modules |
| The anchored navigation layer collapsed to 21px | `container-type: size` on an auto-height fixed popover | Size containment sizes an element as if it had no contents. Budget from the viewport instead |
| The docked section strip lost its entire layout | A fix commit's CSS hunk deleted five neighbouring rules | One commit, one concern. A CSS hunk that touches rules outside the fix is a defect in the making |
| Every home capture threw before reaching any state | A merge kept a helper's call and lost its definition | After a union merge, run the suites of the modules you did not touch |
| The release gate read the issue number `#101` as a hex colour | A regex matched three hex digits in a comment | A gate that reads source must know what a comment is. Ask a parser |
| The TP top bar's ten module links stopped fitting | Two modules added a destination to a row sized for eight | A list that grew when six modules became one app, in a container built for the smaller list |

**How to apply:** when your app has more than one module, treat every shared surface (shell, QA
registry, demo graph, navigation lists, snap grids, query keys) as a contract with a stated capacity,
and re-run the whole suite sweep after every merge, not only the tests of the module you changed.

## 2026-09-08: five more defects the sweep and the matrix found (#101)

Machine gates and full-registry capture found what code review did not:

- The overview stacked all twelve service-day arrivals against a four-row design and ran past the
  phone fold. **A collection on a compact class needs a paging strategy chosen with numbers, not a
  hope.** A measured attempt matters: capping the kitchen queue at three rows still measured 1,322px
  against the 1,055px limit; only the record deck fit, at 937px.
- A tag removal was held for one UI duration and its deferred write closed over the stale list, so a
  tag added inside that fifth of a second was silently overwritten. **A deferred write must read the
  current state at commit time, never the state it captured when the animation started.**
- The new list skeleton replaced the shared `data-kit-state` contract, so the registered loading
  state became unproducible on every inbox screen. **A visual replacement must keep the harness
  contract the old element carried.**
- Two fold chevron rotations sat outside the reduced-motion query that guarded the rest of the fold,
  so they kept transitioning for a reader who asked for no motion. **This repository has two
  reduced-motion idioms; a sweep that knows only one reports false positives in packages and misses
  real breakage in the app.** Both are named in `docs/engineering/motion-wiring.md`.
- Producers clicked a control the class no longer had. **A state producer must open the surface the
  class actually has: title on TP, dock tab on M, anchored menu on the wide classes.**

## 2026-09-08: a capture run that spans two builds certifies nothing (#101)

`pnpm qa` builds once and serves that build for hours. Two runs were discarded: one because fixes
landed under it, one because a rebuild happened mid-run. **Start the certification run after the last
commit that changes `dist`, and do not touch `dist` until it exits.** Keep an aborted run's directory
under a name that says why it was aborted.

Related: the cadence gate refuses to certify while more than one other Chrome browser process runs,
which cannot be satisfied on a shared workstation with a browser open. Record the raw figures as
evidence and put the quiet-host rerun on the checklist rather than reporting a false pass.

## 2026-09-08: the manifest is the verdict, the progress line is not (#101)

`apps/web/evidence/<run>/manifest.json` and `qa-report.md` carry the case verdicts and the gate
bookkeeping. A gate that observed nothing is INACTIVE and never a pass. Read the manifest. A run that
prints thousands of PASS lines and exits non-zero has usually failed a cadence precondition, not a
screen.

## 2026-09-08: reviewer discipline is part of the method (#101)

Two of the release review's own findings were wrong in a way worth remembering: a tap-target failure
inferred from pixel heights read off a scaled screenshot (the gate passed on all 10,000 cases), and a
motion claim signed off against the shape of a diff instead of the guard state of each declaration
(the matrix then found twenty reduced-motion failures). **Where the harness measures a thing, cite the
harness. Read frames only for what no gate can see.**

## 2026-09-09: a subtractive phase does not survive a ship-it prompt (#128, v3.0.0)

The first external one-shot on this boilerplate (a Gemini agent, the v2 skill, prompt: build and
publish a flagship AI app, do not stop until it is live) wrote a correct ledger, DOMAIN, sourced job
list and MODEL, then generated the full demo and never stripped it: all nine HARBOR modules, 89
registry screens, 76 source files naming the demo, 45 hits of demo people in its tree, behind an
origin that advertised an "AI cognition studio". The STRIP phase had countable gates and a
non-negotiable clause, and none of it was executed, because deleting produces nothing visible and a
ship-it prompt spends every minute on what does. **A rule that asks an agent to remove inherited
material loses to any rule that asks it to ship.** v3.0.0 removes the choice: the generator is bare
by default, the demo is `--with-demo` and read-only, and the gate counts tails on the output instead
of instructing the deletion. Where you find yourself writing "delete X before shipping" into a
method, write "X is not generated" into the tool instead.
