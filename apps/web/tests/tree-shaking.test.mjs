import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { test } from "vitest";

test("vendored barrels discard unused JavaScript and preserve explicitly imported CSS", async () => {
  const entry = "virtual:tree-shaking";
  const result = await build({
    configFile: false,
    root: fileURLToPath(new URL("../", import.meta.url)),
    logLevel: "silent",
    plugins: [{
      name: "tree-shaking-fixture",
      resolveId(id) { if (id === entry) return entry; },
      load(id) {
        if (id === entry) return `
          import { MetricTile, SegmentedControl } from "@xp/primitives";
          import { resolveBottomRegion } from "@xp/shells";
          import "@xp/primitives/styles.css";
          import "@xp/shells/regions.css";
          globalThis.xpTreeShakingFixture = [MetricTile, SegmentedControl, resolveBottomRegion];
        `;
      },
    }],
    build: { write: false, minify: false, rollupOptions: { input: entry } },
  });
  const chunks = result.output.filter(item => item.type === "chunk");
  const modules = chunks.flatMap(chunk => Object.keys(chunk.modules));
  for (const used of ["metric-tile.tsx", "segmented-control.tsx", "regions.ts"]) {
    assert.ok(modules.some(id => id.endsWith("/" + used)), `${used} must remain`);
  }
  for (const unused of ["/vaul/", "/vaul@", "adaptive-overlay.tsx", "source-presets.ts", "account-led-shell.tsx"]) {
    assert.ok(!modules.some(id => id.includes(unused)), `${unused} must tree-shake`);
  }
  const css = result.output.filter(item => item.type === "asset" && item.fileName.endsWith(".css"))
    .map(item => String(item.source)).join("\n");
  assert.match(css, /\.xp-visually-hidden/);
  assert.match(css, /--xp-bottom-clearance/);
}, 30_000);
