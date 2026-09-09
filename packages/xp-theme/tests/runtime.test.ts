// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyTheme, getThemePreference, setThemePreference, startThemeMode, themeStorageKey } from "../src/runtime";
import { presets } from "../src/presets";

let dark = false;
let listener: (() => void) | undefined;
let dispose: (() => void) | undefined;
beforeEach(() => {
  document.head.innerHTML = "";
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  localStorage.clear();
  dark = false;
  listener = undefined;
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return dark; },
    addEventListener: (_: string, fn: () => void) => { listener = fn; },
    removeEventListener: () => { listener = undefined; },
  }));
});
afterEach(() => { dispose?.(); dispose = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("replaces one runtime style and preserves the active mode", () => {
  setThemePreference("dark");
  const first = applyTheme(presets.graphite);
  expect(applyTheme(presets.aurora)).toBe(first);
  expect(document.querySelectorAll("#xp-theme")).toHaveLength(1);
  expect(first.textContent).toContain("165");
  expect(document.documentElement.dataset.theme).toBe("dark");
});

it("tracks system changes, persists manual choices, and resumes system mode", () => {
  dispose = startThemeMode();
  expect(document.documentElement.dataset.theme).toBe("light");
  dark = true;
  listener?.();
  expect(document.documentElement.dataset.theme).toBe("dark");
  setThemePreference("light");
  expect(localStorage.getItem(themeStorageKey)).toBe("light");
  listener?.();
  expect(document.documentElement.dataset.theme).toBe("light");
  setThemePreference("system");
  expect(document.documentElement.dataset.theme).toBe("dark");
  dispose();
  expect(listener).toBeUndefined();
});

it("reacts to cross-tab updates and clearing storage", () => {
  dispose = startThemeMode();
  window.dispatchEvent(new StorageEvent("storage", { key: themeStorageKey, newValue: "dark" }));
  expect(getThemePreference()).toBe("dark");
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  expect(getThemePreference()).toBe("system");
  expect(document.documentElement.dataset.theme).toBe("light");
});

it("keeps manual mode working when storage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  dispose = startThemeMode();
  setThemePreference("dark");
  expect(getThemePreference()).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
});

const html = readFileSync(resolve("../../apps/web/index.html"), "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)![1];
it.each([
  [null, false, "light"], [null, true, "dark"], ["invalid", true, "dark"],
  ["light", true, "light"], ["dark", false, "dark"], ["system", true, "dark"],
])("bootstrap resolves %s/system=%s to %s before the module", (saved, systemDark, expected) => {
  if (saved) localStorage.setItem(themeStorageKey, saved);
  dark = systemDark as boolean;
  window.eval(bootstrap);
  expect(document.documentElement.dataset.theme).toBe(expected);
  expect(html.indexOf(bootstrap)).toBeLessThan(html.indexOf('type="module"'));
  dispose = startThemeMode();
  expect(document.documentElement.dataset.theme).toBe(expected);
});

it("bootstrap still follows system preference with blocked storage", () => {
  dark = true;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  window.eval(bootstrap);
  expect(document.documentElement.dataset.theme).toBe("dark");
});
