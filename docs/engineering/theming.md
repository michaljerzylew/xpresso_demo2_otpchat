# Theming

`@xp/theme` adds semantic colours, font stacks, shadows and metric multipliers to the existing `@xp/core` fluid tokens. The default preset is `graphite`. All six presets support both light and dark mode; a preset name does not force a mode.

Graphite uses violet hue 285: primary chroma 0.16, accent 0.12 and neutral 0.006 (#129). Generated tones pass the contrast guard for all six presets. The app fixes control/card/pane radii at 8/12/16px, multiplied by `radiusScale`. Control floors are 44px on M/TP, 40px on TL and 36px on DS/DW with a fine pointer; coarse-pointer chrome retains 44px; DS navigation keeps its 32px whole-row windows and TL/DW sidebar rows keep their 34px exception. The PWA asset generator derives icons, favicon and manifest colours from this preset.

Graphite starts its sans stack with self-hosted Inter Variable. The Latin and Latin Extended weight-axis WOFF2 files and OFL licence live in `apps/web/public/fonts/`, copied from `@fontsource-variable/inter` 5.3.0 without a runtime dependency. Latin is preloaded in `index.html`; `unicode-range` loads Latin Extended only when its glyphs are needed. Both files are precached by the PWA. No remote font connection is needed. Other presets retain their system stacks.

## Use a theme

```ts
import { applyTheme, checkContrast, type ThemeSpec } from "@xp/theme";
import { presets } from "@xp/theme/presets";

const theme: ThemeSpec = {
  ...presets.aurora,
  spacingScale: 1.1,
  radiusScale: 0.8,
  shadowScale: 1,
  density: 1,
  overrides: {
    dark: { primary: { l: 0.8, c: 0.1, h: 165 } },
  },
};
console.table(checkContrast(theme));
applyTheme(theme);
```

`compileTheme(spec)` returns standalone CSS with font faces, `:root`, `[data-theme=dark]` and a system-preference fallback. It is safe to call on the server. `applyTheme(spec)` compiles first, then creates or replaces `<style id="xp-theme">` in the document head. It leaves the active mode untouched. Themes are trusted application configuration, not arbitrary user CSS.

Import `@xp/theme/theme.css` after core and component CSS, followed by `@xp/theme/tailwind.css`. The first file supplies the default preset and metric adapters; the second uses Tailwind 4 `@theme inline` to map utilities to the same runtime variables. `bg-surface`, `text-ink`, `border-border`, `text-primary`, `font-serif` and `shadow-m` therefore follow runtime changes. Tailwind's built-in colour palette is disabled. Core spacing/radius/type utility mappings remain intact.

## Token table

| Spec field / token | Contract |
|---|---|
| `fonts.sans`, `.serif`, `.mono` | Nonempty arrays of family names; emitted as `--xp-font-sans/serif/mono`. Generic family names remain unquoted. |
| `fonts.webfonts` | List of `{ family, src, weight?, style?, unicodeRange? }` faces. HTTPS or root-relative URLs, numeric weight or variable-weight range, normal/italic, `font-display: swap`. Optional `unicodeRange` accepts comma-separated CSS `U+` points, ordered ranges and wildcards within U+10FFFF; malformed/injected values throw. Graphite declares two local Inter subsets at weight `100 900`; other presets have no webfonts. |
| `colors.primary/neutral/accent/success/warning/danger` | Each seed has finite `hue` (degrees) and `chroma` (0..0.4). Generates eleven `--xp-<family>-50/100/200/300/400/500/600/700/800/900/950` OKLCH tones. |
| `--xp-surface`, `--xp-surface-raised`, `--xp-surface-muted` | Page, elevated chrome/overlays, secondary surfaces. Dark elevation is lighter than the page. |
| `--xp-ink`, `--xp-muted` | Main and secondary text on the three surfaces. |
| `--xp-<family>`, `--xp-<family>-soft`, `--xp-on-<family>` | Action/status text or filled surface, tinted background, text on the filled surface. Applies to all six families. |
| `--xp-border`, `--xp-focus`, `--xp-shadow-color` | Boundary, keyboard outline and shadow pigment. These are not text roles. |
| `--xp-color-<semantic>` | Component aliases for every semantic colour above, e.g. `--xp-color-muted` and `--xp-color-on-primary`. Emitted in each mode scope and backed by the same `--xp-<semantic>` value. |
| `spacingScale` / `--xp-space-scale` | Positive multiplier for every core fluid space token, including cqi, vi and paired sizes. Default 1. |
| `radiusScale` / `--xp-radius-scale` | Nonnegative multiplier for core radii; 0 makes corners square. |
| `shadowScale` / `--xp-shadow-scale` | Nonnegative multiplier for offset/blur of `--xp-shadow-s/m/l`; 0 removes elevation spread. |
| `density` / `--xp-density-factor` | Positive multiplier used by core `--space-*-d` tokens. It does not shrink touch-target floors or body type. Local `data-xp-density` remains available. |
| `overrides.light/dark` | Optional per-semantic-token `{ l, c, h }` overrides. Lightness is 0..1. An override affects only its named mode and token. |

Why a metric adapter: copying new metric poles would make themes and core disagree. The theme build reads core's generated CSS, retains its existing media segments and fluid cqi/vi expressions, and multiplies space/radius values. Type, layout detection, touch floors and shell region arbitration stay owned by core. Blocks do not read the viewport.

## Dark and light rules

`resolveColors` maps light border to neutral 200 and muted text to 600; dark border to 800 and muted to 400. All 72 intended text pairs pass for each preset. Dark page/raised/muted surfaces remain neutral 950/900/800. The workspace uses the page surface, so raised cards visibly separate from it in both modes.

Elevation uses `color-mix(in srgb, var(--xp-shadow-color) N%, transparent)` for each layer. Offsets and blurs below are multiplied by `shadowScale`, then emitted in rem (16px basis):

| Token | Layers: X Y blur / pigment opacity |
|---|---|
| `--xp-shadow-s` | `0 1px 2px` / 6% |
| `--xp-shadow-m` | `0 4px 12px` / 10%, `0 1px 2px` / 6% |
| `--xp-shadow-l` | `0 12px 32px` / 16%, `0 2px 6px` / 8% |

Cards use the small elevation; floating layers and sheets use large. The 1px boundary remains `--xp-border`.

1. `apps/web/index.html` runs a synchronous inline script before the app module or styles render. It reads `xp-theme-mode` from localStorage and sets `data-theme` plus `data-theme-preference` on the HTML element. Editing that script changes its CSP hash, so run `pnpm --filter web csp:hashes` (or any `build`) afterwards, or the Worker will block it in production and dark-mode readers get a light first frame; see [pwa.md](pwa.md).
2. Valid preferences are `light`, `dark`, and `system`. Missing/invalid/inaccessible storage selects system preference. Manual light/dark wins over the OS. With JavaScript unavailable, the stylesheet's media fallback still follows the OS.
3. `startThemeMode()` follows subsequent OS changes only in system mode and synchronizes storage changes from other tabs. It returns a cleanup function. `setThemePreference()` persists the choice and updates the document; storage errors still allow an in-memory choice.
4. `getThemePreference()` reads the current choice. Settings > Profile > Appearance and language (`/settings/profile`) retains the Light/Dark/System segmented control. Every segmented control, including the standalone primitive and configurator, uses an `--xp-surface-muted` track with a 1px `--xp-border`. Checked items fill with `--xp-ink`, use `--xp-surface` text and no shadow in both modes. Unchecked items are transparent with `--xp-muted` text and hover on `--xp-surface-muted`.

Field focus uses the primary border and primary-soft ring normally. Under `@media (forced-colors: active)`, inputs, selects and textareas in the workspace, portalled sheets, kit layers and kit fields restore a 2px solid `Highlight` outline with a 2px offset. This system colour follows Windows High Contrast; links and buttons retain their normal focus outlines.
5. The header's `Color mode` ghost button shows Sun in light and MoonStar in dark. It sets the opposite of the resolved mode and persists it in `xp-theme-mode`. `aria-pressed` reflects dark; the title names the next mode. Both glyphs stay mounted, crossfading and rotating 90 degrees over 200ms with `--xp-ease-out`. Reduced motion and the configurator's motion-off setting use opacity only at 80ms. Theme event subscriptions keep OS and cross-tab changes in sync and are disposed on unmount.

Dark mode uses lighter foreground tones and deeper surfaces, not an RGB inversion. Each semantic colour is generated in both modes. Chroma tapers near white/black and is reduced into sRGB before emitting OKLCH, so the compiler and contrast guard evaluate the same colour.

The default preset CSS is built before Vite starts, so the initial frame does not wait for `applyTheme()`. To change the initial preset, change the preset passed to `compileTheme` in `packages/xp-theme/build.mts` and rebuild. Runtime customisation is not persisted; only the user's mode preference is persisted. Persisting arbitrary specs and the visual configurator are outside Issue #37.

## Contrast guard

`checkContrast(spec)` returns failures as `{ mode, text, background, ratio, minimum: 4.5 }`. It checks 36 intended text/background pairs in each mode: ink/muted on all surfaces, each family on those surfaces and its soft surface, and on-family text on the corresponding filled surface. Ratios are compared without rounding. It reports overrides that fail instead of silently rewriting them. For another intended pairing, pass a second argument such as `[["ink", "primary-soft"]]`.

The calculation uses [CSS Color 4 conversion matrices](https://www.w3.org/TR/css-color-4/#color-conversion-code) and [WCAG relative luminance and contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). It covers opaque token pairs; it does not audit composited text over images, opacity, arbitrary DOM combinations or decorative borders. Test those at the consuming component. Tailwind mapping follows the [official theme-variable contract](https://tailwindcss.com/docs/theme#referencing-other-variables).

## Add a preset

1. Copy a JSON file in `packages/xp-theme/presets/` and change its seeds, font stacks and metric multipliers. Existing presets: graphite, paper, aurora, mono, warm, midnight.
2. Import it in `src/presets.ts` and add it to `presets`; `satisfies Record<string, ThemeSpec>` checks the JSON shape. Each preset is an independent plain JSON spec.
3. Run `pnpm -r build` and `pnpm --filter @xp/theme test`. Every registered preset automatically receives contrast and compilation tests. Supply local/HTTPS font assets before adding webfont entries.

## App integration and local gate

The vendored packages own the current app's colour mappings. `xp-primitives/styles/primitives.css` uses `--xp-color-*` for overlay surfaces, text, description, footer buttons, divider, handle, arrow, focus and segmented controls. `xp-shells/styles/shells.css` maps shared shell aliases on `:root` and shell containers so portalled navigation also inherits them. App bars, tab bars, rails, panels and navigation sheets use those aliases. Filled actions and identity marks use on-primary text, independently of raised surfaces. The app's `styles/theme.css` only supplies page defaults, typography, focus and mode-selector spacing.

Both package provenance files record these local changes. Bespoke skins not rendered by the current app still have upstream defaults; new routes that activate them must map their colours and extend browser coverage. Import the generated theme CSS whenever consuming the themed components.

```sh
bash scripts/check_no_hardcoded_colors.sh
pnpm --filter @xp/theme test
pnpm --filter web test
```

The grep gate scans all app source files and HTML for colour functions, hex literals, named colours and built-in palette utilities. It runs in `web:test`; no GitHub Actions are added. Primitive ramps and colour literals belong in the theme package. `transparent`, `currentColor`, semantic variables and `color-mix` of semantic variables are permitted. Pass a file/directory argument to check a fixture. The grep gate is a source-level check, not a browser contrast audit.

For browser verification, run `pnpm -r build` to generate theme assets, then start `pnpm --filter web dev --host 127.0.0.1 --port 5174` in one terminal. In another, use the already installed system Chrome (no browser download):

```sh
XP_BROWSER_CHANNEL=chrome XP_THEME_URL=http://127.0.0.1:5174 \
  pnpm --filter web exec node tests/theme.browser.mjs
```

Alternatively, serve the build with `pnpm --filter web preview --host 127.0.0.1 --port 4173` and omit `XP_THEME_URL` (the default is port 4173). `CHROME_EXECUTABLE_PATH` can explicitly select another installed executable; symlinks are resolved before launch. Stop the server when finished.

The script checks 1440×900, 834×1112 and 390×844 in both modes, one-click toggle and reload persistence, OS changes and keyboard selection in Settings, chrome colour aliases, horizontal overflow and the initial dark background while the app bundle is blocked. It loads text from both Inter subsets and verifies HTTP 200 with no Google font requests. The HTML loads CSS directly so this pre-module check works in development as well as in the production build.

At each viewport it opens the home route's More menu, rejects literal colours in primitive/shell rules matching mounted elements (including interaction states), and computes WCAG contrast for every visible overlay text node. It resolves CSS colours through an sRGB canvas with float16 readback, composites transparent ancestor backgrounds and text, and requires an unrounded ratio of at least 4.5:1. Unsupported image/filter/blend/opacity backgrounds fail explicitly rather than producing a misleading ratio. This fixture audit does not certify unused skins or arbitrary image-backed components.

Twelve screenshots are written under gitignored `apps/web/evidence/`: `{width}-{mode}.png` for the page, `overlay-{width}-{mode}.png` for desktop/tablet overlays, and `overlay-light.png` / `overlay-dark.png` for mobile overlays. Inspect the images as well as the printed contrast results. The review fix produced real Chrome evidence: the description measures 9.219:1 in light mode and 9.257:1 in dark mode, compared with the reviewer's previous dark result of 2.048:1.
