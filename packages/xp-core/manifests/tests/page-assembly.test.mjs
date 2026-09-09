import assert from "node:assert/strict";
import test from "node:test";
import { validatePageAssembly } from "../validate-page-assembly.mjs";

const item = (name, adjacency) => ({ name, adjacency });

test("G10 suppresses a local proof slot when a page proof owner is present", () => {
  const result = validatePageAssembly([
    item("stage", { exposes: ["stage"], suppressesPartsWhenPresent: [{ part: "proof", capabilities: ["proof"] }] }),
    item("gravity-rail", { exposes: ["proof"] }),
  ]);
  assert.deepEqual(result, {
    valid: true,
    active: ["stage", "gravity-rail"],
    suppressed: [],
    suppressedParts: [{ name: "stage", part: "proof", because: "proof" }],
    errors: [],
  });
});

test("G10 rejects two active owners of the same page capability", () => {
  const result = validatePageAssembly([
    item("review-summary", { exposes: ["rating"] }),
    item("review-wall", { exposes: ["rating"] }),
  ]);
  assert.equal(result.valid, false);
  assert.deepEqual(result.suppressedParts, []);
  assert.ok(result.errors.some(({ rule, capability }) => rule === "duplicate-exposure" && capability === "rating"));
});

test("G10 rejects declared adjacency conflicts", () => {
  const result = validatePageAssembly([
    item("mock-showcase", { conflictsWith: ["real-screenshot"] }),
    item("product-capture", { exposes: ["real-screenshot"] }),
  ]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ rule }) => rule === "conflict"));
});
