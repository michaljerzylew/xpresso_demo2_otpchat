# Progressive web app

Issue #39 makes the demo app installable, offline-capable and native-feeling on a phone. Nothing here changes the route tree or the shell anatomies of [device classes](device-classes.md); the PWA layer sits beside them in `apps/web/src/pwa/`.

What it claims: the app installs, runs from the home screen without browser chrome, opens offline, updates itself and asks before reloading. What it does not claim: background sync, push notifications, periodic sync, or any offline write that outlives the session. Demo data still lives in memory.

## Generated assets, and why they are generated

Every PWA asset is derived from two committed sources, so none of them can drift from the design system:

| Output | Source | Command |
|---|---|---|
| `apps/web/public/manifest.webmanifest` | the `graphite` theme preset in `@xp/theme` | `pnpm --filter web pwa:assets` |
| `public/pwa/icon-{192,512}.png`, `icon-maskable-{192,512}.png`, `apple-touch-icon-180.png` | `apps/web/brand/icon.svg` | same |
| `public/pwa/screenshot-{wide,narrow}.png` | the browser evidence suite | `pnpm --filter web pwa:assets --screenshots` |
| `apps/web/src/csp-hashes.ts` | the inline scripts in `apps/web/index.html` | `pnpm --filter web csp:hashes`, and every `build` |

`apps/web/scripts/generate-pwa-assets.mts` resolves the theme's semantic colours, injects them into the SVG as custom properties, and rasterises each icon in system Chrome through Playwright. There is no image dependency, and the icon bytes come from the engine that renders the app. The `any` icons keep a rounded plate on transparency; the maskable pair is full-bleed with the mark inside the 80% safe zone.

Screenshots are the `install-wide` (1280x720) and `install-narrow` (390x844) captures the evidence suite takes with `?xp-frame=1`, which suppresses the development-only device selector. They are copied, never resampled, and the manifest's `sizes` are read back from the PNG headers.

`apps/web/tests/pwa.test.mjs` re-runs the generator's manifest builder and fails if the committed file differs, so regenerating is always a no-op on a clean tree.

## Colours come from the theme, not from literals

A web manifest has one `theme_color`. Browser chrome needs two, one per colour scheme. So:

- `manifest.webmanifest` carries the light-mode `--xp-surface-raised` and `--xp-surface`, written by the generator.
- `index.html` ships two `<meta name="theme-color">` tags with a `media` attribute and an **empty** `content`. `src/pwa/theme-color.ts` fills both at start-up from `resolveColors(preset, mode)`, projected to sRGB hex by `srgbHex()` in `@xp/theme`.

A literal colour in `index.html` would also fail `scripts/check_no_hardcoded_colors.sh`, which is the point: the gate and the design intent agree.

## Service worker

`vite-plugin-pwa` runs in `injectManifest` mode with `registerType: "autoUpdate"`. The worker is hand-written in `src/pwa/sw.ts` because a generated worker cannot express a stale-while-revalidate navigation route.

| Request | Strategy | Why |
|---|---|---|
| Build output, manifest, icons and local fonts (17 precache entries in the current build) | precache | The app shell and its typography must exist before the first offline visit |
| Navigations | stale-while-revalidate (`xp-navigations`) | The last good document paints at once; the network refreshes it behind the paint |
| Same-origin fonts, `*.woff2` and friends | cache-first (`xp-fonts`, 24 entries, 1 year) | Immutable once published; only status 200 is cacheable. Remote fonts bypass this route so the worker's connect-src does not block a page-authorized font |
| `/pwa/*` and hashed `/assets/*` images | cache-first (`xp-icons`, 64 entries, 30 days) | Names a deployment replaces, or content-addressed ones it cannot reuse |
| Any other image | network | An unversioned or third-party image has no name change to invalidate it, so cache-first would freeze it for 30 days |
| `/pwa/screenshot-*.png` | cache-first, **not precached** | `globIgnores` keeps 2.2 MB of install screenshots out of the precache; the install dialog is where they are read, and a first install fetches them from the network |
| Anything that misses cache and network | `setCatchHandler` | A document falls back to the precached `/index.html`; the SPA then renders the requested route from local demo data |

