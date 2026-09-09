# Entry JavaScript and vendored tree shaking

Issue #79 keeps unused vendored JavaScript out of the application build. Both
`@xp/primitives` and `@xp/shells` declare `sideEffects: ["**/*.css"]`: JavaScript
modules can be discarded when their exports are unused; imported styles remain.
The barrels stay available and are covered by a Vite integration fixture in
`apps/web/tests/tree-shaking.test.mjs`.

The app imports `MetricTile`, `SegmentedControl` and `AdaptiveOverlay` through
focused primitive entries, and bottom-region arbitration through the shells'
existing `regions` entry. Import other components through their documented
exports; do not mark CSS side-effect-free to obtain a smaller build.

## Why the install overlay is a separate eager chunk

This branch uses Vaul through Settings → InstallControl → AdaptiveOverlay, even
without a `/configure` route. It is required code, not an unused dependency.
Vite isolates AdaptiveOverlay and Vaul in `install-overlay-*` with
`onlyExplicitManualChunks`; common dependencies stay in a separate `shared-*`
chunk. The entry imports these chunks eagerly. This preserves Settings' immediate
form arrival, install-event subscription, focus handling and offline support.
The service worker precaches the emitted chunks as before.

Do not interpret the smaller entry alone as an equivalent network saving.
Tree shaking removes unused shell presets and primitives from the complete build;
the manual split only relocates the required install code. `index-*` is reserved
for the actual entry so the requested gzip and grep commands remain unambiguous.
The existing lazy motion-demo chunk remains about 7.2 kB raw.

## Issue #79 measurements

Local baseline `24da288`, measured 2026-09-05. Gzip values use `gzip -c`,
including its per-file header, rather than Vite's gzip estimate.

| Measurement | Before | After |
|---|---:|---:|
| Entry raw bytes | 627,689 | 440,328 |
| Entry gzip bytes | 211,456 | 152,844 |
| Eager JavaScript gzip bytes, entry plus static dependencies | 211,456 | 193,306 |
| Lighthouse 12.8.2 mobile LCP on `/` | 2,451.77 ms | 2,616.10 ms |
| Lighthouse mobile performance score | 96 | 94 |

The entry is 27.7% smaller gzipped; total eager JavaScript is 8.6% smaller.
The after build also loads `shared-*` (29,939 bytes gzip) and `install-overlay-*`
(10,523 bytes gzip). The single Lighthouse before/after pair does **not** show an
LCP improvement: LCP rose by 164.33 ms. These are local simulated mobile runs,
not field measurements or a statistically established regression. No Lighthouse
score target or test threshold was changed.

## Reproduce the measurements

Build before running browser checks; do not rebuild while a capture is reading
`dist`. From `apps/web`, measure the actual entry:

```sh
gzip -c dist/assets/index-*.js | wc -c
rg -l 'vaul|application-shell-01|navbar-component-01|dashboard-sidebar-01' dist/assets/index-*.js
rg -l 'application-shell-01|navbar-component-01|dashboard-sidebar-01' dist/assets/*.js
```

Both searches should return no matches (ripgrep exit 1). Vaul should appear only
in `install-overlay-*` while Settings uses AdaptiveOverlay. Also sum the gzip
sizes of entry, shared and install-overlay to report total eager JavaScript.

Serve with `pnpm --filter web preview --port 4209 --strictPort`, track its PID,
then run Lighthouse 12 against `http://localhost:4209/` using the same Chrome,
default mobile configuration and machine for both builds. On this Mac, set
`CHROME_PATH` to the system Chrome executable; the environment's testing-browser
shortcut does not resolve its framework. Release port 5209 before using it for
Lighthouse's debugger. Never stop another task's process to obtain a port.
