import { compileTheme, type ThemeSpec, type ThemeMode } from "./theme";

export type ThemePreference = ThemeMode | "system";
export const themeStorageKey = "xp-theme-mode";
export const themeModeEvent = "xp-theme-mode-change";
export const isThemePreference = (value: unknown): value is ThemePreference => value === "light" || value === "dark" || value === "system";

export function applyTheme(spec: ThemeSpec): HTMLStyleElement {
  const css = compileTheme(spec);
  let style = document.querySelector<HTMLStyleElement>("style#xp-theme");
  if (!style) {
    style = document.createElement("style");
    style.id = "xp-theme";
    document.head.append(style);
  }
  style.textContent = css;
  return style;
}

export function getThemePreference(): ThemePreference {
  if (typeof document === "undefined") return "system";
  const current = document.documentElement.dataset.themePreference;
  if (isThemePreference(current)) return current;
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (isThemePreference(stored)) return stored;
  } catch { /* Storage may be disabled; system mode still works. */ }
  return "system";
}

function reflectMode(preference: ThemePreference): void {
  const mode = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = mode;
  window.dispatchEvent(new Event(themeModeEvent));
}

export function setThemePreference(preference: ThemePreference): void {
  if (!isThemePreference(preference)) throw new Error("Unknown theme preference.");
  try { localStorage.setItem(themeStorageKey, preference); } catch { /* Keep the in-memory choice. */ }
  reflectMode(preference);
}

/** Install once at the app boundary; dispose on unmount/HMR. */
export function startThemeMode(): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => { if (getThemePreference() === "system") reflectMode("system"); };
  const onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) reflectMode(isThemePreference(event.newValue) ? event.newValue : "system");
  };
  reflectMode(getThemePreference());
  media.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}
