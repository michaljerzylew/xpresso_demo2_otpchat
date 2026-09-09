# ADR 0009: Vite SPA on Cloudflare Workers

- **Status:** Accepted
- **Date:** 2026-09-05
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The product needs an app shell built from framework-agnostic React packages. The reference templates use Next.js, while the sibling DEMO1 already uses Vite and Workers static assets. Decision D1 in the 2026-09-05 session journal selected the product stack.

## Decision
Use Vite 6, React 19, strict TypeScript, Tailwind 4 through `@tailwindcss/vite`, and React Router 7 in library mode (`BrowserRouter`, `Routes`). Keep the app in `apps/web` and configure Workers static assets with SPA fallback and an `ASSETS` binding.

## Why
This reuses DEMO1's established deployment shape and supports a client-rendered app shell suitable for the planned PWA. Next.js plus OpenNext would add an unnecessary deployment layer: the template origin does not require it, and the xpresso packages work with plain React.

## Consequences
The browser owns routing. Workers serves the built static assets and falls back to the SPA entry for navigation. Versions are pinned in package manifests and the pnpm lockfile. SSR is not included. PWA, deployment and domain activation remain separate Issues; this decision does not claim they are implemented.

## Links
[Issue #35](https://github.com/michaljerzylew/xpresso_boilerplate/issues/35). [Architecture](../engineering/architecture.md). `memory/2026-09-05.md`, decision D1 (local planning source).
