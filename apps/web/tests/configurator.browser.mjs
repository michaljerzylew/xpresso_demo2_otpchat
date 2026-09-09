import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { screens, qa } from "../../../scripts/qa/common.mjs";
const preferenceRoute = screens.find(screen => screen.id === "settings")?.path ?? screens.find(screen => screen.id === qa.perfScreen).path;
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.XP_BASE_URL ?? "http://127.0.0.1:5181";
const evidence = new URL("../evidence/", import.meta.url);
// These journeys exercise docking; calendar-shell separately verifies the DS overlay below 1400px.
const sizes = { M: [390, 844], TP: [768, 1024], TL: [1024, 768], DS: [1440, 768], DW: [1920, 1080] };
const coarse = ["M", "TP", "TL"];
const docked = ["DS", "DW"];

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: process.env.XP_BROWSER_CHANNEL ?? "chrome" });
const errors = [];
let shots = 0;
const shot = async (page, name) => { await page.screenshot({ path: new URL(name + ".png", evidence).pathname }); shots++; };
let phase = "startup";

function monitor(page) {
  const starts = new WeakMap();
  page.on("request", request => starts.set(request, { phase, frame: request.frame().url() }));
  page.on("requestfailed", request => {
    errors.push(`${request.failure()?.errorText} ${request.url()}`);
    console.error("Request failure context:", { start: starts.get(request), phase, frame: request.frame().url(), url: request.url() });
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push("console: " + message.text()); });
  page.on("response", response => {
    if (new URL(response.url()).origin === new URL(base).origin && response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
}

const token = (target, name) => target.evaluate(property => getComputedStyle(document.documentElement).getPropertyValue(property).trim(), name);

// A context owns its preview frames too. Finish their stylesheets before font readiness,
// otherwise teardown cancels our own font selections and the strict collector sees ERR_ABORTED.
async function settleFonts(context) {
  await Promise.all(context.pages().flatMap(page => page.frames().map(frame => frame.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link => {
      if (link.sheet) return;
      return new Promise((resolve, reject) => {
        const done = error => {
          clearTimeout(timer);
          link.removeEventListener("load", loaded);
          link.removeEventListener("error", failed);
          error ? reject(error) : resolve();
        };
        const loaded = () => done();
        const failed = () => done(new Error(`Stylesheet failed: ${link.href}`));
        const timer = setTimeout(() => done(new Error(`Stylesheet did not settle: ${link.href}`)), 15000);
        link.addEventListener("load", loaded, { once: true });
        link.addEventListener("error", failed, { once: true });
      });
    }));
    await document.fonts.ready;
  }))));
}

