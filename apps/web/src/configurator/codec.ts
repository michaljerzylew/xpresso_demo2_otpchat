import { colorFamilies, isThemePreference, type ColorFamily, type ColorSeed } from "@xp/theme";
import {
  contentWidths, defaultLayout, defaultState, fontCatalogue, fontRoles, isPresetName, motionIntensities,
  railStyles, scaleKeys, scaleRanges, sidebarModes, stateFromPreset,
  type ConfiguratorState, type LayoutConfig,
} from "./config";
import { serialize } from "./serialize";

export { serialize, canonical } from "./serialize";

export const storageKey = "xp-configurator";
export const hashKey = "c";
export const stateVersion = 1;

type Unknown = Record<string, unknown>;
const isObject = (value: unknown): value is Unknown => typeof value === "object" && value !== null && !Array.isArray(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Snapping to the step must not leave 1.4000000000000001 behind: a link is compared as text.
const round = (value: number, step: number) => Number((Math.round(value / step) * step).toFixed(6));


function member<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function seed(value: unknown, fallback: ColorSeed): ColorSeed {
  if (!isObject(value)) return fallback;
  const hue = Number(value.hue);
  const chroma = Number(value.chroma);
  return {
    hue: Number.isFinite(hue) ? ((hue % 360) + 360) % 360 : fallback.hue,
    // The engine rejects chroma above 0.4; clamp rather than throw on a hand-edited link.
    chroma: Number.isFinite(chroma) ? clamp(chroma, 0, 0.4) : fallback.chroma,
  };
}

function layout(value: unknown, fallback: LayoutConfig): LayoutConfig {
  const source = isObject(value) ? value : {};
  return {
    sidebar: member(source.sidebar, sidebarModes, fallback.sidebar),
    content: member(source.content, contentWidths, fallback.content),
    rail: member(source.rail, railStyles, fallback.rail),
    motion: member(source.motion, motionIntensities, fallback.motion),
  };
}

/**
 * Never throws: an unreadable or half-valid payload degrades field by field. The named preset
 * supplies those fields, so pasting `{ "preset": "paper" }` really does give you Paper.
 */
export function normalizeState(value: unknown): ConfiguratorState {
  if (!isObject(value)) return defaultState();
  const preset = isPresetName(value.preset) ? value.preset : defaultState().preset;
  const fallback = stateFromPreset(preset);
  const colors = isObject(value.colors) ? value.colors : {};
  const fonts = isObject(value.fonts) ? value.fonts : {};
  const scales = Object.fromEntries(scaleKeys.map(key => {
    const range = scaleRanges[key];
    const raw = Number((value as Unknown)[key]);
    return [key, Number.isFinite(raw) ? round(clamp(raw, range.min, range.max), range.step) : fallback[key]];
  })) as Pick<ConfiguratorState, "spacingScale" | "radiusScale" | "shadowScale" | "density">;
  return {
    preset,
    mode: isThemePreference(value.mode) ? value.mode : fallback.mode,
    colors: Object.fromEntries(colorFamilies.map(family => [family, seed(colors[family], fallback.colors[family])])) as Record<ColorFamily, ColorSeed>,
    fonts: Object.fromEntries(fontRoles.map(role => [
      role,
      fontCatalogue[role].some(option => option.id === fonts[role]) ? String(fonts[role]) : fallback.fonts[role],
    ])) as ConfiguratorState["fonts"],
    ...scales,
    layout: layout(value.layout, defaultLayout),
  };
}

/** URL-safe base64 of the UTF-8 JSON. Works in the browser and in Node's test runner. */
export function encodeState(state: ConfiguratorState): string {
  const json = serialize({ v: stateVersion, ...state });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeState(encoded: string): ConfiguratorState | null {
  try {
    const padded = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isObject(parsed) || parsed.v !== stateVersion) return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

/** Keeps any other fragment a route already owns; the configurator only owns `c`. */
export function writeHash(hash: string, state: ConfiguratorState): string {
  const parameters = new URLSearchParams(hash.replace(/^#/, ""));
  parameters.set(hashKey, encodeState(state));
  return "#" + parameters.toString();
}

export function readHash(hash: string): ConfiguratorState | null {
  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get(hashKey);
  return encoded ? decodeState(encoded) : null;
}

export function readStorage(storage: Pick<Storage, "getItem"> | undefined): ConfiguratorState | null {
  try {
    const raw = storage?.getItem(storageKey);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeStorage(storage: Pick<Storage, "setItem"> | undefined, state: ConfiguratorState): void {
  try {
    storage?.setItem(storageKey, serialize({ v: stateVersion, ...state }));
  } catch {
    /* Private mode still gets a working session and a shareable link. */
  }
}
