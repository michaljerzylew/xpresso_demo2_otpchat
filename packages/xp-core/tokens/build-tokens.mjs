#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./xpresso.fluid.config.ts";
import { generateTokens } from "./lib/generate-tokens.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const generated = generateTokens(config);

if (generated.errors.length > 0) {
  console.error(`L0 GATE FAILED:\n  ${generated.errors.join("\n  ")}`);
  process.exit(1);
}

const destination = path.join(directory, "dist");
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, "xp-tokens.css"), generated.runtimeCss);
fs.writeFileSync(path.join(destination, "xp-tokens.theme.css"), generated.tailwindCss);

console.log(
  `ok: ${generated.segments.length} segments, ${Object.keys(generated.segments[0].declarations).length} tokens/segment → tokens/dist (gates passed)`,
);
