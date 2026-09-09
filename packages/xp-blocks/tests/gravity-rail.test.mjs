import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/gravity-rail.tsx", import.meta.url), "utf8");
const modelSource = readFileSync(new URL("../src/gravity-rail-model.ts", import.meta.url), "utf8");

test("GravityRail owns all nine explicit presets in one renderer", () => {
  for (const preset of [
    "framed-mono-wrap", "hairline-color-grid", "soft-mosaic", "dual-card-marquee", "bare-color-wall",
    "split-vertical-partners", "split-identity-orbit", "split-staggered-pyramid", "split-muted-mosaic",
  ]) assert.match(`${source}\n${modelSource}`, new RegExp(`"${preset}"`));
  assert.equal((source.match(/data-xp-gravity-renderer/g) ?? []).length, 1);
});

test("asset resolver keeps local light and dark hashes and validates source ownership", () => {
  assert.match(modelSource, /colorOnLight/);
  assert.match(modelSource, /colorOnDark/);
  assert.match(source, /data-light-hash/);
  assert.match(source, /data-dark-hash/);
  assert.match(modelSource, /identity\.role !== logo\.role/);
});

test("motion lanes share one pause owner and CTA stays outside motion", () => {
  assert.match(source, /data-shared-paused/);
  assert.match(source, /showToggle=\{false\}/);
  assert.equal((source.match(/data-xp-gravity-pause/g) ?? []).length, 1);
  assert.match(source, /data-xp-gravity-action/);
  assert.match(source, /<LogoField model=\{model\}/);
});
