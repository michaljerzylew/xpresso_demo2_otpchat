import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "vitest";
import { buildCsp } from "../src/csp.ts";
import { inlineScriptHashes as committed } from "../src/csp-hashes.ts";
import worker from "../src/worker.ts";
import { currentHashes, inlineScriptHashes, renderModule } from "../scripts/csp-hashes.mjs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const scriptSrc = csp => csp.split("; ").find(directive => directive.startsWith("script-src "));

test("the committed hash module is exactly what the generator produces", () => {
  // Regenerating must be a no-op, so the Worker can never name a stale script.
  assert.equal(read("src/csp-hashes.ts"), renderModule(currentHashes()));
  assert.deepEqual([...committed], currentHashes());
});

test("the hash covers the theme bootstrap index.html actually ships", () => {
  const html = read("index.html");
  assert.match(html, /root\.dataset\.theme =/, "the bootstrap must still be inline");
  assert.equal(committed.length, 1, "one inline script, one hash");
  assert.match(committed[0], /^sha256-[A-Za-z0-9+/]+=*$/);
});

test("the build passes the inline script through untouched", () => {
  // If a bundler ever rewrites it, the deployed hash would stop matching in silence.
  const built = new URL("../dist/index.html", import.meta.url);
  if (!existsSync(built)) return;
  assert.deepEqual(inlineScriptHashes(readFileSync(built, "utf8")), [...committed]);
});

test("only executable inline scripts are hashed", () => {
  const hashes = inlineScriptHashes(`
    <script src="/assets/app.js"></script>
    <script type="application/ld+json">{"@type":"WebSite"}</script>
    <script type="module">export const a = 1;</script>
    <script>const b = 2;</script>
  `);
  assert.equal(hashes.length, 2, "the src script and the JSON block carry no hash");
  assert.notEqual(hashes[0], hashes[1]);
});

test("script-src names every hash and never opens up to unsafe-inline", () => {
  const csp = buildCsp(["sha256-aaa=", "sha256-bbb="]);
  assert.equal(scriptSrc(csp), "script-src 'self' 'sha256-aaa=' 'sha256-bbb='");
  assert.doesNotMatch(scriptSrc(csp), /unsafe-inline|unsafe-eval/);
  // The other directives are untouched by the hashes.
  for (const directive of ["default-src 'self'", "worker-src 'self'", "manifest-src 'self'",
    "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"]) {
    assert.ok(csp.split("; ").includes(directive), directive);
  }
  assert.equal(scriptSrc(buildCsp([])), "script-src 'self'");
});

test("the Worker serves the bootstrap hash on every response", async () => {
  for (const path of ["/", "/inbox", "/settings"]) {
    const response = await worker.fetch(new Request("https://example.com" + path), {
      ASSETS: { fetch: async () => new Response("app", { headers: { "Content-Type": "text/html" } }) },
    });
    const csp = response.headers.get("Content-Security-Policy");
    assert.equal(scriptSrc(csp), `script-src 'self' '${committed[0]}'`, path);
  }
});
