import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formSurfaceWizardActionBehavior } from "../src/form-surface.tsx";
import { canNavigateToWizardStep, canNavigateWithWizardPolicy, defineWizard, validateWizardConfiguration } from "../src/wizard-shell.tsx";

const definition = defineWizard([
  { id: "account" },
  { id: "details" },
  { id: "complete" },
]);
const steps = [
  { id: "account", label: "Account", actions: [{ id: "next", label: "Next", behavior: "next", emphasis: "primary" }] },
  { id: "details", label: "Details", actions: [{ id: "back", label: "Back", behavior: "previous", emphasis: "secondary" }, { id: "submit", label: "Finish", behavior: "submit", emphasis: "primary" }] },
  { id: "complete", label: "Complete", progress: "hidden", terminal: true, actions: [{ id: "reset", label: "Reset", behavior: "reset", emphasis: "secondary" }] },
];

test("WizardShell validates one ordered engine, one terminal step and explicit actions", () => {
  assert.equal(validateWizardConfiguration(definition, steps, "account"), true);
  assert.throws(
    () => validateWizardConfiguration(definition, [...steps.slice(0, 2), { ...steps[2], id: "missing" }], "account"),
    /same ordered IDs/,
  );
  assert.throws(
    () => validateWizardConfiguration(definition, steps.map((step) => ({ ...step, terminal: false })), "account"),
    /exactly one terminal/,
  );
});

test("WizardShell permits only current and visited progress destinations", () => {
  const visited = new Set(["account", "details"]);
  assert.equal(canNavigateToWizardStep("account", "details", visited), true);
  assert.equal(canNavigateToWizardStep("details", "details", visited), true);
  assert.equal(canNavigateToWizardStep("complete", "details", visited), false);
});

test("WizardShell direct policy makes every declared selector reachable", () => {
  const visited = new Set(["account"]);
  assert.equal(canNavigateWithWizardPolicy("complete", "account", visited, "direct"), true);
  assert.equal(canNavigateWithWizardPolicy("complete", "account", visited, "visited"), false);
});

test("WizardShell progress selectors retain full accessible labels when local geometry compacts their visible copy", () => {
  const source = readFileSync(new URL("../src/wizard-shell.tsx", import.meta.url), "utf8");
  assert.match(source, /aria-label=\{`\$\{step\.label\}\. \$\{progressStatus\(step, core\)\}`\}/);
});

test("FormSurface wizard adapter maps legacy stage ownership to explicit workflow behavior", () => {
  assert.equal(formSurfaceWizardActionBehavior({ id: "a", label: "Next", kind: "primary" }, 0, 4), "next");
  assert.equal(formSurfaceWizardActionBehavior({ id: "b", label: "Back", kind: "secondary" }, 1, 4), "previous");
  assert.equal(formSurfaceWizardActionBehavior({ id: "c", label: "Finish", kind: "primary" }, 2, 4), "submit");
  assert.equal(formSurfaceWizardActionBehavior({ id: "d", label: "Reset", kind: "secondary" }, 3, 4), "reset");
});

test("FormSurface presets 08 and 09 use the shared shell and pane without a local wizard state engine", () => {
  const source = readFileSync(new URL("../src/form-surface.tsx", import.meta.url), "utf8");
  assert.match(source, /<WizardShell/);
  assert.match(source, /<StepPane/);
  assert.match(source, /productWizardDefinition = defineWizard/);
  assert.match(source, /accountWizardDefinition = defineWizard/);
  assert.doesNotMatch(source, /if \(!wizard\)/);
  assert.doesNotMatch(source, /action\.kind === "secondary" \? Math\.max/);
});
