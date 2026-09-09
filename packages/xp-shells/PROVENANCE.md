# Provenance

- Source: `~/lampa/projects/cc_xpresso_studio/xpresso-studio/packages/xp-shells/`
- Source repository: `~/lampa/projects/cc_xpresso_studio/xpresso-studio` (nested git repo, `michaljerzylew/xpresso-studio`), commit `9a93ab27bf6ac0d4e120c2a1aec196326a35294a` (clean package working tree at copy time). Outer workspace repo `cc_xpresso_studio` was at `544594c`.
- Vendored: 2026-09-05.
- Method: `rsync -a --exclude node_modules --exclude scratch`.
- Source, styles, manifests and token outputs were copied. Generated `dist/` files remain ignored and are rebuilt by `@xp/core`; they are not committed.
- Why: a consumer can clone this repository without a sibling studio checkout (ADR 0010).

## Local changes

- Issue #79: declare only CSS files side-effectful; the app consumes the existing `regions` entry directly. Why: importing bottom-region arbitration must not retain unused shell components or source-preset data. A Vite regression fixture verifies that the root barrel also drops unused shells while explicitly imported region CSS survives.

- Issue #37: shared shell colour aliases now resolve to `@xp/theme` semantic tokens on shell roots and `:root` (for portalled navigation). This covers the app bar, navigation panel/rail/tab bar, borders and More sheet. Filled actions, identity marks, badges and avatars use on-primary text instead of the raised-surface colour.
- Why: package-owned mappings keep light/dark behaviour consistent without consumer overrides. Bespoke shell skins not mounted by the current app retain their upstream palettes.

## Excluded studio-only tests

These tests require studio COPY fixtures, preview pages, media or CI gates that are not part of this product:

- `tests/auth-shell.test.mjs`
- `tests/shells.test.mjs`
- `tests/reset-unit.test.mjs`
- `tests/recover-model.test.mjs`
- `tests/register-unit.test.mjs`
- `tests/otp-unit.test.mjs`
- `tests/register-model.test.mjs`
- `tests/meeting-model.test.mjs`
- `tests/verify-model.test.mjs`
- `tests/verify-unit.test.mjs`
- `tests/chat-surface.test.mjs`
- `tests/meeting-shell.test.mjs`
- `tests/consent-surface.test.mjs`
- `tests/auth-model.test.mjs`
- `tests/reset-model.test.mjs`
- `tests/chat-surface-model.test.mjs`
- `tests/recover-unit.test.mjs`
- `tests/otp-model.test.mjs`
- `tests/utility-meta.test.mjs`
