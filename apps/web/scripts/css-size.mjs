// Issue #74 gates the render-blocking CSS payload at 60 kB gzipped. The entry
// stylesheet is inlined into the document at build time, so `gzip -c dist/assets/*.css`
// no longer sees it; this reports the same number from wherever the CSS ended up.
import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";

const limit = 60 * 1024;
const dist = new URL("../dist/", import.meta.url);
const measure = (name, css) => {
  const gzip = gzipSync(css).length;
  console.log(`${name}: ${css.length} B raw, ${gzip} B gzip`);
  return gzip;
};

const document = readFileSync(new URL("index.html", dist), "utf8");
const inlined = [...document.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(match => match[1]).join("");
const linked = [...document.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\/([^"]+)"/g)]
  .map(match => match[1]);

let blocking = 0;
if (inlined) blocking += measure("inlined in index.html", inlined);
for (const name of linked) blocking += measure(`linked ${name}`, readFileSync(new URL(name, dist), "utf8"));

// Route-level CSS chunks load with their route and never block the first paint.
for (const name of readdirSync(new URL("assets/", dist)).filter(file => file.endsWith(".css"))) {
  if (linked.includes(`assets/${name}`)) continue;
  measure(`route chunk assets/${name} (not render blocking)`, readFileSync(new URL(`assets/${name}`, dist), "utf8"));
}

console.log(`render-blocking CSS: ${blocking} B gzip (limit ${limit} B)`);
if (blocking > limit) {
  console.error("FAIL: render-blocking CSS is over the Issue #74 budget.");
  process.exit(1);
}
console.log("PASS: render-blocking CSS is within budget.");
