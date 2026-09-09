# Configurator

`/configure` customises the template while it runs. The panel drives `@xp/theme` directly, so the
app, the docked panel and five preview frames all change on the same frame. Nothing is generated
ahead of time and nothing is written to the repository: a configuration leaves as a file you copy in.

## Where the panel lives

The panel is not an overlay of its own. It is the route's inspector pane, so the shell's region
protocol decides its form and it can never fight another sheet.

| Class | Form | Reached by |
|---|---|---|
| DW | Docked inspector track, always visible | Nothing to open |
| DS | Docked inspector track, open on arrival | The labelled **Customise** toggle collapses it |
| TL | Side drawer on the shell's own gesture physics | The labelled **Customise** trigger |
| TP | Bottom sheet with tabs | The labelled **Customise** trigger |
| M | Bottom sheet with tabs | The labelled **Customise** trigger |

The sheet is the shell's own `Sheet` (a native modal dialog driven by `@xp/motion`), not a
component of the panel's. `RoutePanes` takes the labels, so the drawer and the sheet are announced
as "Customise" rather than as "Details", and the panel drops its own title inside them because the
sheet header already carries it.

On DW, DS and TL the four groups stack in one scroll. On TP and M they become tabs, because a sheet
that holds every group at once cannot be scanned. The trigger is a disclosure button named by its own
visible text, with `aria-expanded` carrying the state.

## The four groups

**Colour.** Six presets (graphite, paper, aurora, mono, warm, midnight). Each preset replaces the
seeds and metric multipliers. Fonts and layout are orthogonal and survive a preset change, so
choosing Aurora after picking Manrope keeps Manrope. Below the
picker, hue and chroma sliders steer primary, accent and the neutral tint, each above its own
eleven-tone ramp. Success, warning and danger sit behind a disclosure because three of the six seeds
are rarely touched. A line under the picker says whether you are on a preset or on an edit of one.

**Type.** Interface, editorial and code stacks from a curated list. System stacks fetch nothing. A
named family injects exactly one Google Fonts stylesheet, on demand, once per document, into the host
and into every preview frame. The specimen under the controls sets the same sentence in all three.

**Layout.** Four metric multipliers (corner radius, spacing, density, elevation) ride on the core
fluid tokens rather than replacing them. Four switches change the shell: sidebar (panel, icons,
hidden), content measure (reading, wide, full), rail (icons only, with labels) and motion (none,
reduced, fluid). Option words are unique across the panel, because three segmented controls sit
within one scroll.

**Export.** A CSS variables file, a JSON preset, an `xpresso.config.ts` module and a shareable link.
Import accepts a JSON file or pasted JSON.

## Contrast guard

Every seed row carries its measured headroom, and the group ends with the guard's report. On each
edit the panel measures all 36 intended text pairings in both modes and shows, per seed, the lowest
ratio that seed is responsible for. The number moves as you drag, so a pairing approaching the 4.5:1
floor is visible before it crosses it. The badge's accessible name says which pair, which mode and
which ratio it measured. The guard reports; it never silently rewrites a seed.

**The panel's own controls cannot produce a failure, and that is a property worth stating rather
than a badge worth trusting.** The ramp's eleven lightness poles are fixed, and a seed moves only
hue and chroma, so the contrast between a text tone and the surface under it has a floor the seeds
cannot cross. Swept over 2,880 reachable configurations, at the chroma extremes the import path
allows (0 and 0.4, wider than the sliders) and a 30-degree hue grid for every family against every
neutral, the lowest ratio measured is **6.52:1**. `apps/web/tests/configurator.test.mjs` keeps that
sweep as a test, so a future change to the poles, or an override reaching the panel, fails it.

Failure is reachable in the engine, through `ThemeSpec.overrides`, which the panel does not expose
and the import path drops. The panel's failure branch is therefore exercised by unit tests over
synthetic measurements rather than by a configuration nobody can reach. A pairing that spans two
seeds counts against both, because either one can fix it.

## Live preview

The strip renders the current app in five frames at the canonical class viewports (390×844, 768×1024,
1024×768, 1366×768, 1920×1080). A frame is a real document at a real width with `?xp=<class>` forcing
its class, so it exercises the same shell code as a real device, not a CSS approximation.