`self.skipWaiting()` and `clientsClaim()` run in the worker, which is what `autoUpdate` means here: a new worker installs and takes over without asking.

**The image route is narrow on purpose.** It used to match `request.destination === "image"`, which is every image the app ever loads, including cross-origin ones and any future unversioned upload. Cache-first is only safe where the URL changes with the bytes, so the matcher now names the two cases the app controls: hashed `/assets/*` image names, whose URL changes with the bytes, and `/pwa/*`, whose URLs are stable but whose icons are also precached with a revision, so a new build refetches them (runtime-cached screenshots under `/pwa/*` are the exception described below and can stay stale). Everything else goes to the network.

**Screenshots are not revised for a returning visitor.** Deploying does not invalidate a cache-first entry, and the two caches differ in exactly that respect. Precached files carry a revision in the injected manifest, so a new build changes the revision and the worker refetches the icons even though `/pwa/icon-512.png` is the same URL as before. The screenshots are excluded from that manifest by `globIgnores`, so they are only ever runtime-cached by the `xp-icons` route, under a URL that never changes. Nothing about a deployment reaches that entry: a reader who has opened the install dialog once keeps the old capture until the 30-day expiry, the 64-entry cap evicts it, or the cache is cleared.

That is the deliberate trade: precaching them instead would add 2.2 MB to every first visit for two images most readers never see. If a release needs new screenshots to appear immediately, drop `globIgnores` for `screenshot-*.png` so the precache manifest revisions them like the icons, or give the files a hashed name.

**The reload is still the reader's choice.** `src/pwa/register.ts` passes `onNeedReload` to `registerSW`, which suppresses the plugin's own `location.reload()`. Instead `PwaRuntime` shows the toast "New version, reload" with Reload and Later. The toast enters with `enter()` from `@xp/motion` at the occasional frequency, so reduced motion and interruption are handled by the motion package rather than by a second animation path.

## Per-device chrome

