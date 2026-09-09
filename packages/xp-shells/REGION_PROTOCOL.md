# Shell region protocol v1.0

Phase 0 defines ownership, tokens and pure arbitration. K2 supplies the visual renderers and mounts them; blocks never mount fixed or sticky chrome themselves.

## Bottom region

Exactly one bar owns the bottom edge. The shell resolves active requests in this yield order:

1. `overlay`: replaces every page-owned bar while its overlay is open.
2. `consent`: presents once when required, then permanently yields for the session.
3. `sticky-action`: owns the edge for the active contextual action.
4. `tab-bar`: default navigation owner when no higher request exists.

A FAB is a satellite, never an owner. It uses `--xp-fab-bottom-offset` and therefore sits above the current owner plus safe area. The owning renderer writes its measured outer height to `--xp-bottom-owner-height`; the shell exposes:

- `--xp-bottom-safe-area: env(safe-area-inset-bottom, 0px)`
- `--xp-bottom-clearance = owner height + safe area`
- `--xp-fab-bottom-offset = clearance + --space-xs`

## Top region

Announcement and navigation renderers dock in one shell-owned stack. They write `--xp-announce-height` and `--xp-navigation-height`; the protocol derives:

- `--xp-chrome-top-height = announce + navigation`
- `--xp-available-svh = 100svh - top chrome - bottom clearance`

Stage/Cover fold locks consume `--xp-available-svh`; they never measure siblings or read the viewport directly.

## Relocation and adjacency

The v1.1 relocation registry is exported from `src/regions.ts` and mirrored by the manifest schema. A block requests a target; only the shell mounts it. Page-level dedupe is separate: `adjacency.exposes`, `suppressesWhenPresent` and `conflictsWith` are resolved by the G10 page-assembly validator, with no new client runtime.
