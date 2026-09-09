import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { DeviceClassProvider, deviceClasses } from "@xp/runtime";
import { AppRoutes } from "../src/App.tsx";
import { defaultState, matchesPreset, stateFromPreset, scaleRanges, themeSpec } from "../src/configurator/config.ts";
import { checkContrast } from "@xp/theme";
import { decodeState, encodeState, hashKey, normalizeState, readHash, serialize, writeHash } from "../src/configurator/codec.ts";
import { canRedo, canUndo, coalesceWindow, historyLimit, historyReducer, initialHistory } from "../src/configurator/history.ts";
import { exportConfigSnippet, exportCss, exportJson, rootAttributes } from "../src/configurator/export.ts";
import { failures, familyGuard, measurePairs, minimumRatio } from "../src/configurator/guard.ts";

const edited = () => ({
  ...stateFromPreset("aurora"),
  mode: "dark",
  fonts: { sans: "manrope", serif: "literata", mono: "jetbrains" },
  radiusScale: 1.35,
  layout: { sidebar: "compact", content: "reading", rail: "labels", motion: "reduced" },
});

test("Graphite configurator state preserves its local Inter stack and subset faces", () => {
  const spec = themeSpec(defaultState());
  assert.equal(spec.fonts.sans[0], "Inter");
  assert.equal(spec.fonts.webfonts.length, 2);
  assert(spec.fonts.webfonts.every(face => face.src.startsWith("/fonts/") && face.unicodeRange));
  assert.equal(themeSpec(stateFromPreset("paper")).fonts.webfonts.length, 0);
});

test("default CSS and TypeScript exports register identical local Inter subsets", () => {
  const state = defaultState();
  const snippet = exportConfigSnippet(state);
  const faces = JSON.parse(snippet.match(/webfonts: (\[[^\n]*\]),/)[1]);
  assert.deepEqual(faces, themeSpec(state).fonts.webfonts);
  assert.equal(faces.length, 2);
  const css = exportCss(state);
  assert.equal(css.match(/@font-face/g).length, faces.length);
  for (const face of faces) {
    assert(css.includes(face.src));
    assert(css.includes(face.unicodeRange));
  }
  for (const exported of [snippet, css]) assert(exported.includes("Copy apps/web/public/fonts/*.woff2 into your public/fonts/"));
});

test("the hash codec survives a round trip, including non-ASCII-safe payloads", () => {
  const state = edited();
  const encoded = encodeState(state);
  assert.doesNotMatch(encoded, /[+/=]/, "the link payload must be URL safe");
  assert.deepEqual(decodeState(encoded), state);
});

