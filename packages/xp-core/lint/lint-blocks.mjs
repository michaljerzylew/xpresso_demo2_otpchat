#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { lintSource } from "./xp-lint.mjs";

function filesUnder(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return filesUnder(target);
    return /\.(?:css|tsx?|jsx?)$/.test(entry.name) ? [target] : [];
  });
}

function nearestManifest(file, boundary) {
  let directory = path.dirname(file);
  while (directory.startsWith(boundary)) {
    const candidate = path.join(directory, "xpresso.block.json");
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return null;
}

const roots = process.argv.slice(2).map((root) => path.resolve(root));
const issues = [];
let count = 0;

for (const root of roots) {
  for (const file of filesUnder(root)) {
    const manifest = nearestManifest(file, root);
    const source = fs.readFileSync(file, "utf8");
    issues.push(...lintSource(source, {
      path: file,
      declaredTokens: manifest?.tokens ?? [],
      hasContainerAncestor: Boolean(manifest),
    }));
    count += 1;
  }
}

if (issues.length > 0) {
  for (const entry of issues) console.error(`${entry.path}:${entry.line} [${entry.rule}] ${entry.message}`);
  process.exit(1);
}

console.log(`G8 PASS: ${count} block source files`);
