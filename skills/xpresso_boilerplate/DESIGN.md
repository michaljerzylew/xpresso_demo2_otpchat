# DESIGN.md: the premium and native-feel law

**Read in full at RECON and again at SKIN.** Premium here is not an adjective, it is a set of
thresholds that the harness measures. A screen that reads cheap has broken one of the rules below,
and the rule tells you which.

Geometry follows the v3.0.0 skin contract. Source citations identify the owning file and line. Paths
are relative to the repository root, with two shorthands used throughout: **`shell.css`** means
`apps/web/src/shell/shell.css` and **`AppShell.tsx`** means `apps/web/src/shell/AppShell.tsx`. A path
that names a demo module (`modules/inbox/…`, `modules/work/…`, `modules/home/…`,
`data/harbor-session.ts`), the motion lab, `scripts/qa/inbox-vendor-sentences.mjs` or
`docs/product/vision.md` is in the **source checkout** (`apps/web/project.json` → `source`); a bare
project does not carry it, and line numbers given for `apps/web/src/App.tsx` are the source's unless
stated.

## 1. The bar, per device class

One codebase, five products. The class picks the interaction family; the component's own container
picks its continuous geometry. Both axes always, never one.

| Class | Width | It must read as | Anatomy it gets | Forbidden |
|---|---|---|---|---|
| **M** | <600 | a native phone app someone installed and kept | top bar, five-tab bottom dock with a More sheet, one active pane, bottom sheets, safe areas paid | a stacked desktop DOM; a table; a hover-only affordance; a primary action out of thumb reach; content under the dock |
| **TP** | 600-839 | a real tablet app in portrait | compact top bar whose title opens the module sheet, section switcher under it, two panes where the screen is list plus detail, inspector as a sheet | a stretched phone layout; a module link row in the top bar; a desktop sidebar squeezed in |
| **TL** | 840-1199 | a real tablet app in landscape | left icon rail, list pane with a section strip at its top, detail pane, inspector as a side drawer | a strip spanning both panes; a phone dock; a sidebar that eats the list |
| **DS** | 1200-1599 | a desktop application on a laptop | sidebar with the module and section tree, content, inspector toggled and overlaying below 1400px | a centred blog column; a phone sheet for the inspector; half-drawn rows in the sidebar |
| **DW** | 1600+ | a flagship desktop workspace | icon rail, section sidebar 240-280px, content, persistent inspector 320-360px | a max-width island in the middle of a 2000px screen; a toggled inspector; the phone's row heights |

Doctrine table: `docs/product/vision.md` §3. Runtime boundaries and the pointer tie-break:
`packages/xp-runtime`. Coarse-pointer portrait windows at 840-899 resolve to TP. Open overlays and
active drags lock the class until release.

**The test for each class:** show the frame to someone and ask which platform it is from. If the
answer for M is "a website", the screen is not done.

## 2. Measurements that are not negotiable