// A separate context prevents SW-cached navigations from bypassing the interception.
// All existing class/mode journeys keep service workers enabled and their original checks.
async function verifyEmptyPreviewDocuments(storageState, hash) {
  const probe = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState });
  // Model an environment without SW support, rather than rejecting Workbox registration.
  await probe.addInitScript(() => { delete Navigator.prototype.serviceWorker; });
  const page = await probe.newPage();
  monitor(page);
  const held = [];
  let captured;
  const allCaptured = new Promise(resolve => { captured = resolve; });
  const hold = route => { held.push(route); if (held.length === 5) captured(); };
  try {
    await page.goto(base + "/configure" + hash);
    await page.locator(".workspace").waitFor();
    assert.equal(await page.locator("link[data-xp-webfont]").count(), 3, "the probe has all three selected webfonts");
    await probe.route("**/*xp-preview=1*", hold);
    await page.getByRole("button", { name: "Show device previews", exact: true }).click();
    let timer;
    try { await Promise.race([allCaptured, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Preview navigations were not captured")), 10000); })]); }
    finally { clearTimeout(timer); }
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const documents = await page.locator('.cfg-preview iframe').evaluateAll(frames => frames.map(frame => ({ url: frame.contentDocument?.URL, fonts: frame.contentDocument?.querySelectorAll('link[data-xp-webfont]').length ?? 0 })));
    assert.equal(held.length, 5, "all five initial preview navigations are held");
    assert(documents.every(doc => doc.url === "about:blank"), JSON.stringify(documents));
    assert.equal(documents.reduce((count, doc) => count + doc.fonts, 0), 0,
      "initial empty preview documents must not start webfont requests");
    console.log("PASS: five held initial preview documents contain no webfont links");
  } finally {
    await Promise.all(held.map(route => route.continue()));
    await probe.unroute("**/*xp-preview=1*", hold);
    if (held.length) await page.waitForFunction(() => [...document.querySelectorAll(".cfg-preview__viewport")].every(element => element.dataset.ready === "true"));
    await settleFonts(probe);
    await probe.close();
  }
}

/** The sheet's spring approaches its snap asymptotically, so wait for the box to stop moving. */
async function settleSheet(page) {
  await page.evaluate(() => { delete window.__sheetBox; });
  await page.waitForFunction(() => {
    const surface = document.querySelector(".workspace-sheet[open] [data-sheet-surface]");
    if (!surface) return false;
    const box = surface.getBoundingClientRect();
    const landed = Math.abs(box.right - window.innerWidth) <= 1 && Math.abs(box.bottom - window.innerHeight) <= 1;
    const previous = window.__sheetBox;
    window.__sheetBox = `${box.top}:${box.left}`;
    return landed && previous === window.__sheetBox;
  });
}

async function panelOf(page, deviceClass) {
  if (!docked.includes(deviceClass) || (deviceClass === "DS" && page.viewportSize().width < 1400)) {
    await page.getByRole("button", { name: "Customise", exact: true }).click();
    await page.locator(".workspace-sheet .xp-configurator").waitFor();
    await settleSheet(page);
    return page.locator(".workspace-sheet .xp-configurator");
  }
  await page.locator(".route-inspector .xp-configurator").waitFor();
  return page.locator(".route-inspector .xp-configurator");
}

/** Compact classes hold one group at a time; a docked pane already shows all four. */
async function openGroup(panel, deviceClass, label) {
  if (docked.includes(deviceClass) || deviceClass === "TL") return;
  await panel.getByRole("tab", { name: label, exact: true }).click();
  await panel.getByRole("tabpanel").waitFor();
}

async function firstPreview(page) {
  const handle = await page.locator('iframe[title="M preview"]').elementHandle();
  const frame = await handle.contentFrame();
  await frame.locator(".workspace").waitFor();
  return frame;
}

async function assertTapTargets(page, where) {
  const undersized = await page.locator('button, [role="button"], [role="tab"], [role="radio"], a, input, select, textarea, summary').evaluateAll(elements => elements
    .filter(element => element.checkVisibility() && !element.matches(".xp-shell-skip, .cfg-visually-hidden"))
    .map(element => ({ name: element.getAttribute("aria-label") || element.textContent.trim().slice(0, 32) || element.tagName, ...element.getBoundingClientRect().toJSON() }))
    // The 0.01 slack is float noise from reading a rect through a transform matrix, not a
    // looser floor: a control that is actually under 44px still fails.
    .filter(({ width, height }) => width < 43.99 || height < 43.99)
    .map(({ name, width, height }) => ({ name, width: Math.round(width), height: Math.round(height) })));
  assert.deepEqual(undersized, [], where + ": coarse-pointer controls must measure at least 44 x 44px");
}

async function assertContrast(page, where) {
  const failures = await page.locator(".xp-configurator").evaluate(root => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const rgba = value => { context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1); return Array.from(context.getImageData(0, 0, 1, 1, { pixelFormat: "rgba-float16" }).data); };
    const over = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      return [...front.slice(0, 3).map((value, index) => alpha ? (value * front[3] + back[index] * back[3] * (1 - front[3])) / alpha : 0), alpha];
    };
    const luminance = color => color.slice(0, 3).reduce((sum, value, index) => sum + (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index], 0);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const results = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim()) continue;
      const element = node.parentElement;
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNode(node);
      if (style.visibility !== "visible" || !range.getBoundingClientRect().width || !element.checkVisibility()) continue;
      let background = [0, 0, 0, 0];
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const ancestorStyle = getComputedStyle(ancestor);
        if (ancestorStyle.backgroundImage !== "none" || ancestorStyle.filter !== "none" || ancestorStyle.mixBlendMode !== "normal") throw new Error("Unsupported text background at " + ancestor.className);
        background = over(background, rgba(ancestorStyle.backgroundColor));
      }
      if (background[3] !== 1) throw new Error("No opaque effective background for: " + node.textContent.trim());
      const foreground = over(rgba(style.color), background);
      const a = luminance(foreground), b = luminance(background);
      const size = Number.parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number.parseFloat(style.fontWeight) >= 700);
      results.push({ text: node.textContent.trim().slice(0, 40), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), minimum: large ? 3 : 4.5 });
    }
    return results;
  });
  const bad = failures.filter(({ ratio, minimum }) => ratio < minimum);
  assert.deepEqual(bad.map(({ text, ratio }) => `${text}: ${ratio.toFixed(2)}`), [], where + ": panel text contrast");
  return failures.length;
}

