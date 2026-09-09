# WORKFLOW.md: the operational phases

Commands, in the order the loop in `SKILL.md` runs them. **Read the section you are in before running
anything.** Every command below was verified on v2.0.0; script names come from `package.json` and
`apps/web/package.json`.

Two rules that override convenience:

- **Never kill a process by name pattern.** Other agents and the operator share this machine. Own
  your PIDs, stop what you started.
- **Never touch `dist` while a capture runs.** A run that spans two builds certifies nothing.

## A. Create the project

1. From a Git checkout of this boilerplate, with Node 22+, pnpm 10 and Git on PATH:
   ```sh
   scripts/create_project.sh my-workspace /absolute/parent/my-workspace
   ```
   **The output is bare.** It carries the seven packages, the shell, the theme, the motion, the kit
   library (`apps/web/src/modules/kit`, minus the demo gallery route), auth, the configurator, the
   PWA, the QA harness and one starter screen at `/` (auth is six screens). It does not carry a single
   HARBOR module, route, seed, test, screenshot or doc, and the motion lab is excluded in both modes. `--with-demo` copies the full reference application instead; it exists
   to study or preview the showcase and is never the base of a product. `--template aidesk` is the
   only profile and the default. The destination must not exist, even as an empty directory or
   symlink, and must be outside this checkout. Names start with a lowercase letter, contain only
   lowercase letters, digits and hyphens, at most 63 characters. Unknown options fail before copying.
2. The script copies tracked working-tree files from `apps/web`, `packages`, `docs`, this skill and
   the QA tooling, minus the demo, then writes the bare files from `scripts/bare/` with the project
   name and the source path substituted: `apps/web/src/app-modules.ts` (the manifest, wiring the
   starter), `apps/web/src/data/graph.ts` (an empty entity vocabulary MODEL rewrites),
   `apps/web/src/data/auth.ts`, `apps/web/src/App.tsx`, the starter route, module and test (from
   `scripts/bare/apps/web/src/routes/Start.tsx`, `scripts/bare/apps/web/src/modules/start/` with its `forms.ts` and its stylesheet, and `scripts/bare/apps/web/tests/starter.test.mjs`),
   `apps/web/src/qa/screens.ts` (the starter, auth and configure), `apps/web/tests/pwa.browser.mjs`,
   `README.md`, `docs/README.md`, `docs/product/overview.md` and `docs/product/vision.md` (a stub;
   the doctrine stays in the source checkout). Fourteen template files; `git ls-files scripts/bare` in the source checkout is the list of record. **Commit or stage intended source additions first: untracked files are
   deliberately not an input.**
3. It renames the root package, the Worker, the HTML title, the shell brand and the manifest, and
   writes `apps/web/project.json` with `name`, `template`, **`source` (the absolute path of this
   checkout, where every reference module lives)**, `demo` (false) and `deployOrigin` (null). `web`
   and `@xp/*` stay as they are: they are internal contracts. Then `pnpm install --frozen-lockfile`
   and `pnpm -r build` run automatically and must both exit 0 before `READY` prints. A failed run
   leaves its directory for inspection; fix the cause and use a new destination. It never deletes a
   project, initialises Git, creates a remote or deploys.
4. Preview it and walk the five classes:
   ```sh
   pnpm --filter web preview --host 127.0.0.1 --port 5231 --strictPort
   ```
   Check `/`, `/login` and `/configure`. Open `/?xp=M&xp-frame=1` for the class simulator, then TP,
   TL, DS, DW. Stop the server when done. What you see is the whole inventory: the shell with its
   five anatomies, the starter, auth and the configurator. Everything else is yours to compose.
5. Replace the demo identity before building features: brand, icons, screenshots, names, the theme
   default. `DESIGN.md` §7 lists every file. A bare project ships no screenshots and the boilerplate's
   icon; both are placeholders until SKIN.
6. **Open the ledger** at `docs/app-ledger.md`, one path, always that one. `docs/` is a copied root;
   `memory/` is not, so a ledger written to `memory/` in a generated project is a file nobody will
   find. Add one line to the project's `README.md` naming it. Write the `source` path from
   `apps/web/project.json` into the ledger's RECON entry. `git init`, commit the generated tree as it
   came, then commit the ledger at the end of every phase with the subject `ledger: <PHASE>`: the
   gate script reads that history to prove MODEL came before the first component.