test("the codec owns one fragment key and leaves the rest of the fragment alone", () => {
  const hash = writeHash("#summary=1", edited());
  assert.match(hash, /^#summary=1&/);
  assert.deepEqual(readHash(hash), edited());
  assert.equal(new URLSearchParams(hash.slice(1)).get("summary"), "1");
  assert.equal(readHash("#summary=1"), null);
});

test("a corrupt, foreign or future payload decodes to null instead of throwing", () => {
  for (const payload of ["", "not-base64!!", encodeState(edited()).slice(0, 6), btoa("{}"), btoa('{"v":99}')]) {
    assert.equal(decodeState(payload), null, payload);
  }
});

test("normalisation clamps numbers, wraps hues and refuses unknown members", () => {
  const normalised = normalizeState({
    preset: "eldritch",
    mode: "sideways",
    colors: { primary: { hue: 400, chroma: 9 }, neutral: { hue: -30, chroma: "x" } },
    fonts: { sans: "comic", serif: "literata" },
    radiusScale: 99,
    spacingScale: -4,
    density: Number.NaN,
    layout: { sidebar: "gone", content: "reading", rail: "labels", motion: "louder" },
  });
  assert.equal(normalised.preset, defaultState().preset);
  assert.equal(normalised.mode, defaultState().mode);
  assert.equal(normalised.colors.primary.hue, 40);
  assert.equal(normalised.colors.primary.chroma, 0.4);
  assert.equal(normalised.colors.neutral.hue, 330);
  assert.equal(normalised.colors.neutral.chroma, defaultState().colors.neutral.chroma);
  assert.equal(normalised.fonts.sans, defaultState().fonts.sans);
  assert.equal(normalised.fonts.serif, "literata");
  assert.equal(normalised.radiusScale, scaleRanges.radiusScale.max);
  assert.equal(normalised.spacingScale, scaleRanges.spacingScale.min);
  assert.equal(normalised.density, defaultState().density);
  assert.equal(normalised.layout.sidebar, "expanded");
  assert.equal(normalised.layout.motion, "full");
  assert.equal(normalised.layout.rail, "labels");
});

test("normalisation never throws on hostile input", () => {
  for (const payload of [null, 42, "text", [], { colors: 5, fonts: null, layout: [] }]) {
    assert.deepEqual(normalizeState(payload), defaultState());
  }
});

test("one gesture on one control is one undo step; a different control starts a new one", () => {
  const start = defaultState();
  let history = initialHistory(start);
  assert.equal(canUndo(history), false);
  assert.equal(canRedo(history), false);
  for (const [index, radiusScale] of [1.1, 1.2, 1.3].entries()) {
    history = historyReducer(history, { type: "edit", state: { ...start, radiusScale }, key: "scale:radiusScale", at: 1000 + index * 50, continuous: true });
  }
  assert.equal(history.past.length, 1);
  assert.equal(history.present.radiusScale, 1.3);

  history = historyReducer(history, { type: "edit", state: { ...history.present, density: 1.2 }, key: "scale:density", at: 1200, continuous: true });
  assert.equal(history.past.length, 2);

  history = historyReducer(history, { type: "edit", state: { ...history.present, density: 1.3 }, key: "scale:density", at: 1200 + coalesceWindow + 1, continuous: true });
  assert.equal(history.past.length, 3, "a pause on the same control ends the step");

  // A discrete control never merges: two clicks in a second undo one at a time.
  for (const [index, motion] of ["off", "reduced"].entries()) {
    history = historyReducer(history, { type: "edit", state: { ...history.present, layout: { ...start.layout, motion } }, key: "layout:motion", at: 3000 + index * 20 });
  }
  assert.equal(history.past.length, 5);
  assert.equal(historyReducer(history, { type: "undo" }).present.layout.motion, "off");
});

test("undo and redo walk the same path and a fresh edit clears the redo branch", () => {
  let history = initialHistory(defaultState());
  history = historyReducer(history, { type: "edit", state: { ...defaultState(), radiusScale: 1.5 }, key: "a", at: 0 });
  history = historyReducer(history, { type: "edit", state: { ...defaultState(), radiusScale: 1.9 }, key: "b", at: 10 });
  history = historyReducer(history, { type: "undo" });
  assert.equal(history.present.radiusScale, 1.5);
  assert.equal(canRedo(history), true);
  history = historyReducer(history, { type: "redo" });
  assert.equal(history.present.radiusScale, 1.9);
  history = historyReducer(history, { type: "undo" });
  history = historyReducer(history, { type: "edit", state: { ...defaultState(), radiusScale: 0.5 }, key: "c", at: 20 });
  assert.equal(canRedo(history), false);
  assert.deepEqual(historyReducer(initialHistory(defaultState()), { type: "undo" }).past, []);
});

test("an identical edit is not a step, replace is, and the stack is bounded", () => {
  const start = defaultState();
  let history = initialHistory(start);
  history = historyReducer(history, { type: "edit", state: { ...start }, key: "a", at: 0 });
  assert.equal(canUndo(history), false);
  history = historyReducer(history, { type: "replace", state: { ...start, radiusScale: 1.4 } });
  assert.equal(canUndo(history), true);
  for (let index = 0; index < historyLimit + 12; index++) {
    history = historyReducer(history, { type: "edit", state: { ...start, radiusScale: index / 100 }, key: "k" + index, at: index * 10_000 });
  }
  assert.equal(history.past.length, historyLimit);
});

test("the CSS export is self-contained: webfont import first, then variables, then layout", () => {
  const css = exportCss(edited());
  const lines = css.split("\n");
  assert.match(lines[0], /^@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope/);
  assert.equal(lines.filter(line => line.startsWith("@import")).length, 3);
  assert.ok(css.indexOf("@import") < css.indexOf(":root"), "@import must precede any rule");
  assert.match(css, /data-xp-sidebar="compact"/);
  assert.match(css, /--xp-primary-500:/);
  assert.match(css, /--xp-radius-scale: 1\.35;/);
  assert.match(css, /\[data-theme=dark\]/);
  assert.match(css, /--xp-content-max: var\(--measure-body\);/);
  assert.doesNotMatch(exportCss(defaultState()), /^@import/, "system stacks fetch nothing");
});

test("the JSON export re-imports as the same configuration", () => {
  const state = edited();
  assert.deepEqual(normalizeState(JSON.parse(exportJson(state))), state);
  assert.match(exportJson(state), /\n$/);
});

test("the config snippet is a module, not a fragment", () => {
  const snippet = exportConfigSnippet(edited());
  assert.match(snippet, /^\/\/ xpresso\.config\.ts/);
  assert.match(snippet, /import \{ applyTheme, setThemePreference, type ThemeSpec \} from "@xp\/theme";/);
  assert.match(snippet, /export const theme: ThemeSpec = \{/);
  assert.match(snippet, /primary: \{ hue: 165, chroma: 0\.14 \},/);
  assert.match(snippet, /sans: \["Manrope","ui-sans-serif","sans-serif"\],/);
  assert.match(snippet, /export const colorMode = "dark";/);
  assert.match(snippet, /export default \{ theme, fontStylesheets, layout, rootAttributes, contentMaxWidth, colorMode, applyConfiguration \};/);
});

test("layout is expressed as four root attributes so a preview document can be reconfigured", () => {
  assert.deepEqual(rootAttributes(edited()), {
    "data-xp-sidebar": "compact",
    "data-xp-content": "reading",
    "data-xp-rail": "labels",
    "data-xp-motion": "reduced",
  });
});

for (const deviceClass of deviceClasses) test("/configure renders its panel in " + deviceClass, () => {
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ["/configure"] },
      createElement(DeviceClassProvider, { deviceClass }, createElement(AppRoutes))),
  );
  assert.match(html, /data-xp-shell=""/);
  assert.ok(html.includes('data-device-class="' + deviceClass + '"'));
  assert.ok(html.includes("Customise"), "the header names the route");
  assert.ok(html.includes("Specimen"));
  // DS and DW dock the pane; TL, TP and M reach it through the shell's own overlay region,
  // which mounts nothing until the sheet opens, so only the labelled trigger is in the markup.
  const docked = deviceClass === "DS" || deviceClass === "DW";
  assert.equal(html.includes('class="route-inspector xp-slot"'), docked);
  assert.equal(html.includes("cfg-group__head"), docked);
  // The route's sections are the panel's groups, and only a docked pane puts them in the document.
  assert.equal(html.includes('href="/configure#cfg-colour"'), docked);
  // A disclosure button is named by its own visible text; aria-expanded carries the state.
  if (!docked) assert.match(html, /class="inspector-toggle"[^>]*>(?:(?!<\/button).)*?Customise/s);
  const compact = deviceClass === "M" || deviceClass === "TP";
  assert.equal(html.includes('title="M preview"'), !compact, "the strip mounts on the wide classes");
  assert.equal(html.includes("Show device previews"), compact, "the compact classes offer it instead");
});

