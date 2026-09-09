# STUDIO.md: using xpresso-studio

**Read before pulling anything from it.** Repository: `github.com/michaljerzylew/xpresso-studio`.
Public catalog: `https://xpressostudio.milkies.work`.

## 1. The fact that changes how you use it

**Studio's packages are already vendored into this repository**, and the vendoring is documented in
`packages/xp-blocks/PROVENANCE.md`: source repository, source commit, the date (2026-09-05), the
method (`rsync`, excluding `node_modules`), and what was deliberately left out. The reason is stated
there too: a consumer can clone this repository without a sibling studio checkout.

Verified by comparison on v2.0.0:

| Check | Result |
|---|---|
| Package identity | identical: `@xp/blocks`, `@xp/core`, `@xp/primitives`, `@xp/shells`, all `0.1.0`, all private |
| `packages/xp-blocks/src` | no differences, 118 files each side |
| `packages/xp-shells/src` | no differences, 70 files each side |
| `packages/xp-blocks/manifests` | identical, 67 manifests |
| `packages/xp-primitives/src` | **3 files differ and 1 is added**: `packages/xp-primitives/src/device-class.tsx` is now a re-export shim over `@xp/runtime`, `packages/xp-primitives/src/adaptive-overlay.tsx` adds `autoFocus` to the drawer root, and `packages/xp-primitives/src/record-deck.tsx` is new here |
| Excluded from the copy | studio-only tests in all four packages, `xp-blocks/scripts/` and its `posters:features` script, the whole `COPY/` fixture corpus, and `assets-library/` media maps |

**So: nothing to install, and no import from a studio path, ever.** A block is
`import { X } from "@xp/blocks"`, resolved through the workspace.

**And the thing that will actually stop you:** no application code imports `@xp/blocks` today.
`grep -rn "@xp/blocks" apps/web/src` returns zero. It is a declared dependency
(`apps/web/package.json`) with no consumer. You will be the first, so expect to do the wiring in the
next two sections rather than to find a working example in the app.

**What studio has that this checkout does not:**

1. **The visual index.** 762 source variants across 64 families, browsable, each opening the real
   module with a class switcher for M, TP, TL, DS and DW. That is how you find which block realises
   the layout you have in mind and see its five forms before writing a line.
2. **The fixture corpus and the media maps.** `COPY/` (777 files) and `assets-library/`: studio's own
   demo content, deliberately not vendored. You supply your app's own content instead, which is what
   you want anyway.
3. **The ledger and catalog data.** `AUTONOMOUS_CONVERSION_LOOP/STATE/ledger.tsv`,
   `PLAN/ledger-status.json`, `apps/preview/app/catalog.generated.json` (762 entries).
4. **The research.** `FIRST_RESEARCH/` (7 documents, start at `00_NORTH_STAR_SYNTHESIS.md`) and
   `SHADCN_RESPONSIVE_APPROACH_RESEARCH/` (66 documents): why device-native beats shrink-and-stack,
   and what each form family is for. Read a family's research before inventing a sixth form for it.
5. **Worked consumption examples.** Studio's `apps/preview/app/gates/<block>/` pages show a block
   mounted with its fixture and its media resolver. That is the pattern to imitate.

## 2. When to reach for it

| Situation | Action |
|---|---|
| You need a pattern HARBOR already implements | Do not go to studio. `PATTERNS.md`, then the module file |
| You need a **layout form** the app does not contain (a pricing band, a feature grid, a testimonial rail, a marketing hero, a stats strip) | Find it in the catalog by family, read its manifest, then mount the export from `@xp/blocks` as in §3 |
| You need to know why a block behaves as it does per class | Its manifest first, then the family research |
| You need a shell shape the app shell does not have | `@xp/shells` is already here, but the app-local `AppShell` and `RoutePanes` stay the contract for anything inside the workspace |
| You want a marketing or auth surface | `@xp/shells` marketing and auth units, with their own CSS subpaths |

## 3. Mounting a block

A block is not a snippet. It is a semantic owner with a typed contract, and you supply three things:
the fixture, the media resolver and the slot.