7. **Compose, do not clone.** There is nothing to strip in a bare project; there is everything to
   build. Per module of yours, in this order, so the tree builds after every step:
   ```text
   apps/web/src/modules/<name>/            forms.ts (per-class form table, PATTERNS.md "the one structural idea"), components, <name>.css
   apps/web/src/routes/<Name>*.tsx         route components; nested routes under routes/<name>/
   apps/web/src/qa/screens.ts              one entry per route, every state it renders
   scripts/qa/<name>-states.mjs            its state producers (the shape of scripts/qa/auth-states.mjs)
   apps/web/tests/<name>.browser.mjs       its interaction suite, plus the test:browser:<name> script in apps/web/package.json
   apps/web/src/app-modules.ts             ONE registration: id, label, path, icon, prefixes, dock, sourcePrefix, qaStates, and its section resolver
   apps/web/src/App.tsx                    its routes inside the shell route
   ```
   The manifest is the only seam the shell reads: modules, sections, brand, the session hook, the
   cadence probe's `qa.perfScreen` and `qa.perfRoutes`, the vendor gate's `sourcePrefixes` and the PWA
   metadata all come from it. If adding a module made you edit `apps/web/src/shell/AppShell.tsx`,
   `apps/web/src/shell/navigation.ts` or `apps/web/src/shell/sections.ts`, the module is wired wrong. The reference for every one of these files is the same
   file in the demo, under `<source>/apps/web/src/` (`PATTERNS.md`): read it there, write yours here.

   The moment your first module registers, give the `*` fallback route in `apps/web/src/App.tsx` a
   not-found screen of your own (until then it renders the starter's `.start-screen` markup and
   would lose its stylesheet silently), then delete the starter: `trash apps/web/src/modules/start
   apps/web/src/routes/Start*.tsx apps/web/tests/starter.test.mjs`, its registration and its registry
   entry, and re-point `qa.perfScreen` and the three `qa.perfRoutes` destinations at screens your app
   has.

   Verify with commands that can fail, and keep their output for the ledger. The gate script ships in
   this skill directory, so it is in every generated project; it ran on a freshly generated project
   before it was written here, and it was proven to find a demo file planted under another name, a
   screen at `/` with an overlay state and no suite, and a module file committed before `ledger: MODEL`:
   ```sh
   python3 skills/xpresso_boilerplate/scripts/compose-gates.py   # modules, demo strings, identical files, registry count, uncovered overlay states, suite count, MODEL order; exit 1 on any hit
   pnpm --filter web typecheck && pnpm -r test
   ```
   The house interpreter is `/opt/homebrew/bin/python3.12`; the script needs only the standard library
   and reads the generator's own shipped-file lists from the source checkout, so its allowlist cannot
   drift from `scripts/create_project.sh`.
   A demo string, an identical file or a starter directory at EVIDENCE is a COMPOSE failure, and a
   screen you did not write counted in the report is a fabrication.

## B. Build the app

The order matters. Each step ends with something you can look at.

1. **Ledger.** Open `docs/app-ledger.md` with GOAL verbatim (`SKILL.md` §6).
2. **Model.** `DATA.md` in full, entities and links into the ledger, before any component.
3. **Register the surface.** Write every screen and state into `apps/web/src/qa/screens.ts` and its
   producers into the module's QA file registered in `app-modules.ts` now. The registry is your debt list; the counter comes from
   it.
4. **Thin end-to-end.** One entity, index and detail, create and edit, on all five classes, with the
   shell's motion and one registered state, visible in a preview. Do not proceed until this works.
5. **Breadth.** Walk the matrix in the declared order. After every batch: checkpoint the ledger,
   update the counter, and run the fast gates:
   ```sh
   pnpm -r build
   pnpm --filter web typecheck
   pnpm -r test                     # colour gate, then vitest; needs a prior pnpm -r build
   pnpm --filter web size:css
   ```
6. **Iterate visually with a filtered capture**, which takes minutes instead of hours:
   ```sh
   XP_QA_MODULES=<module>[,<module>] pnpm qa iter-<n>
   ```
   Read `apps/web/evidence/iter-<n>/manifest.json`, not the console.

