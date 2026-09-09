import { expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// The gate is only as good as what it does not read. It used to read `#101` in a comment citing an
// issue as a three-digit hex colour, which failed the release head's own test suite; excluding
// comments must not blind it to a colour in code or in a string. Both directions are proved here on
// fixtures rather than on the app, so neither can regress silently.
const gate = resolve(import.meta.dirname, "../../../scripts/check_no_hardcoded_colors.mjs");

const run = files => {
  const directory = mkdtempSync(join(tmpdir(), "colour-gate-"));
  mkdirSync(join(directory, "src"), { recursive: true });
  for (const [name, source] of Object.entries(files)) writeFileSync(join(directory, "src", name), source);
  try {
    return { code: 0, out: execFileSync(process.execPath, [gate, join(directory, "src")], { encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status, out: (error.stdout ?? "") + (error.stderr ?? "") };
  }
};

test("comment text is not code: an issue reference is not a colour", () => {
  const clean = run({
    "shell.tsx": [
      "// The reveal effect finishes by arithmetic (#59, #101).",
      "/* Same rule as the DS sidebar (#60), same reason (#58, #101). */",
      "export const tone = \"var(--xp-primary)\";",
    ].join("\n"),
    "shell.css": [
      "/* Seven destinations plus a module's own section tree (#101). */",
      ".workspace { color: var(--xp-ink); }",
    ].join("\n"),
    "index.html": "<!-- release #101 --><body class=\"bg-[var(--xp-surface)]\"></body>",
  });
  expect(clean.out).toContain("PASS");
  expect(clean.code).toBe(0);
});

test("a literal colour still fails, in code, in a string and in a palette utility", () => {
  for (const source of [
    "export const tone = \"#ff0000\";",
    "export const tone = { color: \"rgb(255 0 0)\" };",
    "export const cls = \"bg-red-500\";",
    "export const cls = \"text-white\";",
  ]) {
    const hit = run({ "shell.tsx": source });
    expect(hit.code, source).toBe(1);
    expect(hit.out, source).toContain("FAIL");
  }
  const css = run({ "shell.css": ".workspace { color: #abc; }" });
  expect(css.code).toBe(1);
  // Five separate Node startups share the host with builds and browser suites.
  // This is a subprocess budget, not a relaxation of any colour assertion.
}, 15_000);

test("a URL is not a comment, so a colour after one is still read", () => {
  // `//` inside a string starts no comment. Blanking from it would hide everything after it on the
  // line, which is exactly how a comment-aware gate goes blind.
  const hit = run({ "shell.tsx": "export const link = \"https://example.test/x\"; export const tone = \"#123456\";" });
  expect(hit.code).toBe(1);
  expect(hit.out).toContain("FAIL");
});

test("an apostrophe in prose opens no string, so a later comment is still comment", () => {
  // Treating a quote in JSX text as a string opener left every following comment unblanked, which is
  // how the gate read an issue reference as a colour again after it was first fixed.
  const clean = run({
    "prose.tsx": [
      "export const Panel = () => <section>",
      "  <p>an agent's source</p>",
      "  <p>the reader's own copy</p>",
      "</section>;",
      "// the release issue (#101) cited after prose with an apostrophe",
    ].join("\n"),
    "trailing.tsx": [
      "export const value = 1; // an operator's note about issue #101",
      "export const other = 2; /* the guest's receipt, issue #101 */",
    ].join("\n"),
  });
  expect(clean.out).toContain("PASS");
  expect(clean.code).toBe(0);
});

test("a comment before a closing bracket is still a comment", () => {
  const clean = run({
    "deps.tsx": [
      "import { useEffect } from \"react\";",
      "export const Hook = () => {",
      "  useEffect(() => {}, [",
      "    // the portal gate, see issue #101",
      "  ]);",
      "  return null;",
      "};",
    ].join("\n"),
  });
  expect(clean.out).toContain("PASS");
  expect(clean.code).toBe(0);
});

test("the gate reads the app itself and passes", () => {
  const app = resolve(import.meta.dirname, "../src");
  expect(execFileSync(process.execPath, [gate, app], { encoding: "utf8" })).toContain("PASS");
});
