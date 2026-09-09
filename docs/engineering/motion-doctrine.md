# Motion doctrine

Motion confirms input and explains changes of place or state. It must leave people in control. Our house style is fluid and restrained, with no bounce, including gesture releases.

## Purpose and frequency gate

Before adding motion, name its purpose: feedback, spatial continuity, state indication, bridging a jarring change, or explanation. Explanation and delight belong only to rare introductory moments. Moving data merely to decorate a working screen fails this gate.

| Frequency | Budget |
| --- | --- |
| Keyboard initiation or 100+ uses/day | Apply the final state immediately; do not animate |
| Tens/day | Small press feedback or a very subtle change; no entrance choreography |
| Occasional | Standard UI transitions |
| Rare / first visit | Launch headline and one-time scroll reveal permitted |

Callers pass `input: "keyboard"` or `frequency: "constant"` to bypass choreography. This bypass is distinct from reduced motion: reduced motion preserves gentle feedback. Do not delay focus, navigation, or interaction while a decorative transition runs.

## Shared tokens

Values use the theme system's `--xp-*` namespace. TypeScript owns the values; the package build emits `styles/motion.css` from them. Durations in JavaScript are milliseconds until converted at the GSAP boundary.

| CSS token | Exact value | Use |
| --- | --- | --- |
| `--xp-ease-out` | `cubic-bezier(0.23,1,0.32,1)` | Entrance, exit, feedback |
| `--xp-ease-in-out` | `cubic-bezier(0.77,0,0.175,1)` | Movement between visible positions, layout changes |
| `--xp-ease-drawer` | `cubic-bezier(0.32,0.72,0,1)` | Programmatic sheet opening / closing |

Never substitute a similarly named GSAP power ease: CSS and JavaScript must follow the same curve. Hover opacity may use the out curve; constant progress alone may use linear time. No UI ease-in, elastic, back, or bounce curves.

| CSS token | Value | Budget |
| --- | --- | --- |
| `--xp-dur-press` | `120ms` | Pointer-down feedback; release takes 80ms |
| `--xp-dur-ui` | `200ms` | Popovers, route panes, list items |
| `--xp-dur-surface` | `320ms` | Explicit exception for a large sheet's travel |
| `--xp-dur-launch` | `600ms` | Rare headline / explanatory arrival only |

Ordinary UI stays below 300ms. The 320ms large-surface token is a documented exception, not a new default. A physical spring has a response parameter and a rest threshold, not a fixed duration. Stagger gaps are 30–80ms, normally 50ms; cap the group's total delay at 200ms so a long list stays usable.

## CSS or GSAP

Use CSS transitions for simple declarative hover or state changes. List exact properties. Gate hover with `(hover: hover) and (pointer: fine)`. Use the GSAP wrapper when input can reverse an animation, when lifecycle controls exits, or when coordinating multiple targets. GSAP owns pointer press, enter/exit, route transitions, gesture sheets, Flip layout transitions, ScrollTrigger reveals, and launch headlines. No second motion library.

Animate transform and opacity only. GSAP updates transforms on the main thread, so compositor-friendly properties alone do not prove 60 fps. Measure under load. Flip reads layout before and after a synchronous layout mutation, then uses scale/translate rather than animating width or height. A headline uses a static overflow clip around translated words; the clip itself does not animate. Never broadcast frame values through ancestor CSS variables.

## Interruption, lifetime, and exits

Retarget from the current presentation, not a remembered endpoint. Each owned animation cancels its predecessor without resetting transform or opacity. Dragging can grab a settling sheet immediately. Every primitive supplies cancellation; listener-based primitives supply disposal. Dispose on unmount, including StrictMode cleanup. Restore pre-existing inline styles when disposing a binding.

Entrances use scale 0.96 and opacity, with transform-origin measured relative to a supplied trigger. Unanchored surfaces stay centered. Exit follows the same origin and path; response timing may be faster than the deliberate action. Route back reverses forward travel. Keep outgoing DOM mounted through completion and remove it only if that transition still owns the state. Hidden panes must be inert and absent from the accessibility tree.

`will-change` is an animation-lifetime hint: acquire at start, release on completion, interruption, and disposal. Preserve a caller's existing value. Do not promote the whole page permanently.

