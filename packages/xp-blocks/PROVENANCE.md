# Provenance

- Source: `~/lampa/projects/cc_xpresso_studio/xpresso-studio/packages/xp-blocks/`
- Source repository: `~/lampa/projects/cc_xpresso_studio/xpresso-studio` (nested git repo, `michaljerzylew/xpresso-studio`), commit `9a93ab27bf6ac0d4e120c2a1aec196326a35294a` (clean package working tree at copy time). Outer workspace repo `cc_xpresso_studio` was at `544594c`.
- Vendored: 2026-09-05.
- Method: `rsync -a --exclude node_modules --exclude scratch`.
- Source, styles, manifests and token outputs were copied. Generated `dist/` files remain ignored and are rebuilt by `@xp/core`; they are not committed.
- Why: a consumer can clone this repository without a sibling studio checkout (ADR 0010).

## Excluded studio-only tests

The `posters:features` script and `scripts/export-feature-posters.mjs` are also excluded because they load studio COPY fixtures.

These tests require studio COPY fixtures, preview pages, media or CI gates that are not part of this product:

- `tests/widget-surface.test.mjs`
- `tests/product-quick-view.test.mjs`
- `tests/voices.test.mjs`
- `tests/answers.test.mjs`
- `tests/article-feed.test.mjs`
- `tests/dashboard-model.test.mjs`
- `tests/checkout-flow-adapters.test.mjs`
- `tests/product-reviews-model.test.mjs`
- `tests/product-reviews.test.mjs`
- `tests/multi-step-form.test.mjs`
- `tests/datatable-component.test.mjs`
- `tests/checkout-flow.test.mjs`
- `tests/shopping-cart.test.mjs`
- `tests/footer.test.mjs`
- `tests/gallery.test.mjs`
- `tests/contact.test.mjs`
- `tests/checkout-flow-renderer.test.mjs`
- `tests/features-section.test.mjs`
- `tests/offer-surface-model.test.mjs`
- `tests/compare.test.mjs`
- `tests/kpi-deck.test.mjs`
- `tests/upload-unit.test.mjs`
- `tests/category-filter.test.mjs`
- `tests/product-overview.test.mjs`
- `tests/integration-proof.test.mjs`
- `tests/decision-band.test.mjs`
- `tests/onboarding-feed.test.mjs`
- `tests/trust-burst.test.mjs`
- `tests/offer-surface.test.mjs`
- `tests/product-category.test.mjs`
- `tests/user-schedule.test.mjs`
- `tests/chrono.test.mjs`
- `tests/order-summary.test.mjs`
- `tests/empty-surface.test.mjs`
- `tests/gift-card.test.mjs`
- `tests/status-page.test.mjs`
- `tests/metric-surface.test.mjs`
- `tests/form-surface.test.mjs`
- `tests/faces.test.mjs`
- `tests/about-us.test.mjs`
- `tests/showcase.test.mjs`
- `tests/pricing.test.mjs`
- `tests/settings-surface.test.mjs`
- `tests/mini-app-model.test.mjs`
- `tests/download.test.mjs`
- `tests/bento.test.mjs`
- `tests/launch-hero.test.mjs`
- `tests/product-list.test.mjs`
- `tests/stage.test.mjs`
- `tests/announce.test.mjs`
