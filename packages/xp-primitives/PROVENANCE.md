# Provenance

- Source: `~/lampa/projects/cc_xpresso_studio/xpresso-studio/packages/xp-primitives/`
- Source repository: `~/lampa/projects/cc_xpresso_studio/xpresso-studio` (nested git repo, `michaljerzylew/xpresso-studio`), commit `9a93ab27bf6ac0d4e120c2a1aec196326a35294a` (clean package working tree at copy time). Outer workspace repo `cc_xpresso_studio` was at `544594c`.
- Vendored: 2026-09-05.
- Method: `rsync -a --exclude node_modules --exclude scratch`.
- Source, styles, manifests and token outputs were copied. Generated `dist/` files remain ignored and are rebuilt by `@xp/core`; they are not committed.
- Why: a consumer can clone this repository without a sibling studio checkout (ADR 0010).
- Local adaptation (#36): device-class exports use the shared `@xp/runtime` context; the old standalone width detector is removed.

## Local changes

- Issue #53: original `RecordDeck` bounded collection primitive with visible previous/next controls, live record announcement and clamped selection after filtering. Why: the upstream DataCollection compact form stacks all records; HARBOR requires a deck/pager with bounded reading height. No upstream source copied.
- Issue #79: declare only CSS files side-effectful and expose focused `adaptive-overlay`, `metric-tile` and `segmented-control` entries. Why: consumers can import the component they render without traversing unrelated primitive dependencies; unused barrel exports now tree-shake too. A Vite regression fixture verifies unused overlay/Vaul removal while explicitly imported CSS survives.

- Issue #36: the mounted dashboard metric tile now uses semantic ink, surface, border and status roles, including its container-query variants. Why: its upstream ink failed dark-mode contrast during the 30-image shell audit.

- Issue #37: overlay surfaces, description, footer actions, divider, drag handle, arrow and focus ring now use `@xp/theme` semantic colours. Segmented controls share the primary/on-primary and muted surface roles. Elevation uses theme shadows so runtime scaling applies.
- Why: fixed upstream light colours made overlay descendants unreadable in dark mode even when the overlay container was themed. The current home route is checked in Chrome at three viewport sizes in both modes; unused primitive skins retain upstream defaults.
- Issue #36: `adaptive-overlay.tsx` sets Vaul `autoFocus` on both `Drawer.Root` arms so initial focus lands inside the sheet. Why: keyboard users could Tab into the page behind the M sheet (the inert background is handled by the app shell, not by this package).

- Issue #74: `styles/base-retrofit.css` defines `.xp-visually-hidden`. Why: this package renders the class in `adaptive-overlay.tsx` and `data-collection.tsx`, but upstream styles it only in `xp-shells/styles/shells.css`, so dropping the unused shell skins from the app's CSS graph made the overlay close label visible.

## Excluded studio-only tests

The `test` script runs typechecking and manifest checks because its only upstream test file requires studio fixtures.

These tests require studio COPY fixtures, preview pages, media or CI gates that are not part of this product:

- `tests/primitives.test.mjs`