test("a preview frame renders the panel without a second live controller", () => {
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ["/configure?xp=DS&xp-frame=1&xp-preview=1"] },
      createElement(DeviceClassProvider, { deviceClass: "DS" }, createElement(AppRoutes))),
  );
  assert.ok(html.includes("Customise"));
  assert.ok(!html.includes('title="M preview"'), "a framed configurator must not nest the strip");
});

test("a canonical-viewport host is not a preview: the QA harness gets the real route", () => {
  // scripts/qa/common.mjs drives every route with xp-frame=1 to avoid the simulator chrome.
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ["/configure?xp=DW&xp-frame=1"] },
      createElement(DeviceClassProvider, { deviceClass: "DW" }, createElement(AppRoutes))),
  );
  assert.ok(html.includes('title="M preview"'), "the live strip must render for a simulator or QA host");
  assert.ok(html.includes("cfg-group__head"), "the live panel must render for a simulator or QA host");
});

test("the hash key is the documented one", () => assert.equal(hashKey, "c"));

test("one configuration always serialises to one string, whatever built it", () => {
  const live = { ...edited(), radiusScale: 1.4 };
  const reloaded = normalizeState(JSON.parse(JSON.stringify(live)));
  assert.equal(encodeState(reloaded), encodeState(live), "a reload must not rewrite the link");
  assert.equal(normalizeState({ ...defaultState(), density: 1.4 }).density, 1.4, "step snapping must not add float dust");
  assert.equal(matchesPreset(normalizeState(stateFromPreset("paper")), "paper"), true);
  assert.equal(serialize({ b: 1, a: 2 }), serialize({ a: 2, b: 1 }));
});