## C. Add or reshape a screen

1. **Define once:** the screen's job in one word (glance, browse, compare, read, act, navigate), its
   data, and every state it can be in, including selection, drafts, empty, loading and error.
2. **Write the five-row form map** into the module's `apps/web/src/modules/<name>/forms.ts` before implementation: M single pane
   or pager, TP compact collection plus detail, TL rail plus list and detail, DS content plus toggled
   inspector, DW workspace plus persistent inspector. Adjust to the task; five copied JSX trees are
   not the goal, five deliberate forms are. Read the nearest reference in `PATTERNS.md` first.
3. **Implement** with state and content in `apps/web/src/routes/<Screen>.tsx` or a module under
   `apps/web/src/modules/`. Compose the app-local `RoutePanes` from `apps/web/src/shell/AppShell.tsx`
   with `list`, `children`, `inspector`, `detailOpen`, and optionally `inspectorLabels` and
   `inspectorActions`. On M, `detailOpen=false` shows the list, selection sets it true, and a visible
   Back action is mandatory. Keep route state above the form switch. Use the kit from
   `apps/web/src/modules/kit` and its own `forms.ts` as the component policy.
4. **Wire navigation:** the route in `apps/web/src/App.tsx`, the destination and section resolver in
   the module registration in `apps/web/src/app-modules.ts` (or a title in `secondaryTitles` for a route
   that is not a module of its own), and the
   configurator preview choice in `apps/web/src/configurator/PreviewStrip.tsx` when it belongs there.
   Geometry goes in shell CSS or the content's container queries. Reuse the shell's motion bindings;
   never bind a second press or sheet animation to the same target. A new gesture acquires
   `useDeviceClassLock(active)` and releases on cancellation.
5. **Register and produce** every state (`PATTERNS.md`, QA contract). Exercise keyboard twins, focus
   trap and return, retained state on resize, and every link.
6. **Verify:**
   ```sh
   pnpm -r build
   pnpm --filter web typecheck
   pnpm -r test
   XP_BROWSER_CHANNEL=chrome pnpm --filter web test:browser:<suite>
   XP_QA_MODULES=<module> pnpm qa screen-<name>
   pnpm qa:perceive screen-<name>
   ```
   Read `docs/engineering/qa-harness.md`: an INACTIVE probe is not a pass, a module change needs a
   full-run CLEAN, exit 3 is a perceiver invocation failure that must be disclosed, and cadence on a
   loaded host is INCONCLUSIVE (exit 2 with no real failure) and needs a quiet host before merge.
   Never rerun until a lucky pass and never lower a limit to get green.

## D. Theme and identity

1. **Pick or compose.** `graphite`, `paper`, `aurora`, `mono`, `warm`, `midnight`, or a spec of six
   `{hue, chroma}` seeds plus the spacing, radius, shadow and density multipliers. `/configure`
   applies and persists a configuration in the URL fragment and `localStorage` and can export CSS,
   JSON or `xpresso.config.ts`; it does not edit repository files.
2. **Runtime preset**, before React renders, in `apps/web/src/main.tsx`:
   ```ts
   import { applyTheme, checkContrast } from "@xp/theme";
   import { presets } from "@xp/theme/presets";

   const theme = presets.aurora;
   if (checkContrast(theme).length) throw new Error("Theme contrast failed");
   applyTheme(theme);
   ```
   Put it before `startConfiguration()` if saved or shared choices should override the default. For a
   fixed exported configuration, import its `applyConfiguration()` and replace that boot call: never
   leave two configuration owners. Keep `startThemeMode()` and its HMR cleanup.
3. **Move the default in all seven places at once** (`DESIGN.md` §3), then regenerate:
   ```sh
   pnpm -r build
   pnpm --filter web pwa:assets
   pnpm -r build
   pnpm --filter @xp/theme test
   pnpm --filter web test
   ```
   For screenshots, run the evidence suite against a preview first, then
   `pnpm --filter web pwa:assets --screenshots`. Check real text contrast in both modes, pre-paint
   dark mode, saved and system preference, and all five forms. The package guard covers opaque
   semantic pairs, not every rendered composition.

