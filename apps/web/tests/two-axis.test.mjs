import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "vitest";

function sources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sources(path) : /\.(tsx?|css)$/.test(path) ? [path] : [];
  });
}
test("web content outside the shell has no viewport knowledge", () => {
  const root = fileURLToPath(new URL("../src", import.meta.url));
  const forbidden = /(?:window|globalThis)\s*\.\s*(?:innerWidth|innerHeight|matchMedia)|\bmatchMedia\s*\(|@media[^{}]*(?:width|height|orientation)|\b\d+(?:d?v[wh]|s?v[wh])\b/;
  for (const file of sources(root).filter((path) => !path.includes("/shell/"))) {
    assert.doesNotMatch(readFileSync(file, "utf8"), forbidden, file);
  }
});