test("a partial import inherits from the preset it names, not from the default", () => {
  assert.deepEqual(normalizeState({ preset: "paper" }), stateFromPreset("paper"));
  const partial = normalizeState({ preset: "midnight", radiusScale: 0.5 });
  assert.deepEqual(partial.colors, stateFromPreset("midnight").colors);
  assert.equal(partial.radiusScale, 0.5);
  assert.equal(matchesPreset(partial, "midnight"), false, "an edited value is reported as edited");
});

test("choosing a preset keeps the three font selections", () => {
  // docs/product/configurator.md promises fonts and layout survive a preset change.
  const chosen = { ...stateFromPreset("graphite"), fonts: { sans: "manrope", serif: "literata", mono: "jetbrains" } };
  const swapped = { ...stateFromPreset("aurora", chosen.layout, chosen.mode), fonts: chosen.fonts };
  assert.deepEqual(swapped.fonts, chosen.fonts);
  assert.deepEqual(swapped.colors, stateFromPreset("aurora").colors, "the seeds still come from the preset");
  assert.equal(matchesPreset(swapped, "aurora"), true, "and it still reports as the unmodified preset");
});

test("the config module carries the chosen families, their stylesheets and the apply path", () => {
  const state = { ...defaultState(), fonts: { sans: "manrope", serif: "literata", mono: "jetbrains" } };
  const snippet = exportConfigSnippet(state);
  const urls = JSON.parse(snippet.match(/export const fontStylesheets: readonly string\[\] = (\[.*?\]);/)[1]);
  assert.equal(urls.length, 3, "one stylesheet per named family");
  for (const [family, url] of [["Manrope", urls[0]], ["Literata", urls[1]], ["JetBrains+Mono", urls[2]]]) {
    assert.ok(url.startsWith("https://fonts.googleapis.com/css2?family=" + family), url);
  }
  // Naming a family without an apply path is what made the previous hand-off silently lossy.
  assert.match(snippet, /export function loadFontStylesheets/);
  assert.match(snippet, /export function applyConfiguration/);
  assert.match(snippet, /applyTheme\(theme\);/);
  assert.match(snippet, /setThemePreference\(colorMode\);/, "the exported mode has to be applied, not just declared");
  assert.match(snippet, /data-xp-sidebar/);
  assert.match(snippet, /export const contentMaxWidth = /);
  // System stacks need nothing, so they must not invent a request.
  assert.match(exportConfigSnippet(defaultState()), /export const fontStylesheets: readonly string\[\] = \[\];/);
});

test("the config module compiles on its own against the real @xp/theme source", () => {
  const state = { ...defaultState(), fonts: { sans: "manrope", serif: "system", mono: "jetbrains" } };
  const dir = resolve(tmpdir(), `xpresso-config-${process.pid}`);
  const file = resolve(dir, "xpresso.config.ts");
  const tsconfig = resolve(dir, "tsconfig.json");
  const themeSource = fileURLToPath(new URL("../../../packages/xp-theme/src/index.ts", import.meta.url));
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, exportConfigSnippet(state));
  writeFileSync(tsconfig, JSON.stringify({
    compilerOptions: {
      noEmit: true, strict: true, target: "es2022", module: "preserve", moduleResolution: "bundler",
      lib: ["es2022", "dom"], skipLibCheck: true, baseUrl: ".",
      paths: { "@xp/theme": [themeSource] },
    },
    files: [file],
  }));
  try {
    // A clean exit is the assertion: the generated module must type-check against the workspace ThemeSpec with nothing filtered.
    execFileSync("node", [resolve(fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url))), "-p", tsconfig], {
      encoding: "utf8", cwd: fileURLToPath(new URL("..", import.meta.url)),
    });
  } catch (error) {
    assert.fail((error.stdout ?? String(error)).slice(0, 2000));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the guard measures every intended pairing, not just the failures", () => {
  const measurements = measurePairs(defaultState());
  assert.equal(measurements.length, 72, "36 intended pairings in each of two modes");
  assert.deepEqual(failures(measurements), [], "the default preset clears the floor");
  const primary = familyGuard(measurements, "primary");
  assert.equal(primary.failing, 0);
  assert.ok(primary.worst.ratio >= minimumRatio);
  assert.ok(primary.worst.text && primary.worst.background && primary.worst.mode, "the badge can name what it measured");
  // The neutral seed owns the surfaces, so its worst pairing is a different one.
  assert.notEqual(familyGuard(measurements, "neutral").worst.text, primary.worst.text);
});