## E. Certify

Run this once, on the final build, with nothing else on the host.

```sh
pnpm -r build
pnpm --filter web typecheck
pnpm -r test
pnpm --filter web size:css
for s in $(node -p "Object.keys(require('./apps/web/package.json').scripts).filter(k => k.startsWith('test:browser:')).map(k => k.slice(13)).join(' ')"); do
  pnpm --filter web test:browser:$s || echo "FAILED: $s"
done
npx wrangler dev -c apps/web/wrangler.toml --port 8791 --ip 127.0.0.1 &   # csp needs the Worker
XP_BASE_URL=http://127.0.0.1:8791 pnpm --filter web test:browser:csp
kill %1                           # stop it here: a Worker left running skews the cadence run below
pnpm qa release-1                 # the whole registry, unfiltered
pnpm qa:perceive release-1
node scripts/qa/perf.mjs release-1   # nothing else on the host, or it reports INCONCLUSIVE
```

Then read `apps/web/evidence/release-1/manifest.json` for the case verdicts and
`qa-report.md` for the gate table. Fix what failed, re-run only what failed, stop. The sweep is
derived from `apps/web/package.json`, so a module suite registered as `test:browser:<module>` is
inside it and a suite without a script is outside the gate: a bare project starts at five (auth,
configurator, csp, pwa, theme) and the count grows by one per module of yours, which is what §8
compares.

## F. Deploy

1. **Target.** Inspect `apps/web/wrangler.toml`: name, Worker entry `src/worker.ts`, the `ASSETS`
   binding, the `dist` directory, SPA fallback and `run_worker_first=true`. Choose the account and
   public origin. Keep no routes for a `workers.dev` subdomain, or add your own route and domain. Set
   the public HTTPS origin in `apps/web/project.json` (`deployOrigin`). Supply Cloudflare credentials
   through the environment, never a file, never a log.
2. **Dry run:**
   ```sh
   pnpm -r build
   pnpm --filter web pwa:assets
   pnpm -r build
   pnpm exec wrangler deploy -c apps/web/wrangler.toml --dry-run
   ```
   Verify the manifest names the intended app and the absolute related-app origin. Icons and
   screenshots are starter assets until replaced. A parsed manifest is not an install.
3. **Deploy**, within existing authorisation, after naming the account, Worker and route affected and
   recording the current version for rollback:
   ```sh
   bash scripts/deploy.sh
   ```
   It builds web and invokes the pinned Wrangler, assuming package builds exist. It does not create
   DNS. Do not use this repository's `scripts/ensure_dns.sh` for a new project.
4. **Verify live, with requests:** `/` and the app's main routes return 200, security headers are
   present, deep links work, the theme bootstraps with no CSP error, the service worker updates. Vite
   preview proves asset serving only, never Worker headers. Roll back with
   `pnpm exec wrangler rollback <VERSION_ID> -c apps/web/wrangler.toml`; a first deployment has no
   predecessor and a Worker rollback does not undo DNS. Record the real result, not the dry run.

## G. Command index

| Need | Command |
|---|---|
| Build everything in dependency order | `pnpm -r build` |
| Types, including the service worker | `pnpm --filter web typecheck` |
| Unit tests plus the colour gate | `pnpm -r test` |
| Render-blocking CSS budget | `pnpm --filter web size:css` |
| One browser suite | `XP_BROWSER_CHANNEL=chrome pnpm --filter web test:browser:<name>` |
| Filtered capture while iterating | `XP_QA_MODULES=<a,b> pnpm qa <run-id>` |
| Full certification capture | `pnpm qa <run-id>` |
| Per-screen perceiver | `pnpm qa:perceive <run-id> [screen]` |
| Cadence | `node scripts/qa/perf.mjs <run-id>` |
| Install assets | `pnpm --filter web pwa:assets [--screenshots]` |
| CSP hashes after an inline-script edit | `pnpm --filter web csp:hashes` |
| Secret scan | `python3 scripts/scan_secrets.py` |
| Preview a build | `pnpm --filter web preview --host 127.0.0.1 --port <port> --strictPort` |
| Deploy | `bash scripts/deploy.sh` |