## Device-class physics

| Class | Motion behavior |
| --- | --- |
| M | Direction-aware 48px route slide + fade, 200ms in-out; back reverses. Bottom sheets track the captured primary pointer 1:1 inside bounds; rails use the same physics on X |
| TP | 20px pane move + fade (16–24px budget), 200ms ease-out (240ms maximum); back reverses. Horizontal navigation stays still; touch never inherits hover motion |
| TL | 20px pane move + fade (16–24px budget), 200ms ease-out (240ms maximum); back reverses. Rail stays still; Flip connects layout changes; touch never inherits hover motion |
| DS | Crossfade with only 4px translation; Flip for list/detail; subtle pointer feedback |
| DW | Same restrained pane behavior as DS; keep surrounding working panes still |

`routeDistance` accepts all five classes directly: M 48px, TP/TL 20px, DS/DW 4px.
Forward is positive X, back negative X, RTL reverses both, and `none` has zero translation.
Desktop crossfades retain the 200ms in-out curve. Tablet ease-out uses the shared out token,
so a pane responds promptly and decelerates into place without the mobile slide's larger travel.

For sheets/rails, record recent position/time samples and express velocity in px/s. At release, use `project(v, 0.998) = (v / 1000) * 0.998 / (1 - 0.998)`. Select the snap nearest `position + project(v)`. A held-still pointer must lose its old flick velocity. Ignore secondary pointers and cancel safely on lost capture.

Outside bounds, map overshoot `x` through `(x * dimension * 0.55) / (dimension + 0.55 * abs(x))`. This preserves sign, adds progressive resistance, and approaches a finite limit. Measure geometry at grab, not on every frame. A grab during rubber-banding uses the inverse mapping so the first move cannot jump.

Settle with damping ratio 1: for displacement `d`, velocity `v`, and angular frequency `w`, position relative to target at time `t` is `(d + (v + w*d)*t)*exp(-w*t)`. Carry measured velocity through release and programmatic retargeting. Critical damping alone can still cross a target with excessive initial velocity: bound the toward-target velocity to `w * abs(d)` to enforce the house no-overshoot rule. This deliberate velocity cap trades exact momentum conservation for no bounce. Use independent axis state for independent axes.

## Reduced motion

Subscribe to the OS preference, including changes while mounted; server rendering uses a stable false snapshot. New motion reads the live preference. Reduce travel to 10%, scale deviation to 10%, and duration to 70% bounded to 80–200ms. Sheets crossfade through zero opacity: two legs of 5% travel, each capped at 12px, with the remaining distance crossed while invisible. They finish at the exact snap geometry and original opacity. Keep direct pointer tracking 1:1 because content must remain under the finger; reduce projected momentum and use the same short crossfade after release. Grabbing a fade cancels it and restores opacity for direct manipulation. Never turn every duration into zero. Keyboard and constant-frequency bypasses remain instant by design.

## Never ship checklist

- [ ] Unnamed purpose, keyboard choreography, repeated launch effects, or animation of data being read.
- [ ] Bounce, overshoot, ease-in entrances, scale-from-zero, or unanchored popovers.
- [ ] Ordinary UI over 300ms, arbitrary easing copies, or stagger that delays access to a long list.
- [ ] Restarting from an endpoint after interruption, input lockouts, wrong-way exits, or stale completion callbacks.
- [ ] Layout properties, animated filters/clips, `transition: all`, inherited frame CSS variables, or permanent `will-change`.
- [ ] Missing reduced-motion behavior, ungated hover motion, lost pointer capture, extra-finger jumps, or stale release velocity.
- [ ] Orphaned listeners/tickers/ScrollTriggers, invisible readable content, missing focus restoration, or inaccessible hidden panes.
- [ ] A performance claim without the Chrome 4x CPU frame-counter evidence. Target at least 58 average fps separately for panel transitions and sheet dragging.

## Sources and ownership

Synthesized from the supplied animation construction, review standards, audit, opportunity, vocabulary, and Apple-design references. Those files remain outside this repository. We retain their purpose/frequency and continuity principles, but our explicit no-bounce, GSAP, transform/opacity, and token contracts take precedence over their optional recipes. This document is our implementation contract, not an upstream skill copy.
