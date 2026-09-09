#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { validateManifest } from "./validate-manifest.mjs";

function manifestsUnder(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return manifestsUnder(target);
    return entry.name === "xpresso.block.json" ? [target] : [];
  });
}

const files = process.argv.slice(2).flatMap((root) => manifestsUnder(path.resolve(root)));
let failed = false;

for (const file of files) {
  const result = validateManifest(JSON.parse(fs.readFileSync(file, "utf8")));
  for (const error of result.errors) {
    failed = true;
    console.error(`${file}${error.path} [${error.rule}] ${error.message}`);
  }
}

if (failed) process.exit(1);
console.log(`G1 PASS: ${files.length} manifests`);
