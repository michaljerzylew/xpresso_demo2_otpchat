# @xp/motion

GSAP motion primitives using the shared `--xp-*` token namespace. The package follows the workspaces' source exports and TypeScript build check; build also generates `styles/motion.css` from `src/tokens.ts`.

```tsx
import { MotionProvider, press, enter } from "@xp/motion";
import "@xp/motion/styles/motion.css";

// Wrap the application once in <MotionProvider>.
// In an effect, bind press(button), returning its disposal function.
const transition = enter(panel, { trigger: button });
await transition.finished; // true = completed; false = interrupted
transition.cancel(); // retain presentation, cancel ownership
transition.revert(); // cancel and restore captured styles
```

`enter`, `exit`, `stagger`, `routeTransition`, `flipLayout`, and `kineticHeadline` return a `MotionHandle`. `press` and `revealOnScroll` return disposal functions. `sheet` returns `snapTo`, `position`, `velocity`, and `dispose`. Do not share an element between press and a layout/route animation: animate a wrapper for the route and a child for feedback.

All primitives read the live reduced-motion preference when invoked. An explicit `reduced` option overrides it. `input: "keyboard"` and `frequency: "constant"` apply final states without animation. `frequency: "frequent"` reduces intensity; `kineticHeadline` requires `frequency: "rare"`. `usePrefersReducedMotion` subscribes to OS changes; the provider also exposes the value through `useMotionPreference`.

| Primitive | Inputs / ownership |
| --- | --- |
| `press(element, options?)` | Primary pointer only; down feedback, release/cancel reset; no keyboard animation |
| `enter/exit(element, { trigger?, ...options })` | Same trigger for both directions; caller handles hidden state and DOM removal |
| `stagger(elements, { gap?, ...options })` | Gap clamped to 30–80ms, group delay capped at 200ms |
| `routeTransition(outgoing, incoming, { device, direction, rtl?, ...options })` | M travels 48px, others 4px; caller owns inertness and route lifetime |
| `sheet(element, { handle, snapPoints, initial?, axis?, onSnap?, ...options })` | Snap coordinates in px, velocity in px/s; Y default, X for rails. Rebind when geometry changes |
| `flipLayout(elements, mutate, options?)` | Stable elements; synchronous layout mutation; scale-based Flip. Reduced variant fades in final layout |
| `revealOnScroll(element, options?)` | ScrollTrigger, once; readable before trigger |
| `kineticHeadline(words, { frequency: "rare", ...options })` | Words/lines inside static overflow clips, caller supplies accessible semantic text |

`sheet.snapTo(point, options?)` returns a handle. Standard programmatic starts use the drawer curve; drag releases and moving retargets use critical damping. Reduced motion uses two short fades with at most 24px total animated travel, crossing the remaining distance at zero opacity and finishing at the exact snap coordinate. This also applies after release; actual dragging remains 1:1. The binding does not implement a modal: use native dialog or existing accessible dialog primitives for focus, Escape, background inertness and scroll management.

See [motion doctrine](../../docs/engineering/motion-doctrine.md) for formulas, budgets and review gates. Run `pnpm --filter @xp/motion test` for pure helper contracts and `node apps/web/tests/motion.browser.mjs` for system Chrome reduced-motion geometry, travel and press-axis assertions; see `/motion` for the self-contained demo. AC #4 (real shell wiring) is deferred to the follow-up Issue after #36 merges.
