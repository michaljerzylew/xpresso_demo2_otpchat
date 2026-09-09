import assert from "node:assert/strict";
import test from "node:test";
import config from "../xpresso.fluid.config.ts";
import { generateTokens, validateConfig } from "../lib/generate-tokens.mjs";

const clone = () => structuredClone(config);

test("the canonical token config generates both artifacts", () => {
  const result = generateTokens(config);
  assert.deepEqual(result.errors, []);
  assert.match(result.runtimeCss, /--role-section-title:/);
  assert.match(result.runtimeCss, /--text-step-2-vi:/);
  assert.match(result.tailwindCss, /--text-role-section-title:/);
  assert.match(result.tailwindCss, /--spacing-s-m:/);
});

test("the WCAG slope gate catches a seeded violation", () => {
  const seeded = clone();
  seeded.type.poles.M.max.size = 80;
  assert.ok(validateConfig(seeded).some((error) => error.includes("wcagViolation")));
});

test("the continuity gate catches a seeded discontinuity", () => {
  const seeded = clone();
  seeded.type.poles.TP.min.size += 2;
  assert.ok(validateConfig(seeded).some((error) => error.includes("continuity: text-step")));
});

test("the monotone-role gate catches a seeded role regression", () => {
  const seeded = clone();
  seeded.roles["section-title"].TP = seeded.roles["section-title"].M - 1;
  assert.ok(validateConfig(seeded).some((error) => error.includes("role section-title: step falls M->TP")));
});
