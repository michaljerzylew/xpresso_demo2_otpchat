# Provenance

- Source: `~/lampa/projects/cc_xpresso_studio/xpresso-studio/packages/xp-core/`
- Source repository: `~/lampa/projects/cc_xpresso_studio/xpresso-studio` (nested git repo, `michaljerzylew/xpresso-studio`), commit `9a93ab27bf6ac0d4e120c2a1aec196326a35294a` (clean package working tree at copy time). Outer workspace repo `cc_xpresso_studio` was at `544594c`.
- Vendored: 2026-09-05.
- Method: `rsync -a --exclude node_modules --exclude scratch`.
- Source, styles, manifests and token outputs were copied. Generated `dist/` files remain ignored and are rebuilt by `@xp/core`; they are not committed.
- Why: a consumer can clone this repository without a sibling studio checkout (ADR 0010).
- Local adaptation: lint and manifest scripts resolve `../xp-blocks`; build tools are supplied by the root workspace. The tsconfig has no external path aliases and its includes resolve locally.

## Excluded studio-only tests

- `tokens/tests/roles-computed.test.mjs`: requires the studio's undeclared Playwright browser harness. `tokens:test` retains the standalone token gate tests.
- `styles/tests/foundations.test.mjs`: requires the same studio browser harness. The unavailable `styles:test` script is removed; `styles:build` still generates and validates CSS in the core build.
