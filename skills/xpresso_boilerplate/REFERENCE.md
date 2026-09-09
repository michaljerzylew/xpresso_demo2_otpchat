# Package reference

Reading convention: a path like `src/index.ts` is relative to the package named in its heading; a
bare stylesheet name such as `regions.css` is a package export subpath, not a file path.

Directory names use `xp-`; package imports use `@xp/`. These workspace packages
export TypeScript source; generate their CSS before building the consuming app.
`pnpm -r build` orders workspace dependencies. There is no published package
installation promised by this skill.

## Runtime: `packages/xp-runtime`, `@xp/runtime`

| Export | Contract |
|---|---|
| `DeviceClass`, `deviceClasses` | M, TP, TL, DS, DW |
| `classForWidth(width)` | Pure width boundaries; no pointer tie-break |
| `resolveDeviceClass(environment, lock?)` | Environment has width, height, pointer, hover, orientation; lock has previous, overlayOpen, dragActive |
| `parseDeviceClass(value)` | Known class or undefined |
| `previewSizes` | M 390×844, TP 768×1024, TL 1024×768, DS 1366×768, DW 1920×1080 |
| `DeviceClassProvider` | Children and optional explicit `deviceClass`; root publishes document attributes/tokens |
| `useDeviceClass()` | Current class, including interaction lock |
| `useDeviceClassLock(active)` | Reference-counted lock with effect cleanup |
| `useDeviceClassBusy()` | Whether a class lock is active |
| `createClassController(initial, publish, onLockChange?)` | Pure update/acquire controller; final release applies pending class |

Root tokens: `data-xp-class`, `data-xp-input`, `--xp-class`, `--xp-input`,
`--xp-can-hover`, `--tap-min` (24px fine, 44px coarse/none). SSR starts at M.
Nested providers do not overwrite root tokens. Do not add another width detector.

## Theme: `packages/xp-theme`, `@xp/theme`

- `ThemeSpec`: fonts (`sans`, `serif`, `mono`, `webfonts`), six color seeds
  (`primary`, `neutral`, `accent`, `success`, `warning`, `danger`), `spacingScale`,
  `radiusScale`, `shadowScale`, `density`, optional per-mode semantic overrides.
- `resolveColors(spec, "light" | "dark")`, `compileTheme(spec)` and
  `checkContrast(spec, pairs?)` resolve tokens, produce CSS and return contrast
  failures. An empty failure array passes the specified pairs at 4.5:1.
- `applyTheme(spec)` creates/updates `style#xp-theme` in the current document and
  returns that element. It does not persist a preset or choose the colour mode.
- `startThemeMode()` returns cleanup. `setThemePreference`, `getThemePreference`,
  `ThemePreference`, `themeModeEvent`, `themeStorageKey` own light/dark/system.
- `generateRamp`, `contrastRatio`, `cssColor`, `srgbHex`, `rampSteps`, `Oklch`,
  `ColorSeed` support compilation and auditing.
- `presets` is a **subpath** import from `@xp/theme/presets`; all six named presets
  are also JSON under `packages/xp-theme/presets/`.
- CSS: `@xp/theme/theme.css` and `@xp/theme/tailwind.css`. They are generated under
  `dist/`; do not commit build output. `--xp-*` colours and fonts are semantic;
  spacing and radius adapt core `--space-*` / `--radius-*` fluid tokens.

## Motion: `packages/xp-motion`, `@xp/motion`

Public tokens: `easing`, `duration`, `motionTokens`, `motionCss`.
Import CSS once from `@xp/motion/styles/motion.css` and mount `MotionProvider` at
the shell boundary. Hooks: `usePrefersReducedMotion`, `useMotionPreference`.

