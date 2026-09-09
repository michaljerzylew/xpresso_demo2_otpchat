import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tsImport } from "tsx/esm/api";

const { modules } = await tsImport("../src/app-modules.ts", import.meta.url);
const hasCalendar = modules.some(module => module.id === "calendar");

// Render small CSS fixtures under the shipped app styles. Each wrapper represents a
// distinct cascade owner; the iframe deliberately has only the standalone primitive CSS.
export async function verifySkinContracts(browser, baseURL) {
  const primitives = readFileSync(new URL("../../../packages/xp-primitives/styles/primitives.css", import.meta.url), "utf8");
  for (const width of [1920, 1440, 390]) for (const mode of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: mode });
    const page = await context.newPage();
    try {
      await page.goto(baseURL);
      await page.locator(".workspace").waitFor();
      const geometry = await page.evaluate(hasCalendar => {
        const host = document.createElement("div");
        host.id = "skin-contract";
        const segments = '<div class="xp-segmented"><button class="xp-segmented__item" data-state="checked">Selected</button><button class="xp-segmented__item" data-state="unchecked">Other</button></div>';
        host.innerHTML = [
          '<div class="workspace">' + segments + '<button class="icon-button" disabled>Previous</button><div class="pane-body"><div class="pane-actions"><button>Inspect</button></div><div class="route-surface"><header>Title</header></div></div></div>',
          '<div class="xp-configurator">' + segments + '</div>',
          '<div class="workspace"><div class="kit-segments">' + segments + '</div></div>',
          ...(hasCalendar ? ['<div class="cal-views"><button class="cal-view-button" aria-pressed="true">Month</button><button class="cal-view-button" aria-pressed="false">Week</button></div>'] : []),
          ...["workspace", "workspace-sheet", "kit-floating", "kit-dialog", "kit-field"].map(owner => '<div class="' + owner + '">' + ["input", "select", "textarea"].map(tag => '<' + tag + ' class="xp-field-control" aria-label="' + owner + '-' + tag + '">' + (tag === "select" ? '<option>Choice</option>' : '') + '</' + tag + '>').join('') + '</div>'),
        ].join("");
        document.body.append(host);
        for (const workspace of host.querySelectorAll(".workspace")) workspace.dataset.xpClass = document.documentElement.dataset.xpClass;
        const header = getComputedStyle(host.querySelector(".route-surface > header"));
        const button = getComputedStyle(host.querySelector(".pane-actions button"));
        return { minimum: header.minBlockSize, padding: parseFloat(header.paddingInlineEnd), button: button.blockSize, space: parseFloat(getComputedStyle(host).getPropertyValue("--space-xs")) };
      }, hasCalendar);
      assert.equal(geometry.minimum, width === 390 ? "44px" : "36px", "pane heading follows its action height");
      // Resolve the spacing token in CSS rather than parsing a potentially fluid expression.
      const padding = await page.evaluate(() => {
        const host = document.querySelector("#skin-contract");
        const probe = document.createElement("span");
        probe.style.paddingInlineEnd = "var(--space-xs)";
        host.append(probe);
        return parseFloat(getComputedStyle(probe).paddingInlineEnd);
      });
      assert.equal(geometry.padding, parseFloat(geometry.minimum) + padding, "no stale 44px reservation on desktop");

      const measure = await page.locator("#skin-contract").evaluate((host, css) => {
        const probe = document.createElement("span");
        host.append(probe);
        const roles = Object.fromEntries(["ink", "surface", "muted", "surface-muted"].map(role => {
          probe.style.color = "var(--xp-" + role + ")";
          return [role, getComputedStyle(probe).color];
        }));
        const sample = element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, color: style.color, shadow: style.boxShadow };
        };
        const pairs = [...host.querySelectorAll(".xp-segmented, .cal-views")].map(track => ({
          checked: sample(track.children[0]), unchecked: sample(track.children[1]),
        }));
        const frame = document.createElement("iframe");
        host.append(frame);
        const doc = frame.contentDocument;
        doc.open();
        doc.write('<style>:root{' + Object.entries(roles).map(([role, value]) => '--xp-color-' + role + ':' + value).join(';') + '}' + css + '</style><div class="xp-segmented"><button class="xp-segmented__item" data-state="checked">Selected</button><button class="xp-segmented__item">Other</button></div>');
        doc.close();
        pairs.push({ checked: sample(doc.querySelectorAll("button")[0]), unchecked: sample(doc.querySelectorAll("button")[1]) });
        return { roles, pairs };
      }, primitives);
      for (const [index, pair] of measure.pairs.entries()) {
        assert.equal(pair.checked.background, measure.roles.ink, width + "/" + mode + " selection " + index);
        assert.equal(pair.checked.color, measure.roles.surface);
        assert.equal(pair.checked.shadow, "none");
        assert.equal(pair.unchecked.background, "rgba(0, 0, 0, 0)");
        assert.equal(pair.unchecked.color, measure.roles.muted);
        assert.notEqual(pair.checked.background, pair.unchecked.background);
        assert.notEqual(pair.checked.color, pair.unchecked.color);
      }
      const disabled = page.locator("#skin-contract .icon-button:disabled");
      for (const hover of [false, true]) {
        if (hover) await disabled.hover({ force: true });
        assert.equal(await disabled.evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "disabled ghost remains transparent, including hover");
      }
      await page.emulateMedia({ forcedColors: "active" });
      await page.locator("#skin-contract .workspace-sheet").evaluate(sheet => sheet.setAttribute("open", ""));
      await page.keyboard.press("Tab");
      const controls = page.locator("#skin-contract :is(input, select, textarea)");
      assert.equal(await controls.count(), 15);
      for (const field of await controls.all()) {
        await field.focus();
        const focus = await field.evaluate(element => {
          const style = getComputedStyle(element);
          return [element.matches(":focus-visible"), style.outlineWidth, style.outlineStyle, style.outlineColor];
        });
        assert.deepEqual(focus.slice(0, 3), [true, "2px", "solid"], await field.getAttribute("aria-label"));
        assert.notEqual(focus[3], "rgba(0, 0, 0, 0)");
      }
      console.log("PASS: skin contracts " + width + "/" + mode + ": " + measure.pairs.length + " segmented cascades, disabled ghosts, pane geometry, 15 forced-colors controls");
    } finally { await context.close(); }
  }
}