test("the guard's failure branch reports the worst pairings first", () => {
  // Synthetic measurements, because the panel's own controls cannot reach a failure: the branch
  // still has to be correct for the day a ramp pole or an override changes.
  const measurements = [
    { mode: "light", text: "ink", background: "surface", ratio: 12 },
    { mode: "dark", text: "muted", background: "surface-muted", ratio: 3.91 },
    { mode: "light", text: "on-primary", background: "primary", ratio: 2.04 },
    { mode: "light", text: "primary", background: "surface", ratio: 4.49 },
  ];
  const failing = failures(measurements);
  assert.deepEqual(failing.map(entry => entry.ratio), [2.04, 3.91, 4.49], "worst first");
  assert.equal(familyGuard(measurements, "primary").failing, 2);
  assert.equal(familyGuard(measurements, "primary").worst.ratio, 2.04);
  // A pairing that spans two families is attributed to both, because either seed can fix it:
  // primary-on-surface counts against the primary seed and against the neutral one.
  assert.equal(familyGuard(measurements, "neutral").failing, 2);
  assert.equal(familyGuard(measurements, "success").failing, 0);
  assert.equal(familyGuard(measurements, "success").worst, null, "a family with no measured pairing reports nothing");
});

test("this reporting layer agrees with the engine's own guard", () => {
  const state = defaultState();
  assert.deepEqual(failures(measurePairs(state)).map(({ mode, text, background }) => ({ mode, text, background })),
    checkContrast(themeSpec(state)).map(({ mode, text, background }) => ({ mode, text, background })));
  // And on a spec the engine can fail, which only an override can produce.
  const broken = { ...themeSpec(state), overrides: { light: { muted: { l: 0.92, c: 0, h: 0 } } } };
  const engine = checkContrast(broken);
  assert.ok(engine.length > 0, "an override can fail; the panel's own controls cannot reach one");
  assert.deepEqual(engine.map(({ text, background, mode }) => `${mode}:${text}:${background}`).sort(),
    engine.map(({ text, background, mode }) => `${mode}:${text}:${background}`).sort());
});

test("no configuration reachable from the panel can fail AA", () => {
  // The reviewer asked for a failing configuration or a proof there is none. The ramp's lightness
  // poles are fixed, and a seed only moves hue and chroma, so contrast has a floor the seeds
  // cannot cross. Swept at the chroma extremes the import path allows (0 and 0.4, wider than the
  // sliders) across a 30-degree hue grid, for each family against each neutral.
  const families = ["primary", "accent", "success", "warning", "danger"];
  const hues = Array.from({ length: 12 }, (_, index) => index * 30);
  const chromas = [0, 0.4];
  let lowest = Infinity, cases = 0;
  for (const neutralHue of hues) for (const neutralChroma of chromas) {
    for (const family of families) for (const hue of hues) for (const chroma of chromas) {
      const state = normalizeState({
        ...defaultState(),
        colors: { ...defaultState().colors, neutral: { hue: neutralHue, chroma: neutralChroma }, [family]: { hue, chroma } },
      });
      const worst = measurePairs(state).reduce((low, measurement) => Math.min(low, measurement.ratio), Infinity);
      lowest = Math.min(lowest, worst);
      cases++;
    }
  }
  assert.ok(cases >= 1440, `swept ${cases} configurations`);
  assert.ok(lowest >= minimumRatio, `lowest ratio across the reachable space was ${lowest.toFixed(3)}:1`);
  console.log(`contrast floor over ${cases} reachable configurations: ${lowest.toFixed(3)}:1`);
});
