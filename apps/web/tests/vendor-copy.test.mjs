import { sourcePrefixes } from "../src/app-modules";
import { expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";

// `scripts/qa/inbox-vendor-sentences.mjs` compares every shipped sentence against the licensed
// templates, and it needs those templates on disk, which are gitignored. That makes it a tool, not a
// gate, and a vendor sentence shipped in offers because nothing ran it. What can run everywhere runs
// here: the sentences that comparison has already found, and the vendor brand names themselves, are
// asserted absent from app source on every test run.
const src = resolve(import.meta.dirname, "../src");

/** Verbatim vendor copy found by a template comparison. Add the sentence when a comparison finds one. */
const sentences = ["Keep this receipt for your records."];

/** Brand names of the licensed templates. Provenance belongs in a commit message, not in shipped source. */
const brands = ["AIDESK", "Tourix", "Promptly", "Calendrix", "RestroPOS", "Sprintrix", "Commerceo"];

const files = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) return files(path);
  return [".ts", ".tsx", ".js", ".jsx", ".css", ".html"].includes(extname(path)) ? [path] : [];
});

const sources = files(src).map(path => [path.slice(src.length + 1), readFileSync(path, "utf8")]);

test("no verbatim vendor sentence ships in app source", () => {
  const hits = sources.flatMap(([name, text]) => sentences.filter(sentence => text.includes(sentence)).map(sentence => `${name}: ${sentence}`));
  expect(hits).toEqual([]);
});

test("no licensed-template brand name ships in app source", () => {
  const hits = sources.flatMap(([name, text]) => brands.filter(brand => text.includes(brand)).map(brand => `${name}: ${brand}`));
  expect(hits).toEqual([]);
});

function assertCoverage(collected) {
  // A gate that reads nothing passes everything.
  expect(sourcePrefixes.length).toBeGreaterThan(0);
  expect(collected.length).toBeGreaterThan(sourcePrefixes.length * 10);
  for (const prefix of sourcePrefixes) expect(collected.some(([name]) => name.startsWith(prefix)), prefix).toBe(true);
}

test("the gate reads real app source", () => {
  assertCoverage(sources);
});

test("one file per registered prefix cannot make an incomplete scan pass", () => {
  const incomplete = sourcePrefixes.map(prefix => sources.find(([name]) => name.startsWith(prefix)));
  expect(incomplete.every(Boolean)).toBe(true);
  expect(() => assertCoverage(incomplete)).toThrow();
});
