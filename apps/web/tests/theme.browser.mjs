// Explicit browser evidence command, separate from the unit suite.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { chromium } from "playwright-core";
import { screens, waitForOverlayRest } from "../../../scripts/qa/common.mjs";
import { verifySkinContracts } from "./skin-contracts.browser-support.mjs";

const baseURL = process.env.XP_THEME_URL ?? process.env.XP_BASE_URL ?? "http://127.0.0.1:4173";
const profileRoute = screens.find(screen => screen.path === "/settings/profile");
const componentStyles = ["xp-primitives", "xp-shells"].flatMap(packageName => {
  const directory = new URL(`../../../packages/${packageName}/styles/`, import.meta.url);
  return readdirSync(directory).filter(name => name.endsWith(".css") && name !== "index.css")
    .map(name => ({ name: `${packageName}/${name}`, css: readFileSync(new URL(name, directory), "utf8") }));
});
const browser = await chromium.launch({
  channel: process.env.XP_BROWSER_CHANNEL ?? "chrome",
  executablePath: process.env.CHROME_EXECUTABLE_PATH ? realpathSync(process.env.CHROME_EXECUTABLE_PATH) : undefined,
});
const evidence = new URL("../evidence/", import.meta.url);
await mkdir(evidence, { recursive: true });
try {
  let screenshots = 0;
  for (const [width, height] of [[1440, 900], [834, 1112], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: "light" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseURL);
    for (const mode of ["dark", "light"]) {
      const toggle = page.getByRole("button", { name: "Color mode", exact: true });
      await toggle.click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), mode);
      assert.equal(await toggle.getAttribute("aria-pressed"), String(mode === "dark"));
      assert.equal(await toggle.getAttribute("title"), mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
      assert.equal(await page.evaluate(() => localStorage.getItem("xp-theme-mode")), mode);
      await page.reload();
      assert.equal(await page.locator("html").getAttribute("data-theme"), mode);
      assert.equal(await toggle.getAttribute("aria-pressed"), String(mode === "dark"));
      const computed = await page.evaluate(() => {
        const probe = document.createElement("span");
        document.body.append(probe);
        const resolveColor = token => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        const expectedSurface = resolveColor("--xp-surface-raised");
        const surfaces = [...document.querySelectorAll(".workspace-header, .workspace-tabs")].map(element => getComputedStyle(element).backgroundColor);
        probe.remove();
        return { surfaces, expectedSurface, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(computed.overflow, false, `${width}/${mode} overflow`);
      assert(computed.surfaces.length >= 1);
      assert(computed.surfaces.every(color => color === computed.expectedSurface), `${width}/${mode} chrome token mismatch`);
      if (width === 834) {
        assert.deepEqual(await page.locator(".workspace-module-switch").evaluate(element => {
          const style = getComputedStyle(element);
          return [style.fontSize, style.fontWeight, style.minBlockSize];
        }), ["15px", "600", "44px"], "TP title keeps the heading contract");
      }
      await page.screenshot({ path: new URL(`${width}-${mode}.png`, evidence).pathname, fullPage: true });
      screenshots++;
      // Each class reaches its module layer from the control it has: the phone's fifth tab, the
      // portrait tablet's own title, and the anchored More of the wide classes (#101).
      const title = page.getByRole("button", { name: "Choose module", exact: true });
      await (await title.count() ? title : page.getByRole("button", { name: "More", exact: true })).click();
      const overlay = page.locator(".workspace-sheet[open] .sheet-surface, .more-popover:popover-open");
      await overlay.waitFor();
      await waitForOverlayRest(page, ".workspace-sheet[open] .sheet-surface, .more-popover:popover-open");
      // Wait for the sheet and scrim to finish entering before measuring/capturing.
      await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished)));
      // Audit even overridden declarations and interaction states on mounted components.
      const literals = await page.evaluate(sources => {
        const failures = [];
        for (const { name, css } of sources) {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(css);
          const visit = rules => {
            for (const rule of rules) {
              if (rule instanceof CSSStyleRule) {
                const selector = rule.selectorText.replace(/::[\w-]+(?:\([^)]*\))?/g, "")
                  .replace(/:(?:hover|active|focus-visible|focus-within|focus)\b/g, "");
                const mounted = document.querySelector(selector);
                if (mounted) {
                  for (const property of rule.style) {
                    const value = rule.style.getPropertyValue(property);
                    if (/#(?:[\da-f]{3,8})\b|\b(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch|color)\(|\b(?:white|black)\b/i.test(value)) {
                      // A literal that the theme layer overrides never paints. The primitives package
                      // ships its own defaults under `var(--token, literal)`, and a mounted field takes
                      // the theme's ink and surface in both modes, which is measured here rather than
                      // assumed: only a literal the element actually computes to is a failure (#101).
                      //
                      // Both sides are normalised through a probe before they are compared, because an
                      // author writes `#fff` or `white` and the engine computes `rgb(255, 255, 255)`:
                      // comparing the two as raw strings would let a literal that really is painted
                      // pass every time.
                      const normalise = literal => {
                        const probe = document.createElement("span");
                        probe.style.setProperty(property, literal);
                        document.body.append(probe);
                        const computed = getComputedStyle(probe).getPropertyValue(property).trim();
                        probe.remove();
                        return computed;
                      };
                      const painted = getComputedStyle(mounted).getPropertyValue(property).trim();
                      const authored = value.replace(/^var\([^,]+,\s*/, "").replace(/\)\s*$/, "").trim();
                      if (painted && (painted === normalise(authored) || painted === normalise(value.trim()))) {
                        failures.push(`${name}: ${rule.selectorText} { ${property}: ${value} } paints ${painted}`);
                      }
                    }
                  }
                }
              } else if (rule.cssRules) visit(rule.cssRules);
            }
          };
          visit(sheet.cssRules);
        }
        return failures;
      }, componentStyles);
      assert.deepEqual(literals, [], `${width}/${mode} mounted component literal colours`);
      const contrasts = await overlay.evaluate(root => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const rgba = color => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return Array.from(ctx.getImageData(0, 0, 1, 1, { pixelFormat: "rgba-float16" }).data);
        };
        const over = (front, back) => {
          const alpha = front[3] + back[3] * (1 - front[3]);
          return [...front.slice(0, 3).map((v, i) => alpha ? (v * front[3] + back[i] * back[3] * (1 - front[3])) / alpha : 0), alpha];
        };
        const luminance = color => color.slice(0, 3).reduce((sum, v, i) =>
          sum + (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i], 0);
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
            // Fail explicitly if this fixture starts using unsupported compositing.
            if (ancestorStyle.opacity !== "1" || ancestorStyle.backgroundImage !== "none" || ancestorStyle.filter !== "none" || ancestorStyle.mixBlendMode !== "normal") {
              throw new Error(`Unsupported text background at ${ancestor.className}`);
            }
            background = over(background, rgba(ancestorStyle.backgroundColor));
          }
          if (background[3] !== 1) throw new Error("No opaque effective background");
          const foreground = over(rgba(style.color), background);
          const a = luminance(foreground), b = luminance(background);
          results.push({ text: node.textContent.trim(), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) });
        }
        return results;
      });
      assert(contrasts.length > 0, "Overlay must contain visible text");
      console.log(`${width}/${mode} overlay: ${contrasts.map(({ text, ratio }) => `${JSON.stringify(text)} ${ratio.toFixed(3)}:1`).join("; ")}`);
      for (const { text, ratio } of contrasts) assert(ratio >= 4.5, `${width}/${mode}: ${text} contrast ${ratio} < 4.5`);
      await page.screenshot({ path: new URL(width === 390 ? `overlay-${mode}.png` : `overlay-${width}-${mode}.png`, evidence).pathname });
      screenshots++;
      await page.keyboard.press("Escape");
      await overlay.waitFor({ state: "hidden" });
    }
    if (profileRoute) {
      await page.goto(baseURL + profileRoute.path);
      const appearance = page.locator("details").filter({ has: page.getByText("Appearance and language", { exact: true }) });
      if (!(await appearance.getAttribute("open")) && !(await appearance.evaluate(element => element.open))) {
        await appearance.locator("summary").click();
      }
      await page.getByRole("radio", { name: "System", exact: true }).click();
    } else {
      // Bare has no profile screen; exercise the same stored system preference at startup.
      await page.evaluate(() => localStorage.setItem("xp-theme-mode", "system"));
      await page.reload();
    }
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    assert.equal(await page.getByRole("button", { name: "Color mode", exact: true }).getAttribute("aria-pressed"), "true");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    if (profileRoute) {
      await page.getByRole("radio", { name: "System", exact: true }).focus();
      // Radix defers roving focus; keep the key down until that focus event selects.
      await page.keyboard.down("ArrowLeft");
      await page.waitForFunction(() => document.querySelector('.xp-segmented__item[value="dark"]')?.getAttribute("data-state") === "checked");
      await page.keyboard.up("ArrowLeft");
      assert.equal(await page.getByRole("radio", { name: "Dark", exact: true }).getAttribute("data-state"), "checked");
    } else {
      await page.getByRole("button", { name: "Color mode", exact: true }).focus();
      await page.keyboard.press("Space");
      await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
      assert.equal(await page.getByRole("button", { name: "Color mode", exact: true }).getAttribute("aria-pressed"), "true");
    }
    for (const reduced of ["reduce", "no-preference"]) {
      await page.emulateMedia({ reducedMotion: reduced });
      await page.evaluate(() => document.documentElement.dataset.xpMotion = "off");
      const motion = await page.locator(".theme-sun").evaluate(element => {
        const style = getComputedStyle(element);
        return [style.transitionProperty, style.transitionDuration, style.transform];
      });
      assert.deepEqual(motion, ["opacity", "0.08s", "none"]);
      await page.evaluate(() => delete document.documentElement.dataset.xpMotion);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  // Exercise both subsets through real text, including Polish Latin Extended glyphs.
  await verifySkinContracts(browser, baseURL);
  const fontsContext = await browser.newContext();
  const fontPage = await fontsContext.newPage();
  const requests = [], fontResponses = [];
  fontPage.on("request", request => requests.push(request.url()));
  fontPage.on("response", response => { if (response.url().includes("/fonts/")) fontResponses.push([new URL(response.url()).pathname, response.status()]); });
  await fontPage.goto(baseURL);
  await fontPage.evaluate(async () => { await document.fonts.load('500 14px "Inter"', "Harbor Łódź Żółć"); await document.fonts.ready; });
  for (const subset of ["latin", "latin-ext"]) assert(fontResponses.some(([url, status]) => url === `/fonts/inter-${subset}-wght-normal.woff2` && status === 200), `${subset} font served 200`);
  assert(!requests.some(url => /fonts\.(gstatic|googleapis)\.com/.test(url)));
  console.log(`PASS: local Inter font network ${JSON.stringify(fontResponses)}; no Google font requests.`);
  await fontsContext.close();
  // Block the app bundle: the inline bootstrap and static CSS must suffice.
  const initial = await browser.newContext({ colorScheme: "light" });
  await initial.addInitScript(() => localStorage.setItem("xp-theme-mode", "dark"));
  const first = await initial.newPage();
  await first.route("**/assets/*.js", route => route.abort());
  await first.route("**/src/main.tsx", route => route.abort());
  await first.goto(baseURL);
  assert.equal(await first.locator("html").getAttribute("data-theme"), "dark");
  const background = await first.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.match(background, /oklch\(0\.15 /);
  await initial.close();
  console.log(`PASS: ${screenshots} screenshots; three viewports, both modes, persistence, system changes, keyboard and pre-module dark background.`);
} finally {
  await browser.close();
}