All five share one scale, measured from the rail with a `ResizeObserver` and set by the widest frame,
so the forms are comparable rather than merely present and no frame can be wider than the rail. The
scale is applied with `zoom`, not `transform`: a transform leaves a 1920px-wide layout box inside a
400px rail, which is real overflow and which the QA overflow gate is right to fail, while `zoom`
scales the box and the framed document keeps its own viewport. Scaling the box rounds that viewport
by a pixel or two (1920 becomes 1918, 768 becomes 769), which never changes the class a frame
resolves to, and `?xp=<class>` forces the class regardless; the caption states the canonical size.

On M and TP the strip is offered by a control instead of being mounted. Five live copies of the app
is not something a phone should boot unasked, and a phone page that scrolls five device frames is
exactly the stacked-desktop shape the QA founding-failure detector exists to catch.

Four details make the rest work:

1. **The host writes into the frames.** `applyTheme` only touches its own document, so a preview gets
   the same compiled CSS written into its head, plus the layout attributes and the resolved mode.
   Mode used to travel only through the `storage` event, which a frame that was still loading never
   received; the host now writes it in directly. CSS is only half of it: a framed panel renders its
   own sliders, ramps and readouts, so the host also publishes the state itself into each preview
   document, and the framed panel is a live read-only mirror rather than a snapshot of whatever it
   booted with. Its controls stay inert, so a preview cannot diverge from its host.
2. **A preview is sealed.** A framed document with `xp-preview=1` sets `inert` on its body, which
   removes it from the focus order, from pointer events and from the accessibility tree. Five live
   apps in the tab order would trap a keyboard user.
3. **Layout is attribute-driven.** React context cannot cross a frame boundary, so the sidebar,
   content measure, rail and motion switches are root attributes and one custom property that the
   shell's CSS reads. Every default equals the shell's behaviour with no attribute set.

4. **Only a preview is frozen.** The frozen variant keys on the configurator's own `xp-preview=1`,
   not on `xp-frame=1`. The device simulator and the QA harness both use `xp-frame=1` to get a
   canonical viewport without a host toolbar, and both must exercise the real route.

The route picker chooses which route the frames render, including the configurator itself; a framed
configurator shows the panel as a live mirror and does not nest a second strip.

A thumbnail you cannot open is a picture of the app rather than a look at it, so each frame carries
an **Open** action. It opens that class in a tab of its own through the shell's simulator, which
renders the canonical viewport at full size in a scrollable canvas.

## State, history and the link

State lives in three places, in this order of authority: the URL fragment, `localStorage`, the
default. A shared link is an instruction, so it wins over a return visit's stored state.

**The persistence boundary.** A saved configuration belongs to the whole app, not to this route, so
it is restored once before the first render (`src/configurator/boot.ts`, called from `main.tsx`).
Reloading Settings, or opening any route in a new tab, keeps the fonts, the metrics and the layout.
What is *not* persisted is the repository: nothing is written to the project, and the exported files
are the hand-off. A preview document is the exception both ways, because its configuration comes
from the host that frames it.

**Colour mode is the one field this configuration does not own.** It lives in the theme runtime's
`xp-theme-mode`, which the Settings control and the header menu write too, so two stores for one
preference would let a restored configuration undo a newer choice: pick Dark here, Light in
Settings, reload, and the stale copy would win. The panel therefore reads the mode from
`getThemePreference()` and writes it through `setThemePreference()` when the operator changes it or
undoes a change, and it follows the runtime's change event when the choice is made elsewhere. Restore
never writes it. A shared link may, because a link is an explicit instruction, and the exported
files carry it for the same reason.

The fragment key is `c` and the payload is URL-safe base64 of the JSON. The codec owns that one key
and leaves the rest of the fragment alone. Writes are debounced by 150 ms and use `replaceState`, so
dragging a slider does not fill the back button. The debounce is flushed on `pagehide`, because a
navigation or a closing tab inside that window would otherwise drop the last change. Serialisation is key-sorted: one configuration
always produces one string, whether it came from an edit or from a reload, so a reload never rewrites
the link.

Decoding never throws. A corrupt, truncated or foreign payload falls back to the default; a half-valid
one degrades field by field, clamping numbers to their slider range and wrapping hues. A partial
import inherits from the preset it names, so `{ "preset": "paper" }` really does give you Paper.

