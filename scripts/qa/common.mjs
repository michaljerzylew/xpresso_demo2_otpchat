import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { tsImport } from "tsx/esm/api";

export const root = fileURLToPath(new URL("../../", import.meta.url));
export const web = resolve(root, "apps/web");
const requireWeb = createRequire(resolve(web, "package.json"));
// @playwright/test re-exports the browser drivers; the app never depends on the separate `playwright` package.
export const { chromium } = requireWeb("@playwright/test");
export const { screens } = await tsImport(resolve(web, "src/qa/screens.ts"), import.meta.url);
export const { qa } = await tsImport(resolve(web, "src/app-modules.ts"), import.meta.url);
export const sizes = { M: [390, 844], TP: [768, 1024], TL: [1024, 768], DS: [1366, 768], DW: [1920, 1080] };
export function runDirectory(id) {
  if (!id || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) throw new Error("Invalid run ID");
  return resolve(web, "evidence", id);
}
export async function serve() {
  if (process.env.XP_BASE_URL) return { base: process.env.XP_BASE_URL, close: async () => {} };
  const { preview } = await import(requireWeb.resolve("vite"));
  const server = await preview({ root: web, preview: { host: "127.0.0.1", port: 0, open: false } });
  return { base: server.resolvedUrls.local[0].replace(/\/$/, ""), close: () => new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve())) };
}
export async function waitForOverlayRest(page, selector) {
  await page.locator(selector).evaluate(node => new Promise((resolve, reject) => {
    const deadline = performance.now() + 4000;
    let previous = "", quiet = 0;
    const sample = () => {
      const css = getComputedStyle(node);
      const state = `${css.transform}/${css.opacity}`;
      const matrix = new DOMMatrixReadOnly(css.transform);
      quiet = state === previous ? quiet + 1 : 0;
      previous = state;
      if (quiet >= 3 && Number(css.opacity) === 1 && Math.abs(matrix.m42) < .01
        && Math.abs(matrix.m41) < .01 && Math.abs(matrix.a - 1) < .001 && Math.abs(matrix.d - 1) < .001) return resolve();
      if (performance.now() > deadline) return reject(new Error("Overlay did not reach resting geometry"));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

/** Resolve a real module link, opening compact module navigation before a route probe starts. */
export async function navigationFor(page, label, preferred) {
  if (await page.locator(preferred).getByRole("link", { name: label, exact: true }).isVisible()) return preferred;
  if (await page.locator(".auth-top").getByRole("link", { name: label, exact: true }).isVisible()) return ".auth-top";
  const deviceClass = await page.locator("html").getAttribute("data-xp-class");
  if (!["M", "TP"].includes(deviceClass)) return preferred;
  const title = page.getByRole("button", { name: "Choose module", exact: true });
  if (await title.isVisible()) await title.click();
  else await page.getByRole("button", { name: "More", exact: true }).click();
  await page.locator(".workspace-sheet[open]").waitFor();
  await waitForOverlayRest(page, ".workspace-sheet[open] .sheet-surface");
  return ".workspace-sheet[open] .workspace-links";
}

/** Find a real module control in the class's anatomy; sheet opening is setup, not route cadence. */
export async function moduleLink(page, label) {
  const device = await page.locator('html').getAttribute('data-xp-class');
  if (device === 'M' || device === 'TP') {
    const dock = page.locator('.workspace-tabs').getByRole('link', { name: label, exact: true });
    if (await dock.count()) return dock;
    const dialog = page.locator('.workspace-sheet[aria-label="Workspace navigation"]');
    // The sheet's dialog stays in the document once mounted, so its `open` attribute, not its
    // presence, says whether the module list is reachable.
    if (await dialog.getAttribute('open') === null) {
      await page.getByRole('button', { name: device === 'M' ? 'More' : 'Choose module', exact: true }).click();
      await waitForOverlayRest(page, '.workspace-sheet[open] .sheet-surface');
    }
    return dialog.getByRole('link', { name: label, exact: true }).first();
  }
  return page.locator(device === 'DS' ? '.workspace-sidebar' : '.workspace-rail').getByRole('link', { name: label, exact: true });

}

/** Find the real navigation surface. Compact Home puts module navigation in More. */
export async function navigationSurface(page, navigation, label) {
  if (await page.locator(navigation).getByRole("link", { name: label, exact: true }).count()) return navigation;
  await page.getByRole("button", { name: "More", exact: true }).click();
  const sheet = await page.locator(".workspace-sheet[open]").count();
  const surface = sheet ? ".workspace-sheet[open]" : ".more-popover:popover-open";
  await waitForOverlayRest(page, sheet ? surface + " .sheet-surface" : surface);
  await page.locator(surface).getByRole("link", { name: label, exact: true }).waitFor();
  return surface;
}
/**
 * Opens a route's inspector pane in whatever form the class gives it (vision §3): already docked on
 * DW and on any pane that arrives open, toggled into its own track on DS, and the shell's modal
 * sheet on M and TP or side drawer on TL. Shared by every route that has a pane, so a new module
 * registers `panel-open` without teaching the harness a new selector.
 */
export async function openRoutePane(page, deviceClass, content, trigger) {
  // `content` names the pane's own body when a route has one worth waiting for; routes whose pane is
  // plain markup pass an empty string and the pane element itself is the thing to wait for.
  const docked = page.locator(content ? ".route-inspector " + content : ".route-inspector");
  // Playwright treats an element as visible on a non-empty box alone, so a docked pane counts as
  // visible while it is still entering from opacity 0 and scale 0.96. Wait for resting geometry, or
  // both the gates and the screenshots read a pane that is not on screen yet.
  if (await docked.count()) {
    await docked.waitFor();
    return waitForOverlayRest(page, ".route-inspector");
  }
  await trigger.click();
  if (deviceClass === "DW" || (deviceClass === "DS" && page.viewportSize().width >= 1400)) {
    await docked.waitFor();
    return waitForOverlayRest(page, ".route-inspector");
  }
  await page.locator(content ? ".workspace-sheet[open] " + content : ".workspace-sheet[open] .sheet-body").waitFor();
  await waitForOverlayRest(page, ".workspace-sheet[open] .sheet-surface");
}

/** Generic shell states; module producers own only their additional interactions. */
export async function prepareGenericState(page, screen, deviceClass, state, sheetTrigger) {
  if (state === "sheet-open") {
    const sheet = ["M", "TP"].includes(deviceClass);
    await page.getByRole("button", { name: sheetTrigger ?? (deviceClass === "TP" ? "Choose module" : "More"), exact: true }).click();
    await waitForOverlayRest(page, sheet ? ".workspace-sheet[open] .sheet-surface" : ".more-popover:popover-open");
  } else if (state === "panel-open") {
    const trigger = screen.id === "configure" ? page.getByRole("button", { name: "Customise", exact: true }) : page.locator('.route-pane[data-active="true"] .pane-actions .inspector-toggle');
    await openRoutePane(page, deviceClass, screen.id === "configure" ? ".xp-configurator" : "", trigger);
  } else if (!["default", "empty", "loading", "error", "not-found"].includes(state)) throw new Error(`No setup for state ${state}`);
}

export async function prepare(page, base, screen, deviceClass, mode, state, motion = "normal") {
  const producer = qa.states[screen.module] ? await import(new URL(qa.states[screen.module], import.meta.url)) : undefined;
  const target = producer?.route?.(screen, state, deviceClass) ?? {};
  await page.emulateMedia({ colorScheme: mode, reducedMotion: motion === "reduced" ? "reduce" : "no-preference" });
  const query = new URLSearchParams(target.query ?? (["empty", "loading", "error", "not-found"].includes(state) ? "state=" + state : ""));
  query.set("xp", deviceClass);
  query.set("xp-frame", "1");
  await page.goto(`${base}${target.path ?? screen.path}?${query}`, { waitUntil: screen.id === "configure" ? "domcontentloaded" : "networkidle" });
  await page.locator(`html[data-xp-class="${deviceClass}"]`).waitFor();
  const heading = screen.module === "auth" ? page.locator(`main [data-auth-screen="${screen.id}"] h1`) : page.locator("main h1").filter({ hasText: target.heading ?? screen.name });
  await heading.first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (screen.id === "configure") await page.evaluate(() => new Promise((resolve, reject) => {
    // Preview iframe traffic is independent of the host route's readiness.
    // Observe the host DOM only, and fail rather than accepting a never-settled route.
    let quiet;
    const observer = new MutationObserver(() => { clearTimeout(quiet); quiet = setTimeout(done, 200); });
    const deadline = setTimeout(() => { observer.disconnect(); clearTimeout(quiet); reject(new Error("Configurator DOM did not settle")); }, 10_000);
    function done() { observer.disconnect(); clearTimeout(deadline); resolve(); }
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    quiet = setTimeout(done, 200);
  }));
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  if (theme !== mode) throw new Error(`Theme did not follow the emulated colour scheme: wanted ${mode}, got ${theme ?? "unset"}`);
  if (producer) await producer.prepare(page, base, screen, deviceClass, mode, state);
  else await prepareGenericState(page, screen, deviceClass, state);
  await waitForPressRest(page);
  await waitForPaneRest(page);
}

/** Every route pane is at its resting geometry: no flip, no route travel, nothing mid-transform. */
export async function waitForPaneRest(page) {
  await page.waitForFunction(() => [...document.querySelectorAll(".route-list, .route-detail, .route-inspector, .route-pane")].every(node => {
    const css = getComputedStyle(node);
    const matrix = new DOMMatrixReadOnly(css.transform);
    return matrix.a === 1 && matrix.d === 1 && matrix.m41 === 0 && matrix.m42 === 0 && Number(css.opacity) === 1;
  }), null, { polling: "raf" });
}

// Section navigation remains mounted while selection commits. Its 80ms press release
// can still scale a 44px link after the new panel paints. Two RAFs do not prove rest.
export async function waitForPressRest(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('.workspace button, .workspace a')].every(node => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return matrix.a === 1 && matrix.d === 1;
  }), null, { polling: "raf" });
}

// A direct-load record fades independently of its buttons. Under host load, network idle and
// unscaled controls can both precede its first animation frame; a hidden record must not certify.
export async function waitForCollectionRest(page) {
  const selector = '.xp-record-deck__record, tbody tr, ul > li, [data-stagger-item], .kit-collection-arrival > li';
  try {
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(node => {
      // Outgoing panes stay mounted during route travel. Their cancelled arrival is not
      // the collection being captured, and can legitimately retain an intermediate style.
      if (node.closest('.route-pane[data-active="false"]')) return true;
      const style = getComputedStyle(node);
      return style.opacity === "1" && (style.translate === "none" || style.translate.split(/\s+/).every(value => Number.parseFloat(value) === 0));
    }), selector, { polling: "raf", timeout: 10_000 });
  } catch (error) {
    const rows = await page.locator(selector).evaluateAll(nodes => nodes.map(node => ({
      text: node.textContent?.trim().slice(0, 80), active: node.closest('.route-pane')?.getAttribute('data-active'),
      style: node.getAttribute('style'), opacity: getComputedStyle(node).opacity, translate: getComputedStyle(node).translate,
    })));
    throw new Error(`Collection did not rest at ${page.url()}: ${JSON.stringify(rows)}`, { cause: error });
  }
}
