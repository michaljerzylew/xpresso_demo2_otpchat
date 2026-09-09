# ADR 0010: Vendor xpresso packages

- **Status:** Accepted
- **Date:** 2026-09-05
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The product composes `xp-core`, `xp-primitives`, `xp-shells` and `xp-blocks` from the sibling xpresso studio repository. Decision D2 in the 2026-09-05 session journal requires a self-contained boilerplate that consumer projects can clone.

## Decision
Copy the four packages into `packages/` with `rsync -a --exclude node_modules --exclude scratch`. Record source path, commit and date in each `PROVENANCE.md`. Keep source, styles, manifests and generators. Keep generated token/style outputs locally and regenerate them during builds, without committing any `dist/` directory. Exclude tests and helper scripts that require studio-only fixtures, preview pages, assets or CI.

## Why
Workspace links into the sibling studio repository would break consumer checkouts. Vendoring gives this repository ownership of the exact source and lets it evolve independently. A published package dependency would require a separate release process without improving the current self-contained requirement.

## Consequences
Upstream changes require a deliberate new copy and review of local adaptations, followed by an updated provenance record. Root pnpm tooling supplies TypeScript and tsx; the core tsconfig includes only local source and token configuration. Core manifest/lint scripts target `../xp-blocks`. Root development and recursive builds generate core CSS before the app consumes it. Studio integration tests are not represented as coverage of this product; retained package tests and local app checks provide the available evidence.

## Links
[Issue #35](https://github.com/michaljerzylew/xpresso_boilerplate/issues/35). [Architecture](../engineering/architecture.md). `memory/2026-09-05.md`, decision D2 (local planning source).