Undo and redo work by button and by `Cmd`/`Ctrl` + `Z` (add `Shift` to redo), except while typing in
a text field, where the browser's own undo belongs. A slider drag is one step: edits to the same
control coalesce within 600 ms. A click on a discrete control is always its own step, because two
clicks in a second must undo one at a time. The stack is capped at 50 steps each way.

## Export formats

| Action | Output |
|---|---|
| CSS variables | `xpresso-theme.css`: any webfont `@import` first, then the compiled `:root`, `[data-theme=dark]` and system-preference blocks, then the content measure. Replaces `@xp/theme/theme.css`. |
| JSON preset | `xpresso-preset.json`: the whole configuration, re-importable as-is. |
| Copy config | An `xpresso.config.ts` module that compiles on its own under `--strict`, typed against the real `ThemeSpec`. It exports `theme`, `fontStylesheets`, `layout`, `rootAttributes`, `contentMaxWidth`, `colorMode`, and one `applyConfiguration()` that loads the faces, applies the tokens, sets the colour mode through the theme runtime and sets the layout attributes. Anything it exports, it applies: naming a family without loading its faces, or a mode without setting it, would hand over a configuration that quietly differs from the one you chose. `apps/web/tests/configurator.browser.mjs` builds the generated file with `@xp/theme` resolved and runs it in a fresh light-mode context, asserting the mode, the loaded face, the metrics and the layout that come out. |
| Copy link | The current page URL with the state fragment. |

The layout switches are not CSS, so the CSS file's header carries the `<html>` attribute line to copy
alongside it.

## Accessibility and motion

Native controls throughout: range inputs for the seeds and multipliers, selects for the fonts, radio
groups for the presets and the switches. Coarse pointers get 44 px targets, including sliders and
disclosure summaries; fine pointers get a denser 32 px. Focus is visible on the theme's focus token.

The panel binds no motion of its own. The shell binds `press` to every control in the workspace and
in each sheet, so a second binding would fight it. The motion switch is therefore read where the
shell binds: `src/shell/motion.tsx` turns the `data-xp-motion` attribute into `@xp/motion` options
and passes them to press feedback, the inbox stagger, Flip layout changes, anchored arrivals, route
transitions and the sheet gesture physics. `none` bypasses the tween, `reduced` takes the package's
gentle path, and the OS reduced-motion preference still applies on top of `fluid`. `shell.css` covers
the declarative half of the same switch.

## Verify it

```bash
pnpm -r build
pnpm --filter web dev --host 127.0.0.1 --port 5181
# in another terminal
XP_BROWSER_CHANNEL=chrome XP_BASE_URL=http://127.0.0.1:5181 \
  node apps/web/tests/configurator.browser.mjs
```

The QA harness (`pnpm qa <run-id>`) covers `/configure` in its `default` and `panel-open` states
across five classes, both modes and both motion settings. The suite below covers what the harness
does not: the live behaviour.

The suite opens `/configure` in all five classes and both modes; changes preset, hue, chroma, tint,
font, all four multipliers and all four layout switches; asserts the tokens and the shell change and
that every frame follows in colour, metric, font and mode; exercises undo and redo by button and by
keyboard; round-trips the link through a reload; downloads both files, reads both clipboard payloads,
imports valid and invalid JSON; checks 44 px targets on coarse pointers, panel text contrast against
its composited background, and that Tab reaches the panel without stopping on a preview frame. It
writes eighteen screenshots to gitignored `apps/web/evidence/` and fails on any page, console or
HTTP error.

It also measures the press tween instead of trusting the switch: with fluid motion a pressed control
settles at scale 0.9700, with the OS reduced-motion preference at 0.9970 (a tenth of the deviation,
as the doctrine requires), and with motion set to none at exactly 1, because the tween is bypassed.

Unit tests for the codec, the history reducer and the export formatters run in `pnpm --filter web test`.

## Limits

Runtime configuration is not persisted into the repository; the exported files are the hand-off. The
guard covers opaque token pairs, not text over images. The strip runs five copies of the app, so it is
a development and configuration surface, not a page to leave open on a slow device. `frame-ancestors` in
`src/csp.ts` is `'self'` so the app can frame itself; foreign embedding stays blocked.