**Message composer (shell contract, #131).** Inbox and Copilot use `shell/composer.css` via
`data-xp-composer`: full pane content width, no 40rem cap, transcript inline padding retained.
The raised surface has a 1px `--xp-border`, `--radius-l` (16px) on TL/DS/DW and `--radius-m`
(12px) on M/TP, `--xp-shadow-s`, and 12px 16px padding (10px 12px on M). Focus uses a
primary border and a 3px primary-soft ring. The transparent borderless field is 15px/1.5
(14px on M), resting at 3.5rem (56px) on TL/DS/DW or 3rem (48px) on M/TP; native `field-sizing: content`
grows to 40dvh, then scrolls internally, with no manual resize or JavaScript measurement.
Labels remain accessible but visually hidden.

One bottom row contains the 28px Reply/Note pill (12px/500 text, muted track with a 1px border,
the shell's checked `--xp-ink` fill and `--xp-surface` text, without shadow; unchecked
transparent with muted text in both modes) before ghost tools, then the 36px primary ArrowUp send circle. M/TP tool and send targets
are 44px; mode targets are also 44px around their 28px visual pills. Fine tools are 32px.
Slots below 36rem disclose attachment/reference/draft tools through one labelled tool menu with
at least 44px rows, 8px padding and matching borders on file labels and buttons, so
the row never wraps; saved replies remain directly available. Roomy suggestions are 28px pills
above the surface, the shortcut is 11px muted, and session disclosure is 12px below it on one
line (ellipsis on narrow slots). Copilot keeps Images left, model title + chevron right beside
send, and attachments above the row. Roomy Copilot uses `↵ sends`; Inbox uses `⌘↵ sends`.
The decorative shortcut stays 11px and aria-hidden by the operator's explicit brief, an exception to the gate-visible text floor.
Note mode retains the whole-surface warning tint.
Send presses use a single CSS owner (`data-no-press`), .96 scale for 120ms with `--xp-ease-out`;
reduced/off motion drops scaling. Sent colour transitions take 200ms and confirmation lasts
1.4s. Sticky offsets, transcript scroll ownership, mobile dock and row budgets are unchanged.

Why: a common surface prevents the two composers drifting in height or control geometry;
progressive disclosure preserves target floors where displaying every tool would overflow.

**Safe areas and viewport.** `viewport-fit=cover` is opted into once (`apps/web/index.html:6`). The
four insets are declared once on `:root` as `--xp-safe-*` (`shell.css:3-9`) and only the shell spends
them. Height is `100svh` then `100dvh` (`shell.css:45-46`), never `100vh`. Non-M content pays the
bottom inset (`shell.css`); M content reserves the dock height as a margin (in the same file).

**Control floors.** The shell publishes `--xp-control-height`: 44px on M/TP, 40px on TL and
36px on DS/DW with a fine pointer. A coarse pointer retains 44px chrome, including the rail and sheet grip. Shared controls use `max(var(--tap-min), var(--xp-control-height))`; ghost icon
buttons use square boxes at the class height. Sheets inherit the same floor; their grip spans the
panel on one axis. Dock tabs remain 56px tall inside a 72px dock. Desktop headers are 56px;
heading 15px/600 and workspace label 12px muted. Buttons use 13.5px/500, radius-s; field focus
uses a primary border and a 3px primary-soft ring. Under `@media (forced-colors: active)`, all these fields, including portalled controls, restore a 2px solid `Highlight` outline with a 2px offset. Links and buttons keep visible outlines.

**Navigation exceptions stay independent.** DS sidebar rows are 32px and its windows round to
32px steps; TL/DW sidebar rows retain 34px. Anchored module-layer rows remain 34px on TL/DS/DW,
44px on TP. Changing only a row or its window reopens #60/#101. Current navigation uses
primary-soft with primary ink. A 28px brand mark accompanies a 14px/600 brand and 12px workspace.
Section labels are uppercase, .06em tracked, 12px (the QA minimum), with 8px divider spacing.

**Whole rows or nothing.** The DS module list window is `round(down, 50cqh, 32px)` with
`scroll-snap-type: y mandatory`; the section tree window is `round(down, 100%, 32px)`; rows are
`flex: 0 0 32px` with `scroll-snap-align: start` (`shell.css:200-215`). The anchored layer budgets
from the viewport, never from a container query, and gives each of its two lists half rounded down to
whole rows with `gap: 0` (`shell.css:398-405`). A half-drawn row is a defect. So is a list that
scrolls without a signal that it scrolls.

**Scrollports.** Eight named scrollports, every one with `overscroll-behavior: contain`
(`shell.css:73,78,122,123,131,202,210,403`). Navigation scrollports keep a visible 8px scrollbar that
appears only on real overflow, because macOS overlay scrollbars fade (`shell.css:84-93`). The current
entry is revealed by arithmetic against whichever ancestor actually scrolls, re-run on a
ResizeObserver (`AppShell.tsx:298-325`).

**Tracks and rails.** Pane grid: one track by default, `minmax(240px,.65fr) minmax(0,1.35fr)` with a
list, plus a fixed 336px inspector track (`shell.css:118-121`). TP list track
`clamp(320px, 45%, 360px)`. Rail 64px, sidebar 256px; labelled rail 184px, compact sidebar 68px.
Content measure switch is `--xp-content-max` on the pane body (`shell.css:368`); core rails are
`--rail-content: 80rem` and `--rail-wide: 100rem`. Prose measures are fixed, not fluid:
`--measure-narrow: 45ch`, `--measure-body: 64ch`, `--measure-wide: 72ch`.

**Row heights per class.** `--xp-row-height` is 64px by default, 72px on M, 56px on DW
(`shell.css:147,223,235`). A phone row that is 56px tall reads cheap; a DW row that is 72px tall
wastes a workspace.

**Touch feel.** `touch-action: manipulation` on every interactive element, which kills the 300ms tap
delay, plus `-webkit-tap-highlight-color: transparent` (`shell.css:49,60-61`). The active state is a
token tint, never a grey flash: `:is(button,a):active { background: var(--xp-primary-soft) }`
(`shell.css:64`). Focus ring is `2px solid var(--xp-focus)` with a 2px offset. Hover is gated on
capability, never on width: `@media (hover: hover) and (pointer: fine)` (`shell.css:281-285`).

**Sheets and drawers.** The sheet is a native `<dialog>`: the motion package supplies gesture
physics, the dialog supplies modality, focus trap and Escape (`shell/Sheet.tsx`). Bottom sheet is
`min(90dvh, var(--sheet-block-limit, 32rem))` with top corners at `--radius-l`; the side drawer is
`min(88vw, 22rem)`. While a sheet owns the screen the workspace subtree is `aria-hidden` and the dock
is `inert`; focus returns to the trigger only after the sheet releases the host
(`AppShell.tsx:345-350`).

## 3. Colour: roles only

Never a literal. The colour gate fails any hex, any `rgb/hsl/oklch/color()`, any Tailwind palette
utility and any CSS named colour in app source (`scripts/check_no_hardcoded_colors.mjs:39-46`); it is
wired into `pnpm --filter web test`.

**Use these roles.** Surfaces `--xp-surface`, `--xp-surface-raised`, `--xp-surface-muted`. Text
`--xp-ink`, `--xp-muted`. Chrome `--xp-border`, `--xp-focus`, `--xp-shadow-color`. Per family
(`primary, neutral, accent, success, warning, danger`): `--xp-<family>`, `--xp-<family>-soft`,
`--xp-on-<family>`. Metrics `--xp-space-scale`, `--xp-radius-scale`, `--xp-shadow-scale`,
`--xp-density-factor`, `--xp-shadow-s|m|l`.

**Both modes, always.** `resolveColors` maps ramp steps per mode; in light, `surface-raised` is pure
white. `checkContrast` returns every intended pair below 4.5:1, unrounded, in both modes, and it
reports rather than rewrites (`packages/xp-theme/src/theme.ts`). A theme whose contrast list is not
empty does not ship.

**Graphite skin tokens.** Primary hue/chroma 285/0.16, accent 285/0.12, neutral 285/0.006.
Light border/muted use neutral 200/600; dark uses 800/400. Dark page/raised/muted stay 950/900/800;
cards must visibly separate from the page. All six presets pass the intended contrast pairs.
Shadows use `color-mix` on `--xp-shadow-color`: s = 0 1px 2px at 6%; m = 0 4px 12px at 10%
plus 0 1px 2px at 6%; l = 0 12px 32px at 16% plus 0 2px 6px at 8%. Multiply geometry by
`shadowScale`. Cards use s, popovers/sheets l. Every segmented control uses a `--xp-surface-muted`
track with a 1px `--xp-border`; checked items fill with `--xp-ink`, use `--xp-surface` text and no shadow in both modes. Unchecked items are transparent with `--xp-muted` text and hover on `--xp-surface-muted`. Metric glyphs sit in 28px primary-soft circles;
values are 28px/650 tabular, labels 13px and support 12px. The compact mobile summary keeps its
existing 24px values and omits glyphs so all four metrics fit. Status pills use 12px/500 and 2px 8px
padding. Desktop tables have 12px uppercase headers, a 44px row floor and a quiet hover tint.

**Presets.** `graphite` (violet, monochrome accent, default), `paper` (pure grey, airy, tight
corners, flat), `aurora` (teal and magenta, rounder), `mono` (achromatic, square, no elevation,
dense), `warm` (amber and terracotta, roomiest), `midnight` (indigo and cyan, deeper shadow). Pick
one, or compose a spec from six seeds with `{hue, chroma}` plus the four multipliers. Shadows are
derived from the scale, never hand-written.

**First paint.** A synchronous inline bootstrap in `<head>` sets `data-theme` before styles load, so
a dark reader never sees a white flash. The default preset is compiled into `theme.css` at build
time. The two `theme-color` metas ship empty and are filled from tokens at start-up. Editing that
inline script changes its CSP hash: rerun `pnpm --filter web csp:hashes` or the Worker blocks it and
dark readers get a light first frame.

**Changing the default preset touches seven places, all together:**

| # | File:line | What it decides |
|---:|---|---|
| 1 | `packages/xp-theme/build.mts:19` | the compiled theme stylesheet, so the first paint |
| 2 | `packages/xp-theme/build.mts:20` | which semantic names the Tailwind bridge maps |
| 3 | `apps/web/src/configurator/config.ts:109` | the configurator's default state |
| 4 | `apps/web/scripts/generate-pwa-assets.mts:23` | manifest colours, icon plate and mark, favicon |
| 5 | `apps/web/src/pwa/theme-color.ts:10` | browser chrome colour per mode |
| 6 | `apps/web/tests/pwa.test.mjs:55` | the preset-specific manifest assertions |
| 7 | `apps/web/src/configurator/config.ts:5` and `apps/web/src/configurator/ConfiguratorPanel.tsx:24` | the preset list and its labels |

## 4. Type, space, radius

All numbers live in one file: `packages/xp-core/tokens/xpresso.fluid.config.json`.

- **Type.** Eight fluid steps with per-class poles: body 16 to 17px on M, 18.5 to 19.5px on DW, with
  the modular ratio rising from 1.2 to 1.333. Bind the **semantic roles** (`--role-<name>`), not raw steps. Slope caps
  exist so a step cannot grow past WCAG 1.4.4.
- **Space.** `--space-s` is the rhythm unit and grows only with the window: 16 to 17px on M, 23 to
  26px on DW. Ten multipliers from `3xs` (0.25) to `4xl` (8), plus thirteen interpolating pairs
  (`--space-<from>-<to>`). Width buys rhythm, not more elements per row.
- **Radius.** The core emits per-class fluid radii, and **the app deliberately overrides them to
  fixed product geometry** so control, card and pane corners do not drift between classes.
- **Density** is not a space multiplier. It is an opt-in axis a shell sets with
  `--xp-density-mode: compact|comfortable`. Floors: `--tap-coarse: 44px`, `--tap-fine: 24px`,
  `--gap-min: 8px`.
- **Containers.** Every content region is an `.xp-slot` with `container: xp-slot / inline-size`. That
  is how content adapts without reading the viewport. Route content that queries a width has broken
  the two-axis law.

## 5. Motion repertoire: what to bind, and where

The header Color mode switcher is a ghost button with both Sun and MoonStar mounted. It changes
the resolved mode to its opposite and persists the explicit preference. `aria-pressed` means dark;
its title names the next mode. Glyphs crossfade and rotate 90 degrees over 200ms, `--xp-ease-out`.
OS reduced motion and `data-xp-motion="off"`/`"reduced"` remove rotation and use an 80ms opacity
transition. The demo's Settings > Profile (`modules/home/WorkspaceSettings.tsx` in the source) keeps
the three-way Light/Dark/System segmented control; your own settings screen renders `ThemeControl`
the same way.

The shell already owns the lifecycles. Consume them; never bind a second animation to a target the
shell animates.

| Surface | Use | Owned by |
|---|---|---|
| Every button and link | `press` | `shell/motion.tsx:70-95`, mounted on the workspace, sheets and kit layers |
| A surface taking a place in the layout (popover, menu, revealed sidebar, docked inspector, toast) | `enter` / `exit` with the trigger, so the origin is measured | `shell/motion.tsx:377-379`, `shell/KitLayer.tsx:43` |
| List, table or deck rows on direct-load first paint only | `stagger` | `shell/motion.tsx:118` (`useFirstPaintStagger`), `shell/motion.tsx:157` (`useOwnArrival`) |
| Route change and in-route paging | `routeTransition` | `shell/motion.tsx:435` (`RouteStage`), `shell/motion.tsx:276` (`PagerStage`) |
| Bottom sheet, side drawer, swipeable deck | `sheet` | `shell/Sheet.tsx:80`, `shell/motion.tsx:211` (`useSwipeDeck`) |
| Panes surviving a layout change (sidebar expand, inspector dock) | `flipLayout` | `shell/motion.tsx:357-366`; callers `AppShell.tsx:353,449` |
| A launch or hero headline, once per session | `kineticHeadline` with `frequency: "rare"` (required, throws otherwise) | `shell/motion.tsx:340-354` |
| One-time below-fold reveal | `revealOnScroll` | Bound only in the motion lab (`apps/web/src/motion/MotionDemo.tsx:43`), which `scripts/create_project.sh` excludes, so in your app it starts unbound. Bind it in the shell, once |
| Post-paint engine warm-up | `warmMotion` | **Already bound in `apps/web/src/App.tsx`** (`:213` in the source, `:44` in a bare project). Do not add a second owner |

**Numbers.** Easing: `--xp-ease-out` for entrances and feedback, `--xp-ease-in-out` for moves between
visible positions, `--xp-ease-drawer` for programmatic sheets. No ease-in, no elastic, no back, no
bounce, anywhere, ever. Durations: press 120ms down and 80ms up, UI 200ms, a large sheet 320ms as a
documented exception, a rare headline 600ms. Route travel: M 48px slide and fade, TP and TL 20px pane
move, DS and DW 4px lift crossfade. Press is `scale 1 - 0.03` with opacity 0.85. Entrances are
`scale 1 - 0.04` from opacity 0 with the origin measured against the trigger. Stagger is an 8px
y-offset, gap clamped 30-80ms, group delay capped at 200ms. Sheet release targets the nearest snap to
`position + project(velocity)`, rubber-bands out of range, and settles critically damped so it cannot
overshoot.

**Frequency gate.** Keyboard-initiated or hundreds of times a day: apply the final state, do not
animate. Tens of times a day: press feedback only. Occasional: standard transitions. Rare or first
visit: a headline or a one-time reveal. Keyboard detection is a click with `detail === 0` plus a
document-level modality record.

**Reduced motion, and the repository's two idioms.** Package physics scale rather than switch off:
travel to 10%, scale deviation to 10%, duration to 70% bounded 80-200ms; a sheet crosses its distance
in two invisible 5% legs capped at 12px each and lands on the exact snap coordinate; direct pointer
tracking stays 1:1. Declaratively there are exactly two idioms and a sweep must know both:

| Idiom | Where | Example |
|---|---|---|
| Wrap in `no-preference`, so the transition is never declared for a reader who asked for none | `apps/web` | `modules/inbox/inbox.css:492-495`, `modules/inbox/inbox.css:501-510`, `modules/inbox/inbox.css:516-518` |
| Declare unconditionally, then reset per block under `reduce` | `packages/*` | `packages/xp-primitives/styles/primitives.css:521-531`, `packages/xp-shells/styles/shells.css:5747` |

Named as a deliberate pair in `docs/engineering/motion-wiring.md:106-111`. A reduce rule must name
the property: a bare duration leaves `transition-property: all`.

**Budget.** Any transition or animation whose duration plus delay exceeds 300ms fails the gate,
unless the element carries `data-qa-motion="launch"` and stays inside its own `--xp-dur-launch`
(`scripts/qa/gates.mjs:46-67`). An infinite animation always exceeds it: a looping shimmer is
impossible in this codebase, so a skeleton sweeps once.

## 6. Content and states

- **Empty, loading and error are screens, not messages.** Every one gets a form per class and a
  registered capture state. The empty state offers the next action; the error state offers a retry;
  the loading state is a skeleton with the shape of the content that is coming, not a spinner and not
  a line of text (`modules/inbox/components.tsx:170`).
- **Status is a colour dot plus a label**, never colour alone.
- **Realistic data, in the app's own voice.** No lorem ipsum. No vendor names, no vendor sentences:
  `shadcn_templates/` and any licensed reference are read-only inspiration; the gate is
  `apps/web/tests/vendor-copy.test.mjs` (a fixed sentence list plus seven vendor brand names, under
  `pnpm -r test`), and `scripts/qa/inbox-vendor-sentences.mjs` is a source-checkout tool that needs
  the gitignored templates.
- **Copy is part of the design.** One primary action visible per screen. Buttons say what happens.
  Destructive confirms name exactly what leaves and where it is restored from
  (`modules/work/WorkScreen.tsx:158`).
- **Icons:** shell navigation and controls use 18px with stroke width 1.75; module-inline icons
  are 14 to 16px. The product vision and shell share this contract. Use consistent lucide metaphors.

## 7. Brand, icons, PWA, install

Graphite ships self-hosted Inter Variable, Latin and Latin Extended WOFF2 subsets from
`@fontsource-variable/inter` 5.3.0, plus its OFL licence in `apps/web/public/fonts/`. It is not a
runtime dependency. Inter leads the sans stack; `weight: "100 900"` enables variable weights.
Theme font faces accept validated `unicodeRange` strings and emit `unicode-range`, so Latin
Extended loads only for its glyphs. Preload Latin in `index.html`; PWA precaches both files. No
Google font request belongs to the default skin. Configurator selection/export retains Inter;
other presets keep their original system stacks and explicit remote font choices remain opt-in.

The app is installable and looks installed. A new app **must replace**:

1. `apps/web/wrangler.toml`: `name`, route pattern and zone. The manifest's
   absolute web-app id is derived from that pattern.
2. `apps/web/brand/icon.svg`, the single source for all five icons and the favicon.
3. `pwa.description`, `pwa.shortcuts` and `pwa.screenshots` in `apps/web/src/app-modules.ts` (the
   generator already substitutes `name` and `short_name`; `categories` is the one literal left in
   `apps/web/scripts/generate-pwa-assets.mts`).
4. `apps/web/index.html`: description, `apple-mobile-web-app-title` and `<title>`.
5. The screenshots: two PNGs of your own screens (phone-narrow and desktop-wide) taken from your
   QA run under `apps/web/evidence/<run>/`, listed in `pwa.screenshots`, then copied in and sized by
   `pwa:assets --screenshots`. In a generated project `pnpm --filter web evidence` is the full
   registry capture, not a screenshot cut.
6. The default preset in all seven places from §3, if the theme changes.
7. The CSP hashes, after any inline-script edit in `index.html`.

```sh
pnpm -r build
pnpm --filter web pwa:assets                          # icons, favicon, manifest
# list two PNGs from apps/web/evidence/<run>/ in pwa.screenshots (app-modules.ts)
pnpm --filter web pwa:assets --screenshots             # copy them in, size them
pnpm --filter web csp:hashes                           # after any index.html inline-script edit
pnpm -r build
pnpm --filter web size:css
pnpm --filter web test
XP_BROWSER_CHANNEL=chrome pnpm --filter web test:browser:pwa
npx wrangler dev -c apps/web/wrangler.toml --port 8791 --ip 127.0.0.1
XP_BASE_URL=http://127.0.0.1:8791 pnpm --filter web test:browser:csp
```

`apps/web/tests/pwa.test.mjs` re-runs the manifest builder and fails if the committed file differs,
so regenerating on a clean tree is always a no-op. What the PWA claims: install, standalone launch,
offline open, self-update with a prompt. What it does not claim: background sync, push, or offline
writes that outlive the session.

## 8. The gates that police appearance

| Gate | Threshold | Where |
|---|---|---|
| Hardcoded colour | any literal colour in app source: exit 1 | `scripts/check_no_hardcoded_colors.mjs:39-46` |
| CSS budget | render-blocking CSS <= 61,440 B gzipped | `apps/web/scripts/css-size.mjs:7` |
| Animation budget | duration + delay > 300ms fails, launch surfaces excepted | `scripts/qa/gates.mjs:46-58` |
| Tap targets | >= 44px on M and TP, >= 24px elsewhere, measured on the element or its wrapping label | `scripts/qa/gates.mjs:31-36` |
| Overflow | `scrollWidth > clientWidth + 1` on any visible element and on the document | `scripts/qa/gates.mjs:20-30` |
| Founding failure | an M page taller than 1.25 viewports fails; INACTIVE when the DW baseline does not fit either | `scripts/qa/gates.mjs:86-95` |
| Min font size | computed size < 12px fails | `scripts/qa/gates.mjs:38-41` |
| Alt text | a visible `img` with no `alt` attribute fails; empty `alt` is allowed | `scripts/qa/gates.mjs:42-45` |
| Reduced motion | in reduce runs, no spatial transition or animation, and the query must actually match | `scripts/qa/gates.mjs:56,67-73` |
| Console errors | any console or page error during navigation, setup or capture | `scripts/qa/capture.mjs:97` |
| Focus trap | one open dialog, focus enters, Tab and Shift+Tab both cycle without escaping | `scripts/qa/gates.mjs:97-121` |
| Contrast | unrounded ratio >= 4.5:1, on computed colours | `apps/web/tests/contrast.mjs`, tokens `packages/xp-theme/src/theme.ts` |
| Cadence | >= 58 fps average under 4x CPU throttle, two conclusive repetitions required | `scripts/qa/perf.mjs:8,43,96` |

A gate that observed nothing is recorded INACTIVE and never counts as a pass. A gate that does not
apply is NA. The harness aborts on consecutive setup failures rather than printing a green report.

## 9. Definition of perfect

`<source>/docs/product/vision.md:76-85` (the generated project's `docs/product/vision.md` is your stub, not the doctrine), quoted verbatim, so read "HARBOR data" in point 7 as your app's own realistic data:

> 1. Native form: the screen uses the class's anatomy from §3; no stacked desktop DOM on M/TP; no phone UI stretched on DW.
> 2. Geometry: no horizontal overflow, no orphan rows, no cut text, no element under the tab bar or the safe area.
> 3. Ergonomics: tap targets >= 44px on coarse pointer, >= 24px fine; thumb-reachable primary actions on M.
> 4. Hierarchy: the job of the screen (glance / browse / compare / read / act / navigate) survives; one primary action visible.
> 5. Theme: both modes correct, AA contrast, no hard-coded colours, no white flash.
> 6. Motion: budgets respected, no bounce, no animation on keyboard actions, sheet physics correct, 58+ fps.
> 7. Content: realistic HARBOR data, states (empty/loading/error) present, no lorem ipsum, no vendor names.
> 8. Consistency: same component looks and behaves the same in every module; icons, spacing and copy tone unified.
> 9. Accessibility: focus visible, overlays trap focus and restore it, DOM order = reading order, alt text present.
> 10. Links: cross-module links from §2 work and land on the right screen in the right pane.

A screen is CLEAN only when one QA run passes all four evidence layers on all five classes in both
themes: visual captures reviewed by the perceiver, machine gates on the rendered DOM, interaction
tests, and source plus performance checks.

## 10. Per-screen premium checklist

Run this before you call any screen finished. It is the difference between passing gates and looking
like a product.

- [ ] Five forms named in the module's `forms.ts`, and no two classes share a JSX tree where the job
      changes: the diff between the two class branches is not empty.
- [ ] The screen's job (glance, browse, compare, read, act, navigate) is obvious in the first frame,
      and exactly one primary action is visible.
- [ ] The first viewport is not empty and not overloaded: on M the primary action is thumb-reachable,
      on DW the workspace uses its width instead of centring a column.
- [ ] Empty, loading and error forms exist, are registered, and offer the next action.
- [ ] Every collection has search, filter and sort, and every filter that can match nothing has an
      empty state that says so in the domain's words.
- [ ] Both themes checked on the real screen, not on tokens.
- [ ] Press feedback on every control; entrance origins measured from their triggers; nothing left
      with a stale `will-change` or transform context.
- [ ] Keyboard: full traversal, visible focus, overlays trap and restore, no animation on
      keyboard-initiated surfaces, every gesture has a twin.
- [ ] Copy in the app's voice, no placeholder, no vendor string, numbers formatted for the locale.
- [ ] Registered in `qa/screens.ts` with every state, and the producer exists in the module's own state file (`scripts/qa/<module>-states.mjs`, named by `qaStates` in `apps/web/src/app-modules.ts`).
