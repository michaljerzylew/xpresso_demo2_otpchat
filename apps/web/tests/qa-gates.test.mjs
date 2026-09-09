import { afterAll, beforeAll, expect, test } from "vitest";
import { chromium } from "@playwright/test";
import { inspectDOM, foundingFailure, focusTrap } from "../../../scripts/qa/gates.mjs";

let browser;
beforeAll(async () => { browser = await chromium.launch({ channel: "chrome" }); });
afterAll(async () => { await browser?.close(); });
test("tap targets enforce the class floor on both axes, including fine pointers", async () => {
  const page = await browser.newPage();
  try {
    for (const deviceClass of ["M", "TP", "TL", "DS", "DW"]) {
      const minimum = ["M", "TP"].includes(deviceClass) ? 44 : 24;
      for (const [width, height] of [[minimum - 1, minimum], [minimum, minimum - 1], [minimum, minimum]]) {
        await page.setContent(`<button style="box-sizing:border-box;padding:0;width:${width}px;height:${height}px">X</button>`);
        const result = await page.evaluate(inspectDOM, { deviceClass, reducedMotion: false });
        expect(result.measured.tapTargets).toBe(1);
        expect(result.findings.tapTargets.length).toBe(width < minimum || height < minimum ? 1 : 0);
      }
    }
  } finally { await page.close(); }
});
test("machine gates detect real bad DOM and clear after correction", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  try {
    await page.setContent('<main style="width:500px"><button style="width:20px;height:20px;font-size:10px;transition:transform 400ms">X</button><img src="data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\"/%3E" width="20" height="20"></main>');
    const bad = await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: true });
    for (const gate of ["overflow", "tapTargets", "textSize", "missingAlt", "animationBudget", "reducedMotion"]) expect(bad.findings[gate].length, gate).toBeGreaterThan(0);
    await page.setContent('<main><button style="width:44px;height:44px;font-size:12px">X</button><input style="width:44px;height:44px;font-size:12px" value="A long value scrolling inside its native editor"><img alt="" width="20" height="20"></main>');
    const good = await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: true });
    for (const findings of Object.values(good.findings)) expect(findings).toEqual([]);
  } finally { await page.close(); }
});
test("focus escaping a dialog fails, explicit two-way trapping passes", async () => {
  const page = await browser.newPage();
  try {
    await page.setContent('<button>Outside</button><dialog open><button>Inside</button></dialog>');
    await page.getByRole("button", { name: "Inside" }).focus();
    expect((await focusTrap(page, true)).status).toBe("FAIL");
    await page.evaluate(() => {
      const dialog = document.querySelector("dialog");
      dialog.querySelector("button").focus();
      dialog.addEventListener("keydown", event => {
        if (event.key === "Tab") { event.preventDefault(); dialog.querySelector("button").focus(); }
      });
    });
    expect((await focusTrap(page, true)).status).toBe("PASS");
  } finally { await page.close(); }
});
test("intentional horizontal navigation scrolls, while content overflow and clipping still fail", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    for (const [tag, overflow, fails] of [["nav", "auto", false], ["nav", "hidden", true], ["div", "auto", true]]) {
      await page.setContent(`<${tag} aria-label="Sections" style="width:300px;overflow-x:${overflow};overflow-y:hidden"><span style="display:block;width:600px">Section choices</span></${tag}>`);
      const result = await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false });
      expect(result.findings.overflow.length > 0).toBe(fails);
    }
    await page.setContent('<nav style="width:600px;overflow-x:auto;overflow-y:hidden">Too wide for the document</nav>');
    expect((await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false })).findings.overflow).toContain("document scrollWidth > clientWidth");
  } finally { await page.close(); }
});
test("founding failure uses matching DW compactness and strict 1.25 threshold", () => {
  const wide = { documentHeight: 1080, viewportHeight: 1080, pageHeight: 1080 };
  expect(foundingFailure({ pageHeight: 1055, viewportHeight: 844 }, wide).status).toBe("PASS");
  expect(foundingFailure({ pageHeight: 1056, viewportHeight: 844 }, wide).status).toBe("FAIL");
});
test("nested DW pane scrolling does not disarm the detector, a scrolling DW document does", () => {
  // Real DW geometry: the document fits, one pane overshoots by 2px. The gate must stay armed.
  const nested = { documentHeight: 1080, viewportHeight: 1080, pageHeight: 1082, scrollExcess: 2 };
  expect(foundingFailure({ pageHeight: 5000, viewportHeight: 844 }, nested).status).toBe("FAIL");
  expect(foundingFailure({ pageHeight: 900, viewportHeight: 844 }, nested).status).toBe("PASS");
  // A DW form that itself scrolls cannot be a baseline, and the gate must say so instead of passing.
  const scrolling = { documentHeight: 1200, viewportHeight: 1080, pageHeight: 1200 };
  expect(foundingFailure({ pageHeight: 5000, viewportHeight: 844 }, scrolling).status).toBe("INACTIVE");
  expect(foundingFailure({ pageHeight: 900, viewportHeight: 844 }, scrolling).status).toBe("INACTIVE");
  expect(foundingFailure({ pageHeight: 900, viewportHeight: 844 }, undefined).status).toBe("INACTIVE");
});
test("gates report what they measured, so an empty page cannot pass them", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.setContent("<!-- an empty body measures nothing -->");
    const empty = await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false });
    for (const gate of ["overflow", "tapTargets", "textSize", "missingAlt", "animationBudget"]) {
      expect(empty.findings[gate], gate).toEqual([]);
      expect(empty.measured[gate], gate).toBe(0);
    }
    await page.setContent('<main><button style="width:44px;height:44px;font-size:12px;transition:opacity 120ms">X</button><img alt="" src="data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\"/%3E" width="20" height="20"></main>');
    const populated = await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false });
    for (const gate of ["overflow", "tapTargets", "textSize", "missingAlt", "animationBudget"]) {
      expect(populated.findings[gate], gate).toEqual([]);
      expect(populated.measured[gate], gate).toBeGreaterThan(0);
    }
    // Motion is only sampled in reduce runs; a normal run must not look like a reduced-motion pass.
    expect(populated.measured.reducedMotion).toBe(0);
    expect((await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: true })).measured.reducedMotion).toBeGreaterThan(0);
  } finally { await page.close(); }
});
test("declared ellipsis truncation is not overflow, silent clipping still is", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.setContent('<main><p id="truncated" style="width:80px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">A subject line far wider than eighty pixels</p></main>');
    expect((await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false })).findings.overflow).toEqual([]);
    await page.locator("#truncated").evaluate(el => el.style.textOverflow = "clip");
    expect((await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false })).findings.overflow.length).toBeGreaterThan(0);
  } finally { await page.close(); }
});
test("an overlay with no focusable element is inactive, never a passing trap", async () => {
  const page = await browser.newPage();
  try {
    await page.setContent("<dialog open><p>Nothing focusable</p></dialog>");
    expect((await focusTrap(page, true)).status).toBe("INACTIVE");
    expect((await focusTrap(page, false)).status).toBe("NA");
  } finally { await page.close(); }
});
test("focus traversal restores a long dialog's scroll position for screenshots", async () => {
  const page = await browser.newPage();
  try {
    await page.setContent('<dialog><button>Close</button><div id="body" style="height:100px;overflow:auto"><button>First</button><div style="height:500px"></div><button>Last</button></div></dialog>');
    await page.locator("dialog").evaluate(el => {
      el.showModal();
      el.addEventListener("keydown", event => {
        const buttons = [...el.querySelectorAll("button")];
        if (event.key === "Tab" && document.activeElement === (event.shiftKey ? buttons[0] : buttons.at(-1))) {
          event.preventDefault();
          (event.shiftKey ? buttons.at(-1) : buttons[0]).focus();
        }
      });
    });
    expect((await focusTrap(page, true)).status).toBe("PASS");
    expect(await page.locator("#body").evaluate(el => el.scrollTop)).toBe(0);
  } finally { await page.close(); }
});
test("visually hidden skip links are excluded; launch exceptions are bounded", async () => {
  const page = await browser.newPage();
  try {
    await page.setContent('<style>a {position:absolute; width:1px;height:1px;clip:rect(0,0,0,0)} a:focus {clip:auto;width:100px;height:44px}</style><a href="#main">Skip to content</a><main id="main" data-qa-motion="launch" style="--xp-dur-launch:0.6s;transition:opacity 600ms">Content</main>');
    const findings = (await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false })).findings;
    expect(findings.overflow).toEqual([]);
    expect(findings.tapTargets).toEqual([]);
    expect(findings.animationBudget).toEqual([]);
    await page.locator("main").evaluate(el => el.style.transitionDuration = "700ms");
    expect((await page.evaluate(inspectDOM, { deviceClass: "M", reducedMotion: false })).findings.animationBudget.length).toBeGreaterThan(0);
  } finally { await page.close(); }
});