| Export | Use and lifetime |
|---|---|
| `press(element, options?)` | Pointer feedback binding; dispose on unmount |
| `enter(element, options?)`, `exit(element, options?)` | Anchored surface movement; optional trigger |
| `stagger(elements, { gap?, ...options }?)` | Bounded first-arrival list delay |
| `routeTransition(outgoing, incoming, options)` | Device-aware forward/back/RTL transition; keep outgoing DOM until current transition finishes |
| `flipLayout(elements, mutate, options?)` | Layout measurement around synchronous mutation, then transform-only movement |
| `sheet(element, options)` | Gesture/snap controller; see `SheetOptions` in `src/sheet.ts` |
| `revealOnScroll(element, options?)` | Occasional scroll reveal with disposal |
| `kineticHeadline(words, { frequency: "rare", ...options })` | Rare word reveal |
| `warmMotion()` | Pre-initialize the engine after paint |

`MotionOptions` carries `reduced`, `input` (pointer/keyboard/programmatic) and
`frequency` (constant/frequent/occasional/rare). `MotionHandle` has `finished:
Promise<boolean>`, `cancel()` and `revert()`; cancelled completion resolves false.
Binding/controller return shapes differ: inspect the function's exported type
before treating it as a handle. Physics exports: `project`, `rubberBand`,
`criticalSpring`, `resolveDirection`, `routeDistance`, `reducedMotionScale`,
`motionDuration`, plus `DeviceClass` and `Direction` types.

The app's `src/shell/motion.tsx`, `AppShell.tsx` and `Sheet.tsx` already own route,
press, overlay, Flip and gesture lifecycles. Routes should consume that wiring.

## Shells: `packages/xp-shells`, `@xp/shells`

The barrel exports `AppShell`, app bars, navigation renderers/models, region
arbitration, marketing/workspace shells, auth units and meeting/chat surfaces.
Read `src/index.ts` and the selected module's props instead of guessing a preset's
layout. The generic package `AppShell` does not implement the app-local TP/DW
contract: use `apps/web/src/shell/AppShell.tsx` and its `RoutePanes` when extending
this app. `RoutePanes` is not exported by `@xp/shells`.

Use focused public subpaths where available: `@xp/shells/regions` exports region
arbitration (`resolveBottomRegion` used by the app); `@xp/shells/auth` exports the
auth model. CSS subpaths include `regions.css`, `auth.css`, `register.css`,
`recover.css`, `reset.css`, `otp.css`, `verify.css`, `meeting.css`, `chat-surface.css`
and the full `styles.css`. Import only skins actually mounted.

## Primitives: `packages/xp-primitives`, `@xp/primitives`

Exports include `Control`, `Field`, `SegmentedControl`, `AdaptiveOverlay`,
`MetricTile`, `MorphSlot`, `SnapRail`, `RecordDeck`, `Pager`, `DisclosureGroup`,
`ChipBar`, `StickyActionBar`, menu/popout and data-collection components. The
device-class exports reuse `@xp/runtime`. `AdaptiveOverlay` and `SnapRail` acquire
class locks for their own interactions.

Public focused entries: `@xp/primitives/base`, `/adaptive-overlay`, `/metric-tile`,
`/segmented-control`. CSS is `@xp/primitives/styles.css`; individual source files
are not automatically valid package subpaths. `base` exposes underlying library
primitives, while the app kit in `src/modules/kit` supplies its coherent consumer
components and five-form policies. Use [kit documentation](../../docs/product/modules/kit.md).

## Core and blocks

`@xp/core` has no root `src/index.ts` export. Use `@xp/core/algebra` for `Stack`,
`Box`, `Center`, `Cluster`, `Sidebar`, `Switcher`, `Cover`, `Deck`, `Frame`, `Rail`,
`Pager`, `Imposter`; `/tracks` for track logic; `/core.css`, `/tokens.css` and
`/tailwind-theme.css` for generated styling. Container-aware content sits in
`xp-slot`. Core token generation runs before theme compilation.

`@xp/blocks` exports higher-level dashboard, commerce, marketing and other
surfaces from its `src/index.ts`, with model types. Inspect the corresponding
module and package exports before mounting one: availability does not establish
that an unused skin meets this app's theme, five-form or motion contract.

All seven packages remain in a generated project, including their licenses,
provenance, schemas, build scripts and tests. They are not licensed demo-template
source. Package exports and build constraints are mapped in
[architecture](../../docs/engineering/architecture.md).
