import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, prepare, screens, sizes } from "../../../scripts/qa/common.mjs";
// Same float16 canvas conversion and compositing model as the shell evidence suite.
function measureContrast(root) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return Array.from(ctx.getImageData(0, 0, 1, 1, { pixelFormat: "rgba-float16" }).data); };
  const over = (front, back) => { const a = front[3] + back[3] * (1 - front[3]); return [...front.slice(0, 3).map((v, i) => a ? (v * front[3] + back[i] * back[3] * (1 - front[3])) / a : 0), a]; };
  const luminance = color => color.slice(0, 3).reduce((sum, v, i) => sum + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i], 0);
  const results = [];
  const measure = (element, text, color) => {
    // Inactive controls are exempt from AA text contrast. Keep enabled content's
    // strict compositing checks, including ancestors outside a disabled control.
    if (element.closest('button:disabled, input:disabled, select:disabled, textarea:disabled')) return;
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || element.closest('[inert],[aria-hidden="true"]') || !element.getBoundingClientRect().width) return;
    let background = [0, 0, 0, 0];
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor);
      if (css.backgroundImage !== "none" || css.filter !== "none" || css.mixBlendMode !== "normal" || css.opacity !== "1") throw new Error("Unsupported compositing: " + ancestor.className);
      background = over(background, rgba(css.backgroundColor));
    }
    if (background[3] !== 1) throw new Error("No opaque background");
    const foreground = over(rgba(color), background), a = luminance(foreground), b = luminance(background);
    results.push({ text, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) });
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; if (n.textContent.trim()) measure(n.parentElement, n.textContent.trim(), getComputedStyle(n.parentElement).color); }
  for (const el of root.querySelectorAll("input,select,textarea")) {
    if (el.type === "hidden") continue;
    const placeholder = !el.value && el.placeholder;
    measure(el, el.value || placeholder || "control", getComputedStyle(el, placeholder ? "::placeholder" : null).color);
  }
  return results;
}
const browser = await chromium.launch({ channel: "chrome" });
const directory = new URL("../evidence/auth54-contrast/", import.meta.url);
await mkdir(directory, { recursive: true });
const authScreens = screens.filter(s => s.module === "auth");
let cases = 0, samples = 0, minimum = Infinity;
try {
  for (const screen of authScreens) for (const deviceClass of Object.keys(sizes)) for (const mode of ["light", "dark"]) {
    const [width, height] = sizes[deviceClass];
    const page = await browser.newPage({ viewport: { width, height } });
    for (const state of screen.states) {
      await prepare(page, process.env.XP_BASE_URL ?? "http://127.0.0.1:5221", screen, deviceClass, mode, state);
      // Wait for status/first-paint motion to release opacity before checking opaque AA pairs.
      await page.waitForTimeout(350);
      const values = await page.locator("body").evaluate(measureContrast);
      if (state === "default") await page.screenshot({ path: new URL(`${screen.id}-${deviceClass}-${mode}.png`, directory).pathname });
      assert.ok(values.length > 0);
      for (const value of values) assert.ok(value.ratio >= 4.5, `${deviceClass}/${mode}/${state}: ${value.text} ${value.ratio}`);
      minimum = Math.min(minimum, ...values.map(v => v.ratio)); samples += values.length; cases++;
    }
    console.log(`${screen.id}/${deviceClass}/${mode}: all ${screen.states.length} auth states AA PASS`);
    await page.close();
  }
  console.log(`AA PASS: ${cases} cases, ${samples} text/value samples, minimum ${minimum.toFixed(3)}:1`);
} finally { await browser.close(); }