1. **Read the manifest first:** `packages/xp-blocks/manifests/<name>/xpresso.block.json`. It is the
   contract, not documentation. Example (`announce`):

   ```json
   { "job": "glance", "contract": { "exportName": "Announce", "sourceVariants": 12,
     "presets": ["promo-art", "ticker", "notice", "coupon", "consent-compact", "upsell"],
     "oneSemanticOwner": true, "mediaResolver": { "required": true, "fixtureKeysAreNotUrls": true } },
     "slotRange": { "min": "S1", "max": "S6" }, "engine": "swap",
     "formOverrides": { "M": { "form": "sheet", "targetFloorPx": 44 },
       "TL": { "form": "popover", "targetFloorPx": 44 },
       "DW": { "form": "band", "maxWidthRem": 120 } },
     "budgets": { "horizontalOverflow": "none", "remoteMedia": 0, "mobileTargetPx": 44 },
     "baseline": { "javascriptOff": true, "reducedMotion": true } }
   ```

   What you must honour: the **job**, the **export name**, the **presets** (choose one, never fork
   the component), the **slot range**, the **per-class form overrides**, the **tokens**, the
   **budgets** and the **baseline** promises.
2. **Supply a fixture of the block's own type.** The resolver is vendored with the block, in
   `packages/xp-blocks/src/<name>-model.ts` (for `announce`, `resolveAnnounceFixture` at
   `packages/xp-blocks/src/announce-model.ts:256`, consumed by the component at
   `packages/xp-blocks/src/announce.tsx:224`). Studio's demo fixtures
   were not vendored, so you write yours from the app's own data. Read the exported fixture type
   before writing it; do not guess its shape.
3. **Supply a media resolver.** A manifest with `mediaResolver.required` means fixture keys are keys,
   not URLs. The resolver maps them to the app's assets. Remote media budget is zero.
4. **Give it a slot, not a viewport.** Mount inside an `.xp-slot` container so the block's own
   container queries work. A block outside its declared slot range is being used wrong and will look
   wrong.
5. **Prove the wiring before you build on it.** Add the one import, then:
   ```sh
   pnpm --filter web typecheck
   pnpm -r build
   pnpm --filter web size:css
   XP_QA_MODULES=<module> pnpm qa block-<name>
   ```
   Blocks pull `recharts` and their skins are large and deliberately outside the app's CSS graph, so
   the CSS budget and the bundle both need a look after the first mount.

## 4. Rules that do not bend

- **Availability is not compliance.** That a skin exists does not establish that it meets this app's
  theme, five-form or motion contract on the screen you are mounting it in. Read the manifest, mount
  it, capture it, look at the frames.
- **Do not fork a block to change its look.** Use a preset, then tokens. If neither fits, it is the
  wrong block: go back to the catalog.
- **Original copy only.** Studio's promise is original copy and original or provenance-approved
  media, and your app inherits it: no vendor sentences, no vendor brand names, no lorem ipsum. The
  gate is `apps/web/tests/vendor-copy.test.mjs` (a fixed sentence list plus seven vendor brand
  names, under `pnpm -r test`); `scripts/qa/inbox-vendor-sentences.mjs` is a source-checkout tool
  that needs the gitignored templates and never runs in a generated project.
- **Licensed references are read-only inspiration.** `shadcn_templates/` here and any vendor template
  in studio's research exist to be looked at. Copying their code, class names, seed data or sentences
  into a deliverable is a defect, whatever the deadline.
- **Never edit a vendored package to fit one app.** They carry a provenance record and are shared
  with studio and every other project on this boilerplate. App-specific behaviour goes in the app.
  If a package genuinely needs a change, it is a change in studio, re-vendored, with the provenance
  updated.

## 5. Licensing: what may ship and what may not

Verified, because getting this wrong is the one mistake here with a legal edge.

- **The vendored `@xp/*` code is Xpresso-owned and ships.** This repository is MIT (`LICENSE.md`),
  and the vendoring decision is recorded at `docs/decisions/0010-vendor-xpresso-packages.md`.
- **The 762 studio sources are conversions of licensed vendor blocks**, and every catalog row keeps
  its `sourceHref` back to the vendor. Studio's stated boundary: vendor markup is analysis input
  only, never copied one to one, all copy rewritten and similarity-checked, all media original or
  provenance-approved. Studio's own corpus metadata records `licensedContentCommitted: false`, and
  the studio repository carries no LICENSE file of its own.
- **So: the components ship, the vendor's TSX, copy, photography and screenshot bank do not.** Not
  into your app, not into a commit, not into a screenshot you publish.
- **Count discipline, so you do not repeat a wrong number:** the catalog JSON holds 762 source rows.
  The 782 figure in studio's README is a site total that adds 16 primitives and 4 system labs
  assembled at render time.

## 6. Working with a local clone

```sh
gh repo clone michaljerzylew/xpresso-studio ~/somewhere/xpresso-studio -- --depth=1
```

About 1.9 GB. Use it read-only: the catalog, the manifests, the gate pages, the ledger and the
research. Never run its build to consume a block, and never import across the two checkouts: the code
you need is already in your workspace.
