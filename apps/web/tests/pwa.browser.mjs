/**
 * Issue #39 browser evidence. A service worker only exists in a real browser over a
 * secure origin, so nothing here can be asserted from a unit test.
 *
 *   pnpm --filter web build
 *   pnpm --filter web preview --port 4173
 *   XP_BROWSER_CHANNEL=chrome pnpm --filter web test:browser:pwa
 */
import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { sizes } from "../../../scripts/qa/common.mjs";

const base = process.env.XP_BASE_URL ?? "http://127.0.0.1:4173";
const workerScript = fileURLToPath(new URL("../dist/sw.js", import.meta.url));
const original = readFileSync(workerScript);
const browser = await chromium.launch({ channel: process.env.XP_BROWSER_CHANNEL ?? "chrome" });
const checks = [];

async function controlled(page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 20_000 });
}

try {
  // A starter occupies the pane the shell gives it, not a fraction of the viewport.
  mkdirSync(new URL("../evidence/", import.meta.url), { recursive: true });
  for (const [deviceClass, [width, height]] of Object.entries(sizes)) for (const mode of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: mode });
    const page = await context.newPage();
    await page.goto(`${base}/?xp=${deviceClass}&xp-frame=1`);
    await page.locator('.route-pane[data-active="true"][data-settled="true"] .start-screen').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.locator(".start-screen").evaluate(screen => {
      const pane = screen.closest(".route-detail").getBoundingClientRect();
      const first = screen.firstElementChild.getBoundingClientRect();
      const last = screen.lastElementChild.getBoundingClientRect();
      return { offset: Math.abs((first.top + last.bottom) / 2 - (pane.top + pane.bottom) / 2), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.ok(geometry.offset <= 2, `${deviceClass}/${mode}: starter centre is ${geometry.offset}px from pane centre`);
    assert.equal(geometry.overflow, false, `${deviceClass}/${mode}: no horizontal overflow`);
    await page.screenshot({ path: fileURLToPath(new URL(`../evidence/starter-${deviceClass}-${mode}.png`, import.meta.url)) });
    await context.close();
  }
  checks.push("starter centred in its pane on five classes and both modes");
  // 1. Manifest, per-mode chrome colours and icons.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto(base + "/");
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    assert.equal(manifestHref, "/manifest.webmanifest");
    const manifest = await page.evaluate(async href => (await fetch(href)).json(), manifestHref);
    assert.equal(manifest.display, "standalone");
    for (const icon of manifest.icons) {
      const status = await page.evaluate(async src => (await fetch(src)).status, icon.src);
      assert.equal(status, 200, icon.src);
    }
    const colors = await page.locator('meta[name="theme-color"]').evaluateAll(
      metas => metas.map(meta => [meta.getAttribute("media"), meta.content]));
    assert.equal(colors.length, 2);
    for (const [media, value] of colors) {
      assert.match(media, /prefers-color-scheme: (light|dark)/);
      // Filled at run time from the theme tokens, never from a literal in the HTML.
      assert.match(value, /^#[0-9a-f]{6}$/, media);
    }
    assert.notEqual(colors[0][1], colors[1][1], "light and dark chrome must differ");
    // Lighthouse 12 dropped the PWA category, so installability is proven against
    // Chrome's own manifest parser instead of an audit score.
    const parsed = await (await context.newCDPSession(page)).send("Page.getAppManifest");
    assert.deepEqual(parsed.errors, [], "Chrome must parse the manifest without errors");
    assert.equal(parsed.parsed?.startUrl ?? new URL(manifest.start_url, base).href, base + "/");
    // The self-reference an installed app is matched against. Desktop Chromium needs
    // the absolute `id`; `url` stays relative and resolves against this origin.
    const [related] = manifest.related_applications;
    if (related) {
      assert.equal(related.platform, "webapp");
      assert.equal(new URL(related.url, base + "/manifest.webmanifest").href, base + "/manifest.webmanifest");
      assert.match(related.id, /^https:\/\/[^/]+\/$/, "the web app id must be absolute");
    } else assert.deepEqual(manifest.related_applications, [], "no deployment origin is configured yet");
    const answer = await page.evaluate(async () => {
      if (typeof navigator.getInstalledRelatedApps !== "function") return "unsupported";
      try { return await navigator.getInstalledRelatedApps(); } catch (error) { return String(error); }
    });
    // This proves the API exists here and does not reject on this page. It does NOT
    // prove the entry would match: the app is not installed, and the id names the
    // production origin rather than this one, so an empty list is the only possible
    // answer. Only a real install on that origin can exercise the positive case.
    assert.ok(Array.isArray(answer), `getInstalledRelatedApps did not resolve: ${answer}`);
    assert.equal(answer.length, 0, "nothing is installed in this profile");
    checks.push("manifest parses in Chrome with 0 errors, " + manifest.icons.length
      + " icons reachable, per-mode theme-color, related-app id " + (related?.id ?? "not configured")
      + ", getInstalledRelatedApps() resolves (empty, nothing installed)");
    await context.close();
  }

  // 2. Registration, precache and an offline navigation to a route never visited online.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto(base + "/");
    await controlled(page);
    const precached = await page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith("workbox-precache"));
      return name ? (await (await caches.open(name)).keys()).length : 0;
    });
    assert.ok(precached >= 5, `precache holds ${precached} entries`);

    await context.setOffline(true);
    await page.goto(base + "/configure");
    await page.getByRole("heading", { name: "Customise", level: 1 }).waitFor();
    await page.getByRole("img", { name: "Neutral ramp, tones 50 to 950", exact: true }).waitFor();
    await context.setOffline(false);
    checks.push("worker controls the page, " + precached + " precached entries, offline /configure renders");
    await context.close();
  }

  // 3. A newer worker takes over and the page asks for a reload instead of taking it.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto(base + "/");
    await controlled(page);
    appendFileSync(workerScript, `\n// evidence bump ${Date.now()}\n`);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });
    const toast = page.locator(".pwa-toast");
    await toast.waitFor({ timeout: 20_000 });
    assert.equal(await toast.getByText("New version, reload").count(), 1);
    assert.equal(await toast.evaluate(element => element.getAttribute("role")), "status");
    // enter() animates opacity to 1; the toast must be readable when it settles.
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".pwa-toast")).opacity) === 1);
    for (const name of ["Reload", "Later"]) {
      const box = await toast.getByRole("button", { name, exact: true }).boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, `${name} ${JSON.stringify(box)}`);
    }
    await toast.screenshot({ path: new URL("../evidence/pwa-update-toast.png", import.meta.url).pathname });
    await toast.getByRole("button", { name: "Reload", exact: true }).click();
    await page.waitForLoadState("load");
    await page.locator(".pwa-toast").waitFor({ state: "detached" });
    checks.push("autoUpdate worker activates, toast offers the reload, reload clears it");
    await context.close();
  }

  console.log("PASS: " + checks.join("; ") + ".");
} finally { writeFileSync(workerScript, original); await browser.close(); }
