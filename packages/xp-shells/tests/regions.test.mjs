import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import schema from "../../xp-core/schemas/block-1.1.schema.json" with { type: "json" };
import { bottomRegionYieldOrder, regionTokens, relocationTargets, resolveBottomRegion } from "../src/regions.ts";

const active = (...owners) => owners.map((owner) => ({ owner, active: true }));

test("bottom region resolves one owner by the declared yield order", () => {
  assert.deepEqual(bottomRegionYieldOrder, ["overlay", "consent", "sticky-action", "tab-bar"]);
  assert.equal(resolveBottomRegion(active("tab-bar", "sticky-action", "consent", "overlay")), "overlay");
  assert.equal(resolveBottomRegion(active("tab-bar", "sticky-action", "consent")), "consent");
  assert.equal(resolveBottomRegion(active("tab-bar", "sticky-action", "consent"), { consentHasPresented: true }), "sticky-action");
  assert.equal(resolveBottomRegion(active("tab-bar")), "tab-bar");
  assert.equal(resolveBottomRegion([]), null);
});

test("region CSS stubs safe-area and top/bottom availability math", () => {
  const css = readFileSync(new URL("../styles/regions.css", import.meta.url), "utf8");
  for (const token of regionTokens) assert.ok(css.includes(token), `Missing ${token}`);
  assert.match(css, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(css, /--xp-chrome-top-height:\s*calc\(var\(--xp-announce-height\) \+ var\(--xp-navigation-height\)\)/);
  assert.match(css, /--xp-available-svh:\s*calc\(100svh - var\(--xp-chrome-top-height\) - var\(--xp-bottom-clearance\)\)/);
});

test("shell relocation registry stays identical to manifest v1.1", () => {
  const schemaTargets = schema.$defs.relocation.properties.target.enum;
  assert.deepEqual([...relocationTargets], schemaTargets);
});
