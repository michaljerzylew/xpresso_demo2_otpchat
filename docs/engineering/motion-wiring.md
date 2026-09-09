# Motion wiring in the shells and routes

Issue #71 attaches the `@xp/motion` primitives (#38) to the five real application shells (#36). It closes the
shell-wiring criterion that #38 deferred. The doctrine in [motion-doctrine.md](motion-doctrine.md) is the contract;
this page records what is wired, where it lives, and how it was measured.

## Ownership

The shell owns every binding; routes stay declarative. `apps/web/src/shell/motion.tsx` holds the bindings and the
route stage, `apps/web/src/shell/Sheet.tsx` the modal sheet, and `apps/web/src/shell/AppShell.tsx` composes them.
Routes import `RoutePanes` and `KineticHeadline` from the shell and never touch a primitive, a viewport read or a
width media query, so the Two-Axis guard (`apps/web/tests/two-axis.test.mjs`) still holds.

One `MotionProvider` and one import of `@xp/motion/styles/motion.css` are mounted in `AppShell`. The isolated
`/motion` lab keeps its own provider and is unchanged.

| Shell surface | Primitive and lifecycle |
| --- | --- |
| `RouteStage` (the outlet) | `routeTransition(outgoing, incoming, { device, direction, input })` on every pathname change. The outgoing tree stays mounted, `inert` and `aria-hidden`, until its transition completes; a new navigation retargets from the current presentation and prunes the stale pane |
| M "More" secondary navigation | `sheet(surface, { handle, snapPoints: [0, height] })` inside a native modal `<dialog>`; opened with `snapTo(0)`, dismissed by drag, fling, Escape, scrim or the close button |
| M and TP inspector, TL side drawer | The same `Sheet`, with `axis: "x"` for the TL drawer; geometry is measured at open time |
| Every button, link and row | `press()` bound by `usePressSurface` under the workspace and inside each open sheet, rebound on DOM mutation, disposed on unmount |
| `/inbox` list rows | `stagger()` once per route per session on direct-load first data paint; a navigated pane supplies the entrance instead, with no nested row stagger; never on filtering, keyboard navigation or a data refresh |
| `/` hero heading | `kineticHeadline(words, { frequency: "rare" })` in static clips, once per session; the full string stays in the heading's `aria-label` |
| TL rail collapse, DS inspector toggle | `flipLayout(panes, mutate)` with the React mutation inside `flushSync`, plus `enter()` anchored to the trigger for the surface that arrives |
| Non-M "More" menu | Native `popover` with `enter()` anchored to its trigger |
| In-route paging (`PagerStage`, #57) | `routeTransition(outgoing, incoming, { device, direction, input })` between an outgoing snapshot and the arriving page. `RouteStage` keys on the pathname, so a pager that moves a search parameter gets no travel from it; the direction comes from an `order` the caller computes from data, and an unchanged order (a view switch over the same dates) resolves to `none`, which the package renders as a crossfade. Paging again mid-flight retargets the arriving page and drops the one that was still leaving |
| Module collections (`ListArrival`, #57) | The same first-paint `stagger()` as the Inbox rows, keyed per collection and spent once per session |

`resolveDirection` comes from the history index that React Router maintains: a lower index is `back`, so back
navigation reverses the forward travel. Issue #78 extends the package contract to all five classes:
48px on M, 20px on TP/TL, and 4px on DS/DW. Shells pass their class directly, without a TP alias.
TP/TL use the shared ease-out curve for a 200ms translate-and-fade pane move; M and DS/DW retain
200ms in-out timing. RTL reverses the sign and `none` keeps opacity motion with zero translation.

Route motion tweens numeric translation/opacity with GSAP and writes those values to the dedicated pane. It reads
only inline presentation when retargeting, avoiding CSSPlugin's synchronous computed-style/layout read of the
new incoming tree. The same timeline owns both exit and entrance, with class-specific easing and shared cancellation.
First-paint stagger keys are frozen at pane mount: Router's destination pathname must not restart Inbox row
animation inside the still-mounted outgoing pane. The shell regression observes outgoing row styles during exit.
On client-side navigation the pane supplies the first arrival; its rows stay static throughout and after that move.
Direct Inbox loads retain the once-per-session row stagger. This avoids stacking row-layer initialization and
painting onto the first route transition, rather than hiding the cost with a probe-only warm-up.

After first paint, `App` schedules idle work to exercise a no-op GSAP timeline and import the lazy motion lab
(Vite preloads that route's dependency chunks). Overview, Inbox and Settings are eager entry imports, so they
already require no navigation-time route fetch. StrictMode/unmount cleanup cancels pending idle/frame callbacks.
The list stagger also tweens scalar values, writing the individual CSS translate and opacity without reading
new row transforms. Cancellation preserves the current presentation and revert restores the saved inline styles.
The browser primitive suite verifies zero row computed-style reads, interruption continuity and restoration.

Round-2 synchronized QA measures four route classes (M/TP/TL/DS) and M sheet drag. Every route repetition reports
its cold first Inbox window and warm-up Overview return separately, with their own PASS/FAIL. The six subsequent
navigations form the warmed cadence gate; a warmed PASS is not a cold PASS. See [QA policy](qa-harness.md).
`XP_BASE_URL=http://127.0.0.1:5205 node scripts/qa/profile-inbox.mjs <new-run-id>` records diagnostic first/second
Inbox traces for those four classes, resource/font state and host snapshots, separately from acceptance timing.

Final round-2 captures `issue78-r2-guard3` and `issue78-r2-guard4` exit 0 consecutively: each has 180/180 cases
and all five warmed cadence medians PASS. M/TP/TL/DS medians are 60.00/59.32/60.00/60.00 fps and
60.01/59.34/60.01/60.00 fps; both drag medians are 60.00 fps. Cold diagnostics all pass in guard3;
guard4 retains two-drop FAIL windows on TP, TL and DS. Warmed acceptance does not certify cold cadence.
Shell/motion browser suites and the 44-image dev evidence suite pass; the full 180-case/360-image
guard1 perceiver is CLEAN on identical product code. [Every repetition and window](../../memory/2026-09-05-issue-78-round2.md)
is recorded with the retained failures, trace findings and host limitations.

`useRouteSettled()` exposes completion for each pane. Initial loads are settled; incoming panes become settled only
after their current motion handle finishes successfully. Interrupted handles cannot release another pane's content.
Settings uses this signal to mount its live form after arrival, keeping Radix measurement and install-overlay effects
out of the initial transition layout. During arrival, an inert, accessibility-hidden static placeholder renders the
same sections, labels, values and field boxes. It shares control styles, the language chevron and install-status
rendering with the live form, contains no Radix controls or press targets, and swaps without another animation.
The Settings pane uses `contain: layout paint`. Never defer a visible body to an empty shell: deferred controls require a
layout-identical arrival placeholder, including current theme and install state. Transform/opacity promotion stays
owned by the motion primitive. Keyboard bypass and reduced motion use the same completion contract.

The shell browser suite records every display frame for 400ms after pointer navigation to Settings in M and DW,
with normal and reduced motion, plus Chrome PNG screencast frames. From the first visible heading it checks a
non-empty body, stable body/section/control geometry within 2px, identical rendered text, and zero CLS using a
`layout-shift` PerformanceObserver. It separately rejects form shifts even when recent input excludes them from
CLS; the header subtitle's navigation-driven relocation is reported separately. It verifies the seven-stop keyboard
order, save/edit status, and install entry after the swap. The PWA suite retains early install-event capture coverage.

## Frequency gates and input modality

`press()` reacts to `pointerdown`, so a keyboard activation never animates a control. Route transitions read the
modality that started the interaction: a document-level record of the last `pointerdown` or `keydown` (valid for one
second) decides between `input: "pointer"` and `input: "keyboard"`, and the keyboard case applies the final state at
once. Sheets close instantly when Escape or an Enter press asks them to, and animate when a pointer does.

## Lifecycle and accessibility

The active pane is derived from the final item in React's `panes` state, without a render-time ref read.
`useInputObserver` removes its exact capture listeners on unmount and can reinstall them in StrictMode.
Sheet descriptions have unique IDs referenced by `aria-describedby` only when present. The fine-pointer
hover background rule excludes `.sheet-grip`, preserving the resting background of the full-width drag target.
The exclusion uses `:where()` so other controls retain their existing hover/active specificity.

## Reduced motion

Nothing is switched off. The primitives read the live OS preference on every new animation, so travel drops to 10%,
duration to 70% bounded to 80-200ms, and sheets cross their distance while invisible in two capped legs. Verified
numbers are in the browser check below. Hover restyles are declarative CSS gated behind
`(hover: hover) and (pointer: fine)`, with the transition shortened, never removed, under
`prefers-reduced-motion: reduce`.

Declarative motion is written in two idioms and a sweep of the stylesheets has to know both: in
`apps/web` every spatial transition or animation is wrapped in `@media (prefers-reduced-motion:
no-preference)` alongside the app's own motion switch, so it is never declared for a reader who asked
for none, while the packages declare motion unconditionally and reset it per block under `@media
(prefers-reduced-motion: reduce)` (`packages/xp-primitives/styles/primitives.css:520`,
`packages/xp-shells/styles/shells.css:5747`).

## What replaced the previous overlay stack

The shells previously disabled every transition and animation under `.workspace` and every overlay, because #36
predated the motion system. That rule is gone. To keep a single motion owner, the shell's own `Sheet` replaced the
`AdaptiveOverlay` sheet presentations for M and TP and the TL side drawer, so no second motion or gesture library
animates the application: `@xp/motion` moves it, the native dialog supplies modality, focus containment and Escape,
and the workspace root carries `aria-hidden` while a sheet owns the screen. Focus is trapped inside the open sheet
(the trap wraps Tab, which a modal dialog alone does not do) and returned to the trigger on close.
`useDeviceClassLock` is held for the life of every open sheet and menu, so resizing cannot reclassify the shell
underneath an open surface. `AdaptiveOverlay` remains the primitive for product code that wants the full intent
matrix; it is simply not what the demo shell uses for sheets.

## Evidence

All commands run against system Chrome, `channel: "chrome"`, on this machine.

### Issue #78 verification

Production preview uses port 5205. `XP_BASE_URL=http://127.0.0.1:5205
XP_BROWSER_CHANNEL=chrome pnpm qa issue78-final` exits 0: 180/180 cases PASS,
360 PNGs, no failed case gates. Gates that observed nothing remain explicitly INACTIVE.
Its median-of-three 4x CPU results are M routes 59.40 fps, TP routes 59.99 fps,
TL routes 59.40 fps and sheet drag 60.00 fps. Each route probe measures six navigations
through Inbox, Settings and Overview using that class's real navigation surface.
The existing per-window dropped-frame limit and unrounded aggregate floor are unchanged.
Raw repetitions, host snapshots and individual failed probes remain in `perf.json`.

The earlier standalone `node scripts/qa/perf.mjs issue78-perf` triplet passed:
M 60.00, TP 59.39, TL 59.38 and drag 60.00 fps. The later `issue78-perf-final`
triplet failed (TP 55.63, TL 57.65) while recorded host load rose from 10.48 to
19.94 and other Chrome jobs were active. Both remain available; the passing QA
medians do not erase this failed standalone run. These are active-window rAF
measurements on shared system Chrome, not physical-tablet or compositor guarantees.
After our capture/reviewer jobs finished, `issue78-perf-recheck` measured M 58.80,
TP 58.21, TL 58.16 and drag 60.00 fps. TP/TL still failed the per-window gate
(two dropped intervals in a window of the selected median run), so the command exited 1
despite aggregates above 58. Two other QA captures were active. No code or thresholds
were changed between these runs. Standalone cadence repeatability on this shared host
remains a handoff limitation; all raw failures are retained rather than replaced by retries.

| Class | Measured forward / back travel | Curve and duration |
| --- | --- | --- |
| M | +48 / -48px | In-out, 200ms |
| TP | +20 / -20px | Ease-out, 200ms |
| TL | +20 / -20px | Ease-out, 200ms |
| DS | +4 / -4px | In-out, 200ms |
| DW | +4 / -4px | In-out, 200ms |

`test:browser:shell` starts its 60ms timer at the first two-pane commit and navigates again
inside the browser, avoiding a Playwright click's implicit settling delay. All five classes
verify unchanged translation/opacity across retargeting, at most two mounted panes, exactly
one active pane, inert/hidden outgoing panes, stale-pane removal, and a final unpromoted
Settings pane at translation 0 and opacity 1. Back reverses each class's travel. TP/TL have
covered more than half their travel at interruption, distinguishing ease-out from in-out.
The final timer readings were 60.5–61.5ms. Existing keyboard/reduced-motion and Settings
arrival geometry checks also pass. Sheet accessible description and fine-pointer grip hover
have browser assertions.

Inspected `shell-pane-TP-006.png` / `010.png` and `shell-pane-TL-003.png` / `009.png`:
the tablet content moves laterally into place and fades while the top navigation/rail stays
fixed. It reads as a short pane move with visibly more displacement than the 4px desktop
crossfade. `shell-sheet-hover-M.png` has no full-width grey hover bar. PNG screencasts are
separate from FPS measurements.

Full-run visual review initially returned BLOCKED because `full-page` screenshots do not
expand nested app scroll containers. Added 36 bottom-of-scroll Settings captures for M/TL/DS,
covering both themes, all registered states and both motion preferences. The reviewer then
inspected all 360 original PNGs plus the 36 supplements and returned `CLEAN` in
`issue78-final/perceiver-supplement.md`. The original BLOCKED verdict and both process logs
are retained. The supplemental frames show installation guidance and save controls clear of
the dock/viewport edges; they overlap the original top captures to cover the entire form.

`test:browser:motion` passes. The `evidence` suite passes on the development server on
the same port: 36 route screenshots plus 6 overlay/simulator and 2 install captures, with
zero page/HTTP errors. Its first production-preview attempt stopped at the absent
development-only device selector; that is a fixture mismatch, not a passing result.
Build, web typecheck, recursive tests, semantic-color guard, offline repository audit,
secret scan and CSS size pass. Render-blocking CSS is 19,820 bytes gzip (61,440-byte budget).

### Original #71 measurements

| Check | Command | Result |
| --- | --- | --- |
| Real shell frames at 4x CPU throttle | `pnpm --filter web test:shell-fps` (production preview on 4380) | Route `/` to `/inbox` on M: 60.01 fps over 186 intervals in 16 transitions. M sheet drag: 60.00 fps over 214 intervals in one continuous two-second drag |
| Wired-shell behaviour | `pnpm --filter web test:browser:shell` | Press 0.97 then exactly 1 on release; forward travel +48px, back -48px; keyboard navigation 0px of travel; reduced motion 4.8px of travel; drag tracks 1:1 at 60px; a 40px pull past the open snap resists to 21.1px; the reduced-motion sheet shows 24.0px of visible travel and reaches opacity 1 at the exact snap |
| Motion package in Chrome | `pnpm --filter web test:browser:motion` | Unchanged and green |
| `/motion` lab at 4x CPU throttle | `pnpm --filter web test:motion-fps` | Panel 60.00 fps, sheet 60.00 fps |
| Shell anatomy, contrast, focus, tap targets | `XP_BROWSER_CHANNEL=chrome pnpm --filter web evidence` | 36 route screenshots plus 6 overlay/simulator screenshots, 0 page or HTTP errors |

JSON reports and PNGs are written to `apps/web/evidence/` and stay gitignored. Both fps numbers are
requestAnimationFrame interval evidence inside active windows, not a compositor trace or a physical-device claim.

## Known limits

- The non-M "More" menu and the native colour-mode popover animate on entrance only: the platform removes a popover
  from the DOM on light dismiss, so there is no exit to own.
- The DS inspector and the TL sidebar are removed synchronously when they are hidden, matching the shell's existing
  contract that a collapse frees its track immediately; only their arrival is animated.
- DW keeps a permanent inspector, so it has no toggle to animate.
- Module-specific animations stay out of scope for v1.2.0.