try {
  for (const [deviceClass, [width, height]] of Object.entries(sizes)) {
    for (const mode of ["light", "dark"]) {
      phase = `${deviceClass}/${mode}`;
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: coarse.includes(deviceClass), acceptDownloads: true });
      const page = await context.newPage();
      monitor(page);
      await page.goto(base + "/configure");
      await page.locator(".workspace").waitFor();
      // Since #58 the header names the module in whatever element the class's anatomy gives it: TP
      // makes the title its module chooser, every other class a plain heading. The route's name is
      // the assertion, not the tag it happens to use.
      assert.match(await page.locator(".workspace-heading").innerText(), /^Customise$/m, `${deviceClass}: the header does not name the route`);
      // The docked classes get section navigation naming the panel's groups; the rest reach the
      // panel through a sheet, where those anchors would not resolve.
      if (docked.includes(deviceClass)) {
        await page.locator(".section-navigation").first().waitFor();
        assert.deepEqual(await page.locator(".section-navigation").first().locator("a").allInnerTexts(), ["Colour", "Type", "Layout", "Export"]);
      } else {
        assert.equal(await page.locator(".section-navigation").count(), 0, "a sheet-only panel has no live anchors");
      }

      let panel = await panelOf(page, deviceClass);
      // A first visit, before anything is touched: the state a reviewer should see by default.
      if (mode === "light") {
        await page.waitForFunction(() => Array.from(document.querySelectorAll(".cfg-preview__viewport")).every(element => element.dataset.ready === "true"));
        await shot(page, `configure-default-${deviceClass}`);
      }
      // 1. Mode. The panel's own control, not the header popover.
      await openGroup(panel, deviceClass, "Colour");
      await panel.getByRole("radio", { name: mode === "light" ? "Light" : "Dark", exact: true }).click();
      await page.locator(`html[data-theme="${mode}"]`).waitFor();

      // 2. Tabs exist on the compact classes and switch groups.
      if (["M", "TP"].includes(deviceClass)) {
        assert.equal(await panel.getByRole("tab").count(), 4, "the compact sheet is tabbed");
        await panel.getByRole("tab", { name: "Layout", exact: true }).click();
        await panel.getByRole("heading", { name: "Layout", exact: true }).waitFor();
        await panel.getByRole("tab", { name: "Colour", exact: true }).click();
      }

      // 3. Preset. Every token family moves together.
      const before = await token(page, "--xp-primary-600");
      await panel.getByRole("radio", { name: "Aurora", exact: true }).click();
      await page.waitForFunction(previous => getComputedStyle(document.documentElement).getPropertyValue("--xp-primary-600").trim() !== previous, before);
      assert.match(await panel.locator(".cfg-basis").innerText(), /Aurora preset, unmodified\./);

      // 4. Seed sliders. The primary ramp follows the hue, the guard keeps reporting.
      const primary = panel.locator(".cfg-family").filter({ hasText: "Primary" });
      const afterPreset = await token(page, "--xp-primary-600");
      await primary.locator('input[type="range"]').first().fill("28");
      await page.waitForFunction(previous => getComputedStyle(document.documentElement).getPropertyValue("--xp-primary-600").trim() !== previous, afterPreset);
      assert.equal(await primary.locator("output").first().innerText(), "28°");
      await primary.locator('input[type="range"]').nth(1).fill("0.15");
      assert.equal(await primary.locator("output").nth(1).innerText(), "0.150");
      assert.equal(await panel.locator(".cfg-guard").first().getAttribute("data-state"), "pass");
      // The badge is a live measurement, not a verdict sticker: it must move with the seed.
      // The badge carries its own screen-reader sentence, so read only the visible number.
      const badge = panel.locator('.cfg-guard [aria-hidden="true"]').first();
      const badgeBefore = (await badge.innerText()).trim();
      assert.match(badgeBefore, /^\d+\.\d\d:1$/, badgeBefore);
      await primary.locator('input[type="range"]').nth(1).fill("0.02");
      await page.waitForFunction(previous => document.querySelector('.cfg-guard [aria-hidden="true"]').textContent.trim() !== previous, badgeBefore);
      await primary.locator('input[type="range"]').nth(1).fill("0.15");
      assert.match(await panel.locator(".cfg-basis").innerText(), /Based on Aurora, edited\./);
      const neutral = panel.locator(".cfg-family").filter({ hasText: "Neutral" });
      const beforeTint = await token(page, "--xp-surface");
      await neutral.locator('input[type="range"]').nth(1).fill("0.02");
      await page.waitForFunction(previous => getComputedStyle(document.documentElement).getPropertyValue("--xp-surface").trim() !== previous, beforeTint);

      // 5. Type. A named family fetches exactly one stylesheet, on demand.
      await openGroup(panel, deviceClass, "Type");
      assert.equal(await page.locator("link[data-xp-webfont]").count(), 0);
      await panel.getByLabel("Interface", { exact: true }).selectOption("manrope");
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-font-sans").includes("Manrope"));
      assert.equal(await page.locator("link[data-xp-webfont]").count(), 1);

      // 5b. Blocker: a preset change must not silently reset the three font selections.
      await openGroup(panel, deviceClass, "Type");
      await panel.getByLabel("Long-form", { exact: true }).selectOption("literata");
      await panel.getByLabel("Code", { exact: true }).selectOption("jetbrains");
      await openGroup(panel, deviceClass, "Colour");
      await panel.getByRole("radio", { name: "Midnight", exact: true }).click();
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-primary-600").includes("275"));
      await openGroup(panel, deviceClass, "Type");
      assert.deepEqual(await Promise.all(["Interface", "Long-form", "Code"].map(label => panel.getByLabel(label, { exact: true }).inputValue())),
        ["manrope", "literata", "jetbrains"], "choosing a preset must carry the font selections over");
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-font-sans").includes("Manrope"));
      assert.equal(await page.locator("link[data-xp-webfont]").count(), 3);

      // 6. Metrics and layout.
      await openGroup(panel, deviceClass, "Layout");
      await panel.getByLabel("Corner radius", { exact: true }).fill("0");
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() === "0");
      await panel.getByLabel("Density", { exact: true }).fill("1.4");
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-density-factor").trim() === "1.4");
      await panel.getByLabel("Spacing", { exact: true }).fill("1.25");
      await panel.getByLabel("Elevation", { exact: true }).fill("0");
      await panel.getByRole("radio", { name: "Reading", exact: true }).click();
      await page.locator('html[data-xp-content="reading"]').waitFor();
      await panel.getByRole("radio", { name: "With labels", exact: true }).click();
      await page.locator('html[data-xp-rail="labels"]').waitFor();
      if (["TL", "DW"].includes(deviceClass)) {
        assert.ok(await page.locator(".workspace-rail").evaluate(element => element.getBoundingClientRect().width > 120), "labelled rail widens");
      }
      await panel.getByRole("radio", { name: "Reduced", exact: true }).click();
      await page.locator('html[data-xp-motion="reduced"]').waitFor();
      if (docked.includes(deviceClass)) {
        const full = await page.locator(".workspace-sidebar").evaluate(element => element.getBoundingClientRect().width);
        await panel.getByRole("radio", { name: "Icons", exact: true }).click();
        await page.waitForFunction(previous => (document.querySelector(".workspace-sidebar")?.getBoundingClientRect().width ?? 0) < previous, full);
        await panel.getByRole("radio", { name: "Hidden", exact: true }).click();
        await page.waitForSelector(".workspace-sidebar", { state: "hidden" });
        await panel.getByRole("radio", { name: "Panel", exact: true }).click();
        await page.locator(".workspace-sidebar").waitFor();
      }

      // 7. The preview frames follow the host, and stay out of the keyboard path.
      if (docked.includes(deviceClass) || deviceClass === "TL") {
        if (deviceClass === "TL") {
          // The drawer is a modal dialog; close it before reading the page behind it.
          await page.keyboard.press("Escape");
          await page.locator('.workspace-sheet[aria-label="Customise"]').waitFor({ state: "hidden" });
        }
        const frame = await firstPreview(page);
        await page.waitForFunction(async () => true);
        for (const property of ["--xp-primary-600", "--xp-radius-scale", "--xp-font-sans", "--xp-surface"]) {
          await page.waitForFunction(async name => {
            const preview = document.querySelector('iframe[title="M preview"]').contentDocument;
            return getComputedStyle(preview.documentElement).getPropertyValue(name).trim()
              === getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          }, property);
        }
        assert.equal(await frame.locator(".workspace").getAttribute("data-device-class"), "M", "the frame honours the class override");
        // Every frame, not just the first: mode used to reach them only by storage event.
        assert.deepEqual(await page.evaluate(() => Array.from(document.querySelectorAll(".cfg-preview iframe"))
          .filter(element => element.contentDocument?.documentElement.dataset.theme !== document.documentElement.dataset.theme)
          .map(element => element.title)), [], "every preview must be in the host's mode");
        assert.equal(await page.locator('iframe[title="M preview"]').evaluate(element => element.contentDocument.body.inert), true, "a preview must be inert");
        assert.equal(await page.locator(".cfg-preview").count(), 5);
        panel = await panelOf(page, deviceClass);
      }

      // 8. Undo and redo, by button and by keyboard, against a known last edit.
      await openGroup(panel, deviceClass, "Layout");
      await panel.getByRole("radio", { name: "None", exact: true }).click();
      await page.locator('html[data-xp-motion="off"]').waitFor();
      // In a sheet the history pair sits in the sheet header, beside the heading, not in the panel.
      const history = docked.includes(deviceClass) ? panel : page.locator('.workspace-sheet[aria-label="Customise"] .sheet-header');
      await history.getByRole("button", { name: "Undo", exact: true }).click();
      await page.locator('html[data-xp-motion="reduced"]').waitFor();
      await history.getByRole("button", { name: "Redo", exact: true }).click();
      await page.locator('html[data-xp-motion="off"]').waitFor();
      await page.keyboard.press("Control+z");
      await page.locator('html[data-xp-motion="reduced"]').waitFor();
      await page.keyboard.press("Control+Shift+z");
      await page.locator('html[data-xp-motion="off"]').waitFor();

      // 9. The link is the state: a reload restores everything.
      // The link write is debounced, so wait for it to catch up with the last edit.
      await page.waitForFunction(() => new URLSearchParams(location.hash.slice(1)).has("c"));
      await page.waitForFunction(() => {
        const payload = new URLSearchParams(location.hash.slice(1)).get("c");
        const padded = payload.replaceAll("-", "+").replaceAll("_", "/");
        const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded + "=".repeat((4 - (padded.length % 4)) % 4)), character => character.charCodeAt(0))));
        return json.layout.motion === "off" && json.layout.rail === "labels" && json.radiusScale === 0;
      });
      const hash = new URL(page.url()).hash;
      phase = `${deviceClass}/${mode}/reload`;
      assert.match(hash, /^#c=[\w-]+$/);
      await settleFonts(context);
      await page.reload();
      await page.locator('html[data-xp-motion="off"][data-xp-rail="labels"]').waitFor();
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() === "0");
      assert.equal(new URL(page.url()).hash, hash);
      panel = await panelOf(page, deviceClass);

      if (["M", "TP"].includes(deviceClass)) {
        phase = `${deviceClass}/${mode}/show-previews`;
        await page.keyboard.press("Escape");
        await page.locator('.workspace-sheet[aria-label="Customise"]').waitFor({ state: "hidden" });
        if (deviceClass === "M" && mode === "light") await verifyEmptyPreviewDocuments(await context.storageState(), hash);
        await page.getByRole("button", { name: "Show device previews", exact: true }).click();
        const frame = await firstPreview(page);
        await page.waitForFunction(() => {
          const preview = document.querySelector('iframe[title="M preview"]').contentDocument;
          return getComputedStyle(preview.documentElement).getPropertyValue("--xp-radius-scale").trim()
            === getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim();
        });
        assert.equal(await frame.locator(".workspace").getAttribute("data-device-class"), "M");
        assert.equal(await page.locator(".cfg-preview").count(), 5);
        // Hiding previews destroys their documents just like closing a context does.
        await page.waitForFunction(() => [...document.querySelectorAll(".cfg-preview__viewport")].every(element => element.dataset.ready === "true"));
        await settleFonts(context);
        phase = `${deviceClass}/${mode}/hide-previews`;
        await page.getByRole("button", { name: "Hide device previews", exact: true }).click();
        panel = await panelOf(page, deviceClass);
      }
      if (coarse.includes(deviceClass)) await assertTapTargets(page, `${deviceClass}/${mode}`);
      const runs = await assertContrast(page, `${deviceClass}/${mode}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${deviceClass}/${mode} overflows the document`);
      await shot(page, `configure-${deviceClass}-${mode}`);
      console.log(`configure-${deviceClass}-${mode}: live tokens, previews, undo/redo, hash reload, ${runs} text runs PASS`);
      phase = `${deviceClass}/${mode}/close`;
      await settleFonts(context);
      await context.close();
    }
  }

  // Blocker: a preview of /configure must render the live state, not only receive the CSS.
  {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    monitor(page);
    await page.goto(base + "/configure");
    const panel = await panelOf(page, "DW");
    // The wrapping label's accessible name absorbs the select's own text, so target the control.
    await page.locator(".cfg-strip__route select").selectOption("/configure");
    await page.waitForFunction(() => Array.from(document.querySelectorAll(".cfg-preview__viewport")).every(element => element.dataset.ready === "true"));
    const frame = await page.locator('iframe[title="DS preview"]').elementHandle().then(handle => handle.contentFrame());
    // Preview frames deliberately cannot receive pointer input; expose the panel for state inspection.
    await frame.getByRole("button", { name: "Customise", exact: true }).evaluate(button => button.click());
    await frame.locator(".workspace-sheet[open] .xp-configurator").waitFor();

    const readFrame = () => frame.evaluate(() => {
      const radius = [...document.querySelectorAll(".cfg-row")].find(row => row.textContent.startsWith("Corner radius"));
      const neutral = [...document.querySelectorAll(".cfg-family")].find(family => family.textContent.startsWith("Neutral"));
      return {
        radiusOutput: radius.querySelector("output").textContent,
        radiusSlider: radius.querySelector('input[type="range"]').value,
        hueOutput: neutral.querySelector("output").textContent,
        swatch: getComputedStyle(neutral.querySelector(".cfg-ramp__tone")).backgroundColor,
        guard: document.querySelector('.cfg-guard [aria-hidden="true"]').textContent.trim(),
        radiusToken: getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim(),
      };
    });
    const before = await readFrame();
    await panel.getByLabel("Corner radius", { exact: true }).fill("1.8");
    await panel.locator(".cfg-family").filter({ hasText: "Neutral" }).locator('input[type="range"]').first().fill("165");
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() === "1.8");
    const staged = await readFrame();
    assert.equal(staged.radiusOutput, "1.80×", "the framed panel's readout must follow the host");
    assert.equal(staged.radiusSlider, "1.8", "and so must its slider position");
    assert.equal(staged.hueOutput, "165°");
    assert.notEqual(staged.swatch, before.swatch, "and its inline swatches must be recomputed");

    await panel.getByLabel("Corner radius", { exact: true }).fill("0.25");
    await panel.locator(".cfg-family").filter({ hasText: "Neutral" }).locator('input[type="range"]').first().fill("80");
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() === "0.25");
    await page.waitForFunction(() => {
      const preview = document.querySelector('iframe[title="DS preview"]').contentDocument;
      const row = [...preview.querySelectorAll(".cfg-row")].find(entry => entry.textContent.startsWith("Corner radius"));
      return row?.querySelector("output")?.textContent === "0.25×";
    });
    const after = await readFrame();
    assert.equal(after.radiusSlider, "0.25", "the reviewer's exact reproduction: 1.8 to 0.25");
    assert.equal(after.hueOutput, "80°", "and neutral hue 165 to 80");
    assert.equal(after.radiusToken, "0.25", "CSS and specimen agree");
    assert.notEqual(after.swatch, staged.swatch);
    assert.notEqual(after.guard, "", "the framed guard reports its own measurement");
    // A preview stays read-only: its controls are inert, so its own state cannot diverge.
    assert.equal(await frame.locator("body").evaluate(body => body.inert), true);
    await shot(page, "configure-preview-follows-state");
    await settleFonts(context);
    await context.close();
  }

  // Blocker: the exported module must apply everything it exports, mode included. Built with
  // @xp/theme resolved and then executed in a fresh light-mode context, which is the only place
  // a claim about `data-theme` can be tested.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 768 }, colorScheme: "light", permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    monitor(page);
    await page.goto(base + "/configure");
    const panel = await panelOf(page, "DS");
    await openGroup(panel, "DS", "Type");
    await panel.getByLabel("Interface", { exact: true }).selectOption("manrope");
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-font-sans").includes("Manrope"));
    await openGroup(panel, "DS", "Colour");
    await panel.getByRole("radio", { name: "Dark", exact: true }).click();
    await page.locator('html[data-theme="dark"]').waitFor();
    await openGroup(panel, "DS", "Layout");
    await panel.getByLabel("Corner radius", { exact: true }).fill("1.8");
    await panel.getByRole("radio", { name: "Reading", exact: true }).click();
    await page.locator('html[data-xp-content="reading"]').waitFor();
    await openGroup(panel, "DS", "Export");
    await panel.getByRole("button", { name: "Copy config" }).click();
    const module_ = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(module_, /export const colorMode = "dark";/);
    assert.match(module_, /setThemePreference\(colorMode\);/);

    // The stored configuration follows this profile into any route, so prove that too: reloading
    // Settings must keep the fonts, the metrics and the layout.
    await settleFonts(context);
    await page.goto(base + preferenceRoute);
    await settleFonts(context);
    await page.reload();
    await page.locator("main h1").waitFor();
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-font-sans").includes("Manrope"));
    assert.equal(await page.locator("link[data-xp-webfont]").count(), 1, "a restored configuration reloads its webfont");
    await shot(page, "configure-restored-on-settings");

    // Blocker: a stored configuration must not overwrite a newer explicit mode choice. The
    // reviewer's sequence: Dark in /configure, Light in Settings, reload Settings with no hash.
    const lightChoice = page.getByRole("radio", { name: "Light", exact: true });
    if (await lightChoice.isVisible()) await lightChoice.click();
    else await page.getByRole("button", { name: "Color mode", exact: true }).click();
    await page.locator('html[data-theme="light"]').waitFor();
    await settleFonts(context);
    await page.goto(base + preferenceRoute);
    assert.equal(new URL(page.url()).hash, "", "the reproduction needs a bare URL");
    await page.locator("main h1").waitFor();
    await page.locator('html[data-theme="light"]').waitFor();
    await settleFonts(context);
    await page.reload();
    await page.locator("main h1").waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light",
      "reloading Settings must keep the newer Light choice, not the configuration's stale Dark");
    assert.equal(await page.evaluate(() => localStorage.getItem("xp-theme-mode")), "light");
    // And the panel must show the choice that was made elsewhere.
    await settleFonts(context);
    await page.goto(base + "/configure");
    const back = await panelOf(page, "DS");
    await openGroup(back, "DS", "Colour");
    assert.equal(await back.getByRole("radio", { name: "Light", exact: true }).getAttribute("data-state"), "checked",
      "the panel reads the shared preference rather than its own stale copy");
    // A shared link is an explicit instruction and may still carry mode.
    const shared = module_.match(/export const colorMode = "(\w+)";/)[1];
    assert.equal(shared, "dark");
    await settleFonts(context);
    await context.close();

    // Now run the module itself. Vite resolves @xp/theme from the workspace and bundles it, so
    // this is the generated file's own behaviour, not a re-implementation of it.
    const { build } = await import("vite");
    const directory = mkdtempSync(resolve(tmpdir(), "xpresso-module-"));
    let bundled = "";
    try {
      writeFileSync(resolve(directory, "xpresso.config.ts"), module_);
      await build({
        logLevel: "silent",
        configFile: false,
        root: directory,
        resolve: { alias: { "@xp/theme": fileURLToPath(new URL("../../../packages/xp-theme/src/index.ts", import.meta.url)) } },
        build: { outDir: resolve(directory, "out"), minify: false, lib: { entry: resolve(directory, "xpresso.config.ts"), formats: ["es"], fileName: "xpresso.config" } },
      });
      bundled = readFileSync(resolve(directory, "out/xpresso.config.mjs"), "utf8");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
    assert.ok(bundled.includes("setThemePreference") || bundled.includes("xp-theme-mode"), "the bundle must carry the mode path");

    const fresh = await browser.newContext({ viewport: { width: 1440, height: 768 }, colorScheme: "light" });
    const page2 = await fresh.newPage();
    monitor(page2);
    await page2.route("**/xpresso.config.mjs", route => route.fulfill({ contentType: "text/javascript", body: bundled }));
    await page2.goto(base + "/?xp-frame=1");
    await page2.evaluate(() => navigator.serviceWorker.ready);
    await page2.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const before = await page2.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      faces: [...document.fonts].map(face => face.family),
      radius: getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim(),
      sidebar: document.documentElement.dataset.xpSidebar,
    }));
    assert.equal(before.theme, "light", "the fresh context starts light");
    assert.deepEqual(before.faces, ["Inter", "Inter"], "and with Graphite's two local subset faces");
    const after = await page2.evaluate(async () => {
      const module_ = await import("/xpresso.config.mjs");
      module_.applyConfiguration();
      await Promise.all([...document.querySelectorAll("link[data-xp-webfont]")]
        .map(link => link.sheet ? Promise.resolve() : new Promise(resolve => link.addEventListener("load", resolve, { once: true }))));
      await document.fonts.ready;
      await document.fonts.load('48px "Manrope"');
      return {
        theme: document.documentElement.dataset.theme,
        preference: localStorage.getItem("xp-theme-mode"),
        manrope: [...document.fonts].filter(face => face.family === "Manrope").map(face => face.status),
        fontSans: getComputedStyle(document.documentElement).getPropertyValue("--xp-font-sans").trim(),
        radius: getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim(),
        content: document.documentElement.dataset.xpContent,
        contentMax: document.documentElement.style.getPropertyValue("--xp-content-max"),
      };
    });
    assert.equal(after.theme, "dark", "applyConfiguration must apply the exported colour mode");
    assert.equal(after.preference, "dark", "and persist it through the theme runtime");
    assert.ok(after.manrope.includes("loaded"), `Manrope must load, got ${JSON.stringify(after.manrope)}`);
    assert.match(after.fontSans, /Manrope/);
    assert.equal(after.radius, "1.8", "and apply the metrics");
    assert.equal(after.content, "reading", "and the layout attributes");
    assert.equal(after.contentMax, "var(--measure-body)");
    await shot(page2, "configure-exported-module-applied");
    await settleFonts(fresh);
    await fresh.close();
  }

  // Export, import and keyboard-only operation, once, on the docked pane.
  const context = await browser.newContext({ viewport: { width: 1440, height: 768 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  monitor(page);
  await page.goto(base + "/configure");
  const panel = await panelOf(page, "DS");
  await panel.getByRole("radio", { name: "Midnight", exact: true }).click();

  const css = await Promise.all([page.waitForEvent("download"), panel.getByRole("button", { name: "CSS variables" }).click()]).then(([download]) => download);
  assert.equal(css.suggestedFilename(), "xpresso-theme.css");
  const json = await Promise.all([page.waitForEvent("download"), panel.getByRole("button", { name: "JSON preset" }).click()]).then(([download]) => download);
  assert.equal(json.suggestedFilename(), "xpresso-preset.json");
  assert.match(await panel.locator(".cfg-status").innerText(), /JSON preset downloaded\./);

  await panel.getByRole("button", { name: "Copy config" }).click();
  const snippet = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(snippet, /^\/\/ xpresso\.config\.ts/);
  assert.match(snippet, /export const theme: ThemeSpec/);
  await panel.getByRole("button", { name: "Copy link" }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /#c=[\w-]+$/);

  await panel.getByRole("group").filter({ hasText: "Paste a preset" }).locator("summary").click();
  await panel.locator("textarea").fill('{"preset":"paper","radiusScale":1.85,"layout":{"content":"full"}}');
  await panel.getByRole("button", { name: "Apply preset" }).click();
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() === "1.85");
  await page.locator('html[data-xp-content="full"]').waitFor();
  assert.match(await panel.locator(".cfg-status").innerText(), /Preset imported\./);
  await panel.locator("textarea").fill("{ not json");
  await panel.getByRole("button", { name: "Apply preset" }).click();
  await panel.locator(".cfg-problem").waitFor();
  assert.match(await panel.locator(".cfg-problem").innerText(), /not valid JSON/);
  await shot(page, "configure-import-error");

  // Keyboard only: reach the preset picker and move the selection with the arrow keys.
  // The hold matters: a radio group selects on focus, and an instantaneous synthetic press
  // releases the key before the group has moved focus, which no real keyboard does.
  await page.getByRole("radio", { name: "Paper", exact: true }).focus();
  const paper = await token(page, "--xp-primary-600");
  await page.keyboard.press("ArrowRight", { delay: 60 });
  await page.waitForFunction(previous => getComputedStyle(document.documentElement).getPropertyValue("--xp-primary-600").trim() !== previous, paper);
  const focused = await page.evaluate(() => document.activeElement.textContent.trim());
  assert.equal(focused, "Aurora", "the roving radio group moves with the arrow keys");
  await page.getByLabel("Corner radius", { exact: true }).focus();
  await page.keyboard.press("ArrowLeft", { delay: 60 });
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--xp-radius-scale").trim() !== "1.85");
  assert.equal(await page.evaluate(() => document.activeElement.type), "range");
  // Tab must reach the panel's controls from the page, and must not enter a preview frame.
  await page.locator(".cfg-strip__head h2").click();
  const reached = [];
  for (let step = 0; step < 14; step++) {
    await page.keyboard.press("Tab");
    reached.push(await page.evaluate(() => ({
      inPanel: Boolean(document.activeElement?.closest(".xp-configurator")),
      inFrame: document.activeElement?.tagName === "IFRAME",
    })));
  }
  assert.equal(reached.some(entry => entry.inPanel), true, "Tab must reach the panel");
  assert.equal(reached.some(entry => entry.inFrame), false, "Tab must not stop on a preview frame");
  await shot(page, "configure-keyboard");
  await settleFonts(context);
  await context.close();

  // Motion: the intensity switch and the OS preference must both reach @xp/motion's press.
  async function pressScale(page, panel) {
    // Undo is only enabled once something has been edited, and press() ignores disabled controls.
    const target = panel.getByRole("button", { name: "Undo", exact: true }).first();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(220);
    const matrix = await target.evaluate(element => getComputedStyle(element).transform);
    await page.mouse.up();
    await page.waitForTimeout(160);
    return matrix === "none" ? 1 : Number(matrix.match(/matrix\(([^,]+)/)[1]);
  }
  const scales = {};
  for (const [name, options] of [["fluid", {}], ["reduced-os", { reducedMotion: "reduce" }]]) {
    const motionContext = await browser.newContext({ viewport: { width: 1440, height: 768 }, ...options });
    const motionPage = await motionContext.newPage();
    monitor(motionPage);
    await motionPage.goto(base + "/configure");
    const motionPanel = await panelOf(motionPage, "DS");
    await motionPanel.getByRole("radio", { name: "Aurora", exact: true }).click();
    await motionPanel.getByRole("button", { name: "Undo", exact: true }).first().and(motionPage.locator(":enabled")).waitFor();
    scales[name] = await pressScale(motionPage, motionPanel);
    if (name === "fluid") {
      await motionPanel.getByRole("radio", { name: "None", exact: true }).click();
      await motionPage.locator('html[data-xp-motion="off"]').waitFor();
      scales.off = await pressScale(motionPage, motionPanel);
      await shot(motionPage, "configure-motion-off");
    }
    await settleFonts(motionContext);
    await motionContext.close();
  }
  assert.ok(scales.fluid < 0.99, `fluid press must give feedback, got ${scales.fluid}`);
  assert.equal(scales.off, 1, "motion off must bypass the press tween");
  assert.ok(scales["reduced-os"] > scales.fluid && scales["reduced-os"] < 1,
    `reduced motion keeps gentler feedback, got ${scales["reduced-os"]} against ${scales.fluid}`);
  console.log(`press scale: fluid ${scales.fluid.toFixed(4)}, reduced ${scales["reduced-os"].toFixed(4)}, off ${scales.off}`);

  assert.deepEqual(errors, [], "page, console and HTTP errors");
  console.log(`PASS: /configure verified in 5 classes x 2 modes; ${shots} screenshots; a framed panel following live host state, the generated module executed in a fresh context applying its mode, fonts, metrics and layout, fonts surviving a preset change, a stored configuration restored on another route without overwriting a newer mode choice, export, import, clipboard and keyboard operation; 0 page/console/HTTP errors.`);
} catch (error) {
  if (errors.length) console.error("Captured page/console/HTTP errors:", JSON.stringify(errors, null, 2));
  throw error;
} finally {
  if (errors.length) console.error("Browser errors:", [...new Set(errors)]);
  await browser.close();
}