`index.html` carries `viewport-fit=cover`, `color-scheme`, the two `theme-color` metas, `mobile-web-app-capable`, the three `apple-mobile-web-app-*` metas, the manifest link and the apple touch icon. Graphite registers two local Inter Variable subsets: `/fonts/inter-latin-wght-normal.woff2` and `/fonts/inter-latin-ext-wght-normal.woff2`. Both enter the PWA precache; the Latin file also has a crossorigin font preload. Other built-in presets retain empty `fonts.webfonts`. No Google preconnect is opened for the default skin (Issue #74). Optional remote configurator fonts bypass the service worker's same-origin font cache route and use the page's CSP font-src allowance. `compileTheme()` emits `font-display: swap` for registered faces.

`viewport-fit=cover` hands the display cutouts to the app, and only the shell spends them. `src/shell/shell.css` defines `--xp-safe-top/right/bottom/left` from `env(safe-area-inset-*)` on `:root`; the header takes the top and the horizontal insets, the rail takes the vertical ones, the M tab bar keeps the bottom inset it already had, and the update toast is placed clear of the tab bar by a shell rule. Content and route files never read a safe area, because the Two-Axis guard test forbids viewport knowledge outside `src/shell/**`.

Touch behaviour, also in the shell: `touch-action: manipulation` on every interactive element (no 300 ms tap delay), `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: contain` on the four scrolling panes, and `block-size: 100svh` followed by `100dvh` so the shell is correct both while browser chrome is expanded and while it collapses.

## Install entry

`usePwaInstall()` captures `beforeinstallprompt` on Chromium and desktop, and listens for `appinstalled`. `InstallControl` puts one "Install app" entry in Settings > Preferences. Where the browser offers a prompt, the entry opens it; everywhere else it opens written steps, presented by `AdaptiveOverlay` as a bottom sheet on M and TP and as a dialog on TL/DS/DW. iOS gets its own Share > Add to Home Screen wording, detected from the user agent plus `navigator.maxTouchPoints` for iPadOS.

On client-side navigation, the Settings form and install entry mount after their incoming pane's `routeTransition().finished` resolves successfully. The heading paints first; native form controls, the theme control and install overlay mount together once the pane has arrived. A direct Settings load renders the form immediately. The route shell subscribes to install events immediately and passes the captured state to `InstallControl`, so an event received during arrival remains available. This replaces the idle callback, which could run during the transition. The hook performs no storage reads or `getInstalledRelatedApps()` query. Saving still displays confirmation, and editing clears it.

The installed case is answered by two engine-specific signals, not by the absence of a prompt. Safari sets `navigator.standalone`, which the hook reads synchronously on first render. Chromium answers `navigator.getInstalledRelatedApps()`, which can match this app because `manifest.webmanifest` lists itself under `related_applications`. That entry needs all three members:

| Member | Value | Why |
|---|---|---|
| `platform` | `"webapp"` | Selects the web-app matcher rather than a store listing |
| `url` | `/manifest.webmanifest` | The manifest to compare against, resolved relative to the manifest's own URL, so it follows whatever origin serves it |
| `id` | `https://xs_boilerplate.milkies.work/` | The web app id desktop Chromium matches an install against. The manifest's own top-level `id` does not substitute for it, and a relative value here can never match |

The `id` is the manifest `id` resolved against the deployed origin, which is what the browser computes for the installed app. It is therefore origin-bound, and `apps/web/scripts/generate-pwa-assets.mts` reads the origin from the `[[routes]]` pattern in `apps/web/wrangler.toml` so the two cannot disagree. A fork changes the route and reruns `pnpm --filter web pwa:assets`. `prefer_related_applications` stays absent, so nothing displaces the browser's own install flow.

Support is Chrome 84 and later on Android, and Chrome or Edge 140 and later on desktop; the hook treats a missing method as no answer. The query is asynchronous, so the entry starts as written steps and settles to "installed" a moment later, and it rejects outside a secure top-level context, which the hook also treats as "no answer" rather than "not installed".

A missing `beforeinstallprompt` is not that answer: Chromium also stays silent before its engagement heuristic is met, so treating silence as "installed" would have shown install steps to readers who already have the app. Display-mode detection stays out of the hook either way: `matchMedia` is viewport knowledge, which app code outside the shell may not hold.

## Worker headers

`apps/web/src/worker.ts` (Issue #40) gained the rules a PWA needs, covered by `apps/web/tests/worker.test.mjs`:

- `/sw.js`: `Cache-Control: no-cache` plus `Service-Worker-Allowed: /`. A cached worker script cannot be replaced by a deployment.
- `/manifest.webmanifest`: `application/manifest+json; charset=utf-8` and `no-cache`, whatever the asset server guessed.
- `/pwa/*`: `public, max-age=3600, must-revalidate`, because those names are stable across deployments.
- CSP now names `worker-src 'self'`, `manifest-src 'self'` and `connect-src 'self'` explicitly rather than leaning on `default-src`.
- `script-src` is `'self'` plus a `sha256` hash for each inline script in `index.html`, never `'unsafe-inline'`. Without it the theme bootstrap was blocked in production and a dark-mode reader saw a light frame until React mounted (Issue #76). `scripts/csp-hashes.mjs` derives the hashes from the HTML into `src/csp-hashes.ts`, `src/csp.ts` composes the header, `pnpm --filter web build` runs the generator first, and `tests/csp.test.mjs` fails if the committed module drifts from `index.html` or from the built `dist/index.html`.

## Verification

```sh
pnpm -r build
pnpm --filter web size:css
pnpm --filter web preview --port 4173 --host 127.0.0.1
# In another terminal:
XP_BROWSER_CHANNEL=chrome pnpm --filter web test:browser:pwa
# The CSP only exists in front of the Worker, so that check needs wrangler dev:
npx wrangler dev -c apps/web/wrangler.toml --port 8791 --ip 127.0.0.1
XP_BASE_URL=http://127.0.0.1:8791 pnpm --filter web test:browser:csp
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx lighthouse@12 http://127.0.0.1:4173/ --preset=desktop \
  --only-categories=performance,best-practices --chrome-flags="--headless=new" \
  --output=json --output-path=apps/web/evidence/lighthouse-desktop.json
```

`tests/pwa.browser.mjs` drives system Chrome against the production preview and checks four things a unit test cannot: Chrome parses the manifest with zero errors through `Page.getAppManifest` (Lighthouse 12 removed the PWA category, so this replaces the old installability audit); the worker controls the page and precaches the build manifest, including both local Inter subsets, after which an offline navigation to a never-visited `/settings` still renders; a byte-changed worker activates and produces the reload toast with 44px controls, which the reload then clears; and the install sheet lists its steps, contains focus and returns it. It writes `evidence/pwa-update-toast.png` and `evidence/pwa-install-M.png`.

`tests/csp.browser.mjs` drives system Chrome against `wrangler dev`, which is the only local server that sends the Worker's headers. Under `emulateMedia({ colorScheme: "dark" })` it loads `/`, `/inbox` and `/settings` and asserts that each response names a script hash, that neither the console nor the page's own `securitypolicyviolation` events report anything blocked, and that at the first animation frame, the frame before the first paint, `<html>` already carries `data-theme="dark"` and the body background is the dark surface token. A wrong hash fails it with a reported violation. It writes `evidence/csp-first-paint-dark.png` and `evidence/csp-first-paint-bootstrap.png`, the second captured with the app bundle blocked so the frame is the bootstrap's work alone.

Measured 2026-09-05 against `wrangler dev`, dark scheme, 1280x720:

| Frame | `data-theme` at first frame | Body background | Mean frame luminance |
|---|---|---|---|
| `/`, `/inbox`, `/settings` | `dark`, before the app mounts | `oklch(0.15 0.0048 250)` | 0.043 |
| Bootstrap only, app bundle blocked | `dark` | `oklch(0.15 0.0048 250)` | 0.043 |
| `csp-first-paint-dark.png` | `dark` | `oklch(0.15 0.0048 250)` | 0.04 to 0.11, depending on whether the app mounted before the capture |

The first two rows are read inside the page and are deterministic. The screenshot is taken one round trip after that frame, so how much of the app it contains varies between runs; the assertion is a luminance ceiling, not an exact figure.

**Known gap: the installed detection is verified only up to the match itself.**

Proven by the checks: the manifest parses in Chrome with zero errors while carrying the `related_applications` entry; the entry has the documented shape, with `platform: "webapp"`, a `url` that resolves to this origin's manifest, and an absolute `id` equal to the manifest `id` resolved against the route in `wrangler.toml`; and `navigator.getInstalledRelatedApps()` exists on the page and resolves without rejecting.

Not proven: that Chromium matches this entry to a real install. The list comes back empty in the checks, and an empty list is not evidence either way. Nothing is installed in the test profile, and the `id` names the production origin rather than the `127.0.0.1` one the checks run against, so an empty list is the only answer those runs could have produced. Installing a PWA needs the browser's own UI, which Playwright cannot drive, so the positive case has to be confirmed by hand: install the app from `https://xs_boilerplate.milkies.work/` in Chrome 140 or later, reopen it in a tab and read `await navigator.getInstalledRelatedApps()` in the console. It should list one entry whose `id` is that origin.

Lighthouse 12 against `vite preview`, recorded 2026-09-05 after the CSS diet in Issue #74:

| Run | Performance | Best practices | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| Desktop preset, `/` | 100 | 100 | 0.4 s | 0.6 s | 0 ms | 0 |
| Mobile, `/` | 96 | - | 1.9 s | 2.5 s | 20 ms | 0 |
| Mobile, `/inbox` | 96 | - | 1.9 s | 2.5 s | 20 ms | 0 |
| Mobile, `/settings` | 96 | - | 1.9 s | 2.5 s | 10 ms | 0 |

Total blocking time moves by a few tens of milliseconds between runs on a loaded host; the scores and paint times above were stable across repeats. The render-blocking-resources audit now scores 1 with nothing listed.

The render-blocking stylesheet that used to cap mobile at 85 is gone. `src/styles/globals.css` now imports only the CSS the app renders, Tailwind scans only the sources the app bundles, and the build inlines the result into `index.html`, so the document carries 109.7 kB of CSS (19.8 kB gzipped) and the page makes no blocking stylesheet request. The stylesheet is no longer a precache entry of its own.

**Known gap.** Mobile LCP is now bound by `assets/index-*.js`, 625 kB raw and 212 kB gzipped, of which Lighthouse reports about 120 kB unused. Part of it is vendored shell data that tree shaking keeps because `@xp/shells` re-exports everything from one entry. That is a JavaScript-bundle problem, not a CSS one, and belongs in its own Issue.
