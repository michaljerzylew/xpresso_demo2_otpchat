import { colorFamilies, type ColorFamily, type ColorSeed, type ThemePreference, type ThemeSpec } from "@xp/theme";
import { presets } from "@xp/theme/presets";
import { serialize } from "./serialize";

export const presetNames = ["graphite", "paper", "aurora", "mono", "warm", "midnight"] as const;
export type PresetName = (typeof presetNames)[number];
export const isPresetName = (value: unknown): value is PresetName => presetNames.includes(value as PresetName);

export type FontRole = "sans" | "serif" | "mono";
export const fontRoles: readonly FontRole[] = ["sans", "serif", "mono"];

/**
 * A curated catalogue instead of a free-text family box: every entry is a stack we can
 * render, and webfont entries carry the one stylesheet the CSP already allows.
 */
export type FontOption = { id: string; label: string; stack: string[]; stylesheet?: string };

const googleFont = (family: string, axis = "wght@400;500;700") =>
  `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:${axis}&display=swap`;

export const fontCatalogue: Record<FontRole, readonly FontOption[]> = {
  sans: [
    { id: "system", label: "System sans", stack: ["ui-sans-serif", "system-ui", "sans-serif"] },
    { id: "inter", label: "Inter", stack: presets.graphite.fonts.sans },
    { id: "public-sans", label: "Public Sans", stack: ["Public Sans", "ui-sans-serif", "sans-serif"], stylesheet: googleFont("Public Sans") },
    { id: "manrope", label: "Manrope", stack: ["Manrope", "ui-sans-serif", "sans-serif"], stylesheet: googleFont("Manrope") },
    { id: "archivo", label: "Archivo", stack: ["Archivo", "ui-sans-serif", "sans-serif"], stylesheet: googleFont("Archivo") },
    { id: "schibsted", label: "Schibsted Grotesk", stack: ["Schibsted Grotesk", "ui-sans-serif", "sans-serif"], stylesheet: googleFont("Schibsted Grotesk") },
  ],
  serif: [
    { id: "system", label: "System serif", stack: ["ui-serif", "Georgia", "serif"] },
    { id: "source-serif", label: "Source Serif 4", stack: ["Source Serif 4", "ui-serif", "serif"], stylesheet: googleFont("Source Serif 4", "opsz,wght@8..60,400;8..60,600") },
    { id: "literata", label: "Literata", stack: ["Literata", "ui-serif", "serif"], stylesheet: googleFont("Literata", "opsz,wght@7..72,400;7..72,600") },
    { id: "spectral", label: "Spectral", stack: ["Spectral", "ui-serif", "serif"], stylesheet: googleFont("Spectral", "wght@400;600") },
  ],
  mono: [
    { id: "system", label: "System mono", stack: ["ui-monospace", "SFMono-Regular", "monospace"] },
    { id: "jetbrains", label: "JetBrains Mono", stack: ["JetBrains Mono", "ui-monospace", "monospace"], stylesheet: googleFont("JetBrains Mono", "wght@400;600") },
    { id: "fira-mono", label: "Fira Mono", stack: ["Fira Mono", "ui-monospace", "monospace"], stylesheet: googleFont("Fira Mono", "wght@400;700") },
    { id: "source-code", label: "Source Code Pro", stack: ["Source Code Pro", "ui-monospace", "monospace"], stylesheet: googleFont("Source Code Pro", "wght@400;600") },
  ],
};

export function fontOption(role: FontRole, id: string): FontOption {
  return fontCatalogue[role].find(option => option.id === id) ?? fontCatalogue[role][0];
}

export const sidebarModes = ["expanded", "compact", "hidden"] as const;
export const contentWidths = ["reading", "wide", "full"] as const;
export const railStyles = ["icons", "labels"] as const;
export const motionIntensities = ["off", "reduced", "full"] as const;
export type SidebarMode = (typeof sidebarModes)[number];
export type ContentWidth = (typeof contentWidths)[number];
export type RailStyle = (typeof railStyles)[number];
export type MotionIntensity = (typeof motionIntensities)[number];

export type LayoutConfig = {
  sidebar: SidebarMode;
  content: ContentWidth;
  rail: RailStyle;
  motion: MotionIntensity;
};

export type ConfiguratorState = {
  preset: PresetName;
  mode: ThemePreference;
  colors: Record<ColorFamily, ColorSeed>;
  fonts: Record<FontRole, string>;
  spacingScale: number;
  radiusScale: number;
  shadowScale: number;
  density: number;
  layout: LayoutConfig;
};

/** Slider contracts, shared by the controls, the codec's clamp and the unit tests. */
export const scaleRanges = {
  radiusScale: { min: 0, max: 2, step: 0.05, label: "Corner radius" },
  spacingScale: { min: 0.75, max: 1.5, step: 0.05, label: "Spacing" },
  density: { min: 0.75, max: 1.4, step: 0.05, label: "Density" },
  shadowScale: { min: 0, max: 2, step: 0.05, label: "Elevation" },
} as const;
export type ScaleKey = keyof typeof scaleRanges;
export const scaleKeys = Object.keys(scaleRanges) as ScaleKey[];

export const hueRange = { min: 0, max: 360, step: 1 };
export const chromaRange = { min: 0, max: 0.2, step: 0.005 };
export const neutralChromaRange = { min: 0, max: 0.03, step: 0.001 };

// `full` is the shell's own behaviour with no attribute set, so the configurator's default
// changes nothing until the operator asks for a reading measure.
export const defaultLayout: LayoutConfig = { sidebar: "expanded", content: "full", rail: "icons", motion: "full" };

export function stateFromPreset(preset: PresetName, layout: LayoutConfig = defaultLayout, mode: ThemePreference = "system"): ConfiguratorState {
  const spec = presets[preset] as ThemeSpec;
  return {
    preset,
    mode,
    colors: Object.fromEntries(colorFamilies.map(family => [family, { ...spec.colors[family] }])) as Record<ColorFamily, ColorSeed>,
    fonts: { sans: preset === "graphite" ? "inter" : "system", serif: "system", mono: "system" },
    spacingScale: spec.spacingScale,
    radiusScale: spec.radiusScale,
    shadowScale: spec.shadowScale,
    density: spec.density,
    layout: { ...layout },
  };
}

export const defaultState = (): ConfiguratorState => stateFromPreset("graphite");

/** The single translation from panel state to the engine's own contract. */
export function themeSpec(state: ConfiguratorState): ThemeSpec {
  return {
    fonts: {
      sans: fontOption("sans", state.fonts.sans).stack,
      serif: fontOption("serif", state.fonts.serif).stack,
      mono: fontOption("mono", state.fonts.mono).stack,
      webfonts: state.fonts.sans === "inter" ? presets.graphite.fonts.webfonts : [],
    },
    colors: state.colors,
    spacingScale: state.spacingScale,
    radiusScale: state.radiusScale,
    shadowScale: state.shadowScale,
    density: state.density,
  };
}

/** Stylesheets the current state needs; the panel loads them once, on demand. */
export function fontStylesheets(state: ConfiguratorState): string[] {
  return [...new Set(fontRoles.map(role => fontOption(role, state.fonts[role]).stylesheet).filter((href): href is string => Boolean(href)))];
}

/** Fonts and layout are orthogonal to a preset, so only the preset's own values are compared. */
export function matchesPreset(state: ConfiguratorState, preset: PresetName): boolean {
  const reference = stateFromPreset(preset, state.layout, state.mode);
  return serialize({ ...reference, fonts: state.fonts }) === serialize(state);
}
