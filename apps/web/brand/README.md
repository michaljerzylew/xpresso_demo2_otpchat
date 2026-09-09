# Brand mark sources

`icon.svg` is the single vector source for every generated PWA icon. Its colours and
its two geometry knobs arrive as CSS custom properties from
`apps/web/scripts/generate-pwa-assets.mts`, which resolves them from the theme
preset, so an icon can never carry a colour the design system does not own.

Regenerate after editing: `pnpm --filter web pwa:assets`. Outputs land in
`apps/web/public/pwa/` and are committed. Details: `docs/engineering/pwa.md`.
