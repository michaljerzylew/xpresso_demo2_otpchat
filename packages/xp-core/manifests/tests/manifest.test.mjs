import assert from "node:assert/strict";
import test from "node:test";
import { validateManifest } from "../validate-manifest.mjs";

const manifest = () => ({
  $schema: "https://xpresso.studio/schemas/block-1.1.json",
  name: "foundation-fixture",
  version: "1.0.0",
  formsVocab: "1.1",
  job: "glance",
  contract: { slots: { label: { budget: "18ch" } } },
  fluid: false,
  whyPolymorphic: "A compact collection must not become a mobile tower.",
  forms: {
    M: { form: "rail" },
    TP: { form: "grid-2" },
    TL: { form: "band" },
    DS: { form: "band" },
    DW: { form: "band" },
  },
  engine: "css",
  tokens: ["--role-label", "--space-s"],
  budgets: { mobile_screens: 0.5, js_gz_kb: 0 },
  baseline: { core: "widely", enhancements: [] },
  a11y: { headingLevel: "h2", treeInvariant: true },
});

test("G1 accepts a complete v1.1 five-cell CSS manifest", () => {
  assert.deepEqual(validateManifest(manifest()), { valid: true, errors: [] });
});

test("G1 accepts fluid geometry with a class-owned CSS override", () => {
  const fixture = manifest();
  fixture.fluid = true;
  fixture.slotRange = { min: "S1", max: "S6" };
  fixture.formOverrides = { M: { form: "marquee" } };
  delete fixture.forms;
  delete fixture.whyPolymorphic;
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts a fluid structural override on the swap engine", () => {
  const fixture = manifest();
  fixture.fluid = true;
  fixture.slotRange = { min: "S1", max: "S5" };
  fixture.formOverrides = { M: { form: "takeover" } };
  fixture.engine = "swap";
  delete fixture.forms;
  delete fixture.whyPolymorphic;
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts T-bands only on a named inner container", () => {
  const fixture = manifest();
  fixture.innerContainers = [{ name: "metric-cell", bands: { min: "T1", max: "T3" } }];
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts a one-line role exemption for a skeleton morph", () => {
  const fixture = manifest();
  fixture.a11y = { treeInvariant: false, roleExemption: "Table and card-list roles differ; all content remains equal." };
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts v1.1 relocation targets and adjacency contract", () => {
  const fixture = manifest();
  fixture["slots+"] = { relocations: [{ part: "primaryAction", target: "context-pane", when: ["M", "TP"] }] };
  fixture.adjacency = { exposes: ["proof"], suppressesWhenPresent: ["rating"], conflictsWith: ["real-screenshot"] };
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts capability-driven local part suppression", () => {
  const fixture = manifest();
  fixture.adjacency = { exposes: ["stage"], suppressesPartsWhenPresent: [{ part: "proof", capabilities: ["proof"] }] };
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 accepts disjoint preset projection eligibility", () => {
  const fixture = manifest();
  fixture.contract.presets = ["ordinary", "narrative"];
  fixture.adjacency = { exposes: ["proof"], projectionEligibility: { capability: "proof", eligiblePresets: ["ordinary"], standalonePresets: ["narrative"] } };
  assert.deepEqual(validateManifest(fixture), { valid: true, errors: [] });
});

test("G1 rejects an incomplete preset projection partition", () => {
  const fixture = manifest();
  fixture.contract.presets = ["ordinary", "narrative", "orbit"];
  fixture.adjacency = { exposes: ["proof"], projectionEligibility: { capability: "proof", eligiblePresets: ["ordinary"], standalonePresets: ["narrative"] } };
  const result = validateManifest(fixture);
  assert.ok(result.errors.some(({ rule, message }) => rule === "adjacency" && message.includes("orbit")));
});

test("G1 rejects a seeded missing ladder cell", () => {
  const fixture = manifest();
  delete fixture.forms.TP;
  const result = validateManifest(fixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.rule === "schema" && error.message.includes("TP")));
});

test("G1 rejects formOverrides on a non-fluid manifest", () => {
  const fixture = manifest();
  fixture.formOverrides = { M: { form: "strip" } };
  assert.equal(validateManifest(fixture).valid, false);
});

test("G1 rejects the retired v1.0 vocabulary", () => {
  const fixture = manifest();
  fixture.formsVocab = "1.0";
  assert.equal(validateManifest(fixture).valid, false);
});

test("G1 rejects a T-band at the root slot", () => {
  const fixture = manifest();
  fixture.fluid = true;
  fixture.slotRange = { min: "T1", max: "S4" };
  delete fixture.forms;
  delete fixture.whyPolymorphic;
  assert.equal(validateManifest(fixture).valid, false);
});

test("G1 rejects reversed inner bands", () => {
  const fixture = manifest();
  fixture.innerContainers = [{ name: "metric-cell", bands: { min: "T3", max: "T1" } }];
  const result = validateManifest(fixture);
  assert.ok(result.errors.some((error) => error.rule === "band-order"));
});

test("G1 rejects role divergence without a justification", () => {
  const fixture = manifest();
  fixture.a11y.treeInvariant = false;
  assert.equal(validateManifest(fixture).valid, false);
});

test("G1 rejects a structural form on the CSS engine", () => {
  const fixture = manifest();
  fixture.forms.M = { form: "takeover" };
  const result = validateManifest(fixture);
  assert.ok(result.errors.some((error) => error.rule === "engine"));
});

test("G1 rejects a self-conflicting adjacency capability", () => {
  const fixture = manifest();
  fixture.adjacency = { exposes: ["proof"], conflictsWith: ["proof"] };
  const result = validateManifest(fixture);
  assert.ok(result.errors.some((error) => error.rule === "adjacency"));
});
