/**
 * Issue #76 browser evidence. The Worker's CSP only exists in front of the Worker,
 * so `vite preview` cannot prove any of this; run it against `wrangler dev`.
 *
 *   pnpm -r build
 *   npx wrangler dev -c apps/web/wrangler.toml --port 8791 --ip 127.0.0.1
 *   # In another terminal:
 *   XP_BASE_URL=http://127.0.0.1:8791 pnpm --filter web test:browser:csp
 *
 * Two questions, and neither is answered by the console alone:
 *   1. Does anything on the page violate the policy? Read from the console and from
 *      the page's own `securitypolicyviolation` events, because a blocked inline
 *      script reports through the second whatever the first is filtered to.
 *   2. Is the first painted frame already dark for a dark-mode reader? Measured at
 *      the first animation frame, which is the frame before the first paint, and
 *      again from the pixels of the screenshot taken at that moment.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { qa } from "../../../scripts/qa/common.mjs";

const base = process.env.XP_BASE_URL ?? "http://127.0.0.1:8791";
const routes = [...new Set(["/", ...qa.perfRoutes.map(route => route[2])])];
const evidence = new URL("../evidence/", import.meta.url);
mkdirSync(fileURLToPath(evidence), { recursive: true });

/** Relative luminance of an sRGB byte triple, 0 black to 1 white. */
function luminance([red, green, blue]) {
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

/**
 * The theme resolves to `oklch(...)`, whose three numbers are not sRGB channels, so
 * the browser does the conversion: painting the colour on a canvas and reading the
 * pixel back is the same transform the compositor applies.
 */
function srgbOf(page, color) {
  return page.evaluate(value => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }, color);
}

/** Records the CSP violations the page reports and the state of the first frame. */
function instrument() {
  window.__xpCspViolations = [];
  document.addEventListener("securitypolicyviolation", event => {
    window.__xpCspViolations.push(`${event.violatedDirective} blocked ${event.blockedURI || "inline"}`);
  });
  const capture = () => {
    // The document may not have a body yet on the very first frame.
    if (!document.body) return void requestAnimationFrame(capture);
    window.__xpFirstPaint = {
      theme: document.documentElement.dataset.theme,
      preference: document.documentElement.dataset.themePreference,
      background: getComputedStyle(document.body).backgroundColor,
      mounted: (document.getElementById("root")?.childElementCount ?? 0) > 0,
    };
  };
  requestAnimationFrame(capture);
}

const browser = await chromium.launch({ channel: process.env.XP_BROWSER_CHANNEL ?? "chrome" });
const checks = [];
let firstPaintShot = null;
let bootstrapShot = null;

try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: "dark" });
    const page = await context.newPage();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(instrument);

    const consoleErrors = [];
    page.on("console", message => {
      if (/content security policy|refused to (execute|load|apply)/i.test(message.text())) {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", error => consoleErrors.push(`pageerror: ${error.message}`));

    // `commit` returns before the first paint, so the measurement is not raced.
    const response = await page.goto(base + route, { waitUntil: "commit" });
    const csp = response.headers()["content-security-policy"];
    assert.ok(csp, `${route} served no CSP`);
    assert.match(csp, /script-src 'self' 'sha256-[^']+'/, route);
    assert.doesNotMatch(csp.split("; ").find(part => part.startsWith("script-src ")), /unsafe-inline/, route);

    await page.waitForFunction(() => window.__xpFirstPaint !== undefined, undefined, { timeout: 20_000 });
    const firstPaint = await page.evaluate(() => window.__xpFirstPaint);
    const shot = await page.screenshot();
    if (route === "/") {
      firstPaintShot = shot;
      writeFileSync(new URL("csp-first-paint-dark.png", evidence), shot);
    }

    // Let the app mount and any deferred script run, so a late violation still lands.
    await page.waitForLoadState("load");
    await page.waitForFunction(() => (document.getElementById("root")?.childElementCount ?? 0) > 0,
      undefined, { timeout: 20_000 });
    const violations = await page.evaluate(() => window.__xpCspViolations);

    assert.deepEqual(violations, [], `${route} reported CSP violations`);
    assert.deepEqual(consoleErrors, [], `${route} logged blocked resources`);
    assert.equal(firstPaint.theme, "dark", `${route} first frame theme`);
    assert.equal(firstPaint.preference, "system", `${route} first frame preference`);
    const level = luminance(await srgbOf(page, firstPaint.background));
    assert.ok(level < 0.2, `${route} first frame background ${firstPaint.background} (luminance ${level.toFixed(3)})`);
    checks.push(`${route}: 0 violations, first frame data-theme="dark", body ${firstPaint.background}`
      + ` (luminance ${level.toFixed(3)}, app ${firstPaint.mounted ? "already" : "not yet"} mounted)`);
    await context.close();
  }

  // The frame before the app exists at all: the module bundle is blocked, so what
  // paints is the bootstrap's work alone. This is the frame the light flash was in.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: "dark" });
    const page = await context.newPage();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(instrument);
    await page.route(/\/assets\/index-[^/]+\.js$/, route => route.abort());
    await page.goto(base + "/", { waitUntil: "commit" });
    await page.waitForFunction(() => window.__xpFirstPaint !== undefined, undefined, { timeout: 20_000 });
    const firstPaint = await page.evaluate(() => window.__xpFirstPaint);
    assert.equal(firstPaint.mounted, false, "the app must not have mounted in this run");
    assert.equal(firstPaint.theme, "dark");
    bootstrapShot = await page.screenshot();
    writeFileSync(new URL("csp-first-paint-bootstrap.png", evidence), bootstrapShot);
    checks.push('bootstrap-only frame carries data-theme="dark" with the app bundle blocked');
    await context.close();
  }

  // The pixels of the frames themselves, decoded in the same browser rather than
  // trusted from a computed style: a dark token that never reached the paint shows here.
  {
    const page = await browser.newPage();
    const meanLuminance = data => page.evaluate(async encoded => {
      const image = new Image();
      image.src = "data:image/png;base64," + encoded;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height);
      let total = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        total += 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
      }
      return total / (pixels.length / 4) / 255;
    }, data.toString("base64"));
    for (const [file, shot] of [["csp-first-paint-dark.png", firstPaintShot],
      ["csp-first-paint-bootstrap.png", bootstrapShot]]) {
      const mean = await meanLuminance(shot);
      assert.ok(mean < 0.35, `${file} mean luminance ${mean.toFixed(3)} is not a dark frame`);
      checks.push(`evidence/${file} mean luminance ${mean.toFixed(3)}`);
    }
    await page.close();
  }

  console.log("PASS: " + checks.join("; ") + ".");
} finally {
  await browser.close();
}
