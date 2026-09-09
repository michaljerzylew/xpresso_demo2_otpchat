#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../tokens/xpresso.fluid.config.ts";
import { compileStyleFallbacks } from "./lib/compile-style-fallbacks.mjs";
import { generateDetectionCss } from "./lib/detection.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const destination = path.join(directory, "dist");
const fixturePath = path.join(directory, "fixtures/style-query-probe.css");
const source = fs.readFileSync(fixturePath, "utf8");
const fallback = compileStyleFallbacks(source, config, { from: fixturePath });

fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, "detection.css"), generateDetectionCss(config));
fs.writeFileSync(path.join(destination, "style-query-probe.fallback.css"), fallback.css);

console.log(`ok: detection stylesheet + ${fallback.replacements} style-query fallbacks → styles/dist`);
