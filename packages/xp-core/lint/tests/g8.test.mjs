import assert from "node:assert/strict";
import test from "node:test";
import { lintSource } from "../xp-lint.mjs";

const context = {
  path: "packages/xp-blocks/fixture/block.css",
  declaredTokens: ["--role-body", "--space-s", "--tap-min"],
  hasContainerAncestor: true,
};

const seeded = [
  ["viewport-media", "@media (width > 40rem) { .x { color: red; } }"],
  ["viewport-variant", "<div className=\"md:block\" />"],
  ["viewport-unit", ".x { min-height: 100svh; }"],
  ["literal-length", ".x { padding: 12px; }"],
  ["xp-class-read", ".x { color: var(--xp-class); }"],
  ["outer-margin", "[data-xp-block] { margin-block: var(--space-s); }"],
  ["root-container-type", "[data-xp-block] { container-type: inline-size; }"],
  ["block-position", ".x { position: absolute; }"],
  ["block-position", ".x { position: fixed; }"],
  ["block-position", ".x { position: sticky; }"],
  ["bare-layout", ".x { display: grid; }"],
  ["bare-layout", "<div className=\"grid gap-s\" />"],
  ["physical-property", ".x { left: 0; }"],
  ["physical-property", "<div className=\"ml-s text-left\" />"],
  ["offscale-threshold", "@container xp-slot (inline-size >= 33rem) { .x { color: red; } }"],
  ["orphan-cqi", ".x { inline-size: 20cqi; }", { hasContainerAncestor: false }],
  ["undeclared-token", ".x { color: var(--not-declared); }"],
  ["use-is-mobile", "const compact = useIsMobile();"],
  ["window-width", "const width = window.innerWidth;"],
  ["disable-zoom", "<meta name=\"viewport\" content=\"user-scalable=no\" />"],
  ["raw-text-step", ".x { font-size: var(--text-step-2); }"],
  ["vendor-asset", ".x { background-image: url(https://cdn.shadcnstudio.com/asset.jpg); }"],
  ["vendor-asset", "const image = '/ss-assets/team.jpg';"],
];

for (const [rule, source, overrides = {}] of seeded) {
  test(`G8 rejects seeded ${rule}`, () => {
    const issues = lintSource(source, { ...context, ...overrides });
    assert.ok(issues.some((entry) => entry.rule === rule), JSON.stringify(issues, null, 2));
  });
}

test("G8 accepts role tokens, algebra classes, S-scale queries and a 1px border", () => {
  const source = `
    [data-xp-block] { border: 1px solid currentColor; font-size: var(--role-body); }
    @container xp-slot (inline-size >= 34rem) { .content { gap: var(--space-s); } }
    @container style(--xp-class: M) { .content { --form: rail; } }
  `;
  assert.deepEqual(lintSource(source, context), []);
});
