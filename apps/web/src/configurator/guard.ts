import { colorFamilies, contrastRatio, resolveColors, textBackgroundPairs, type ColorFamily, type SemanticColor, type ThemeMode } from "@xp/theme";
import { themeSpec, type ConfiguratorState } from "./config";

/** WCAG AA for body text. The engine's own guard uses the same floor. */
export const minimumRatio = 4.5;

export type PairMeasurement = { mode: ThemeMode; text: SemanticColor; background: SemanticColor; ratio: number };

/**
 * Every intended pairing with its measured ratio, not only the failures. The panel reports the
 * headroom it actually has, so the badge is a live measurement rather than a green sticker.
 */
export function measurePairs(state: ConfiguratorState): PairMeasurement[] {
  const spec = themeSpec(state);
  return (["light", "dark"] as const).flatMap(mode => {
    const colors = resolveColors(spec, mode);
    return textBackgroundPairs.map(([text, background]) => ({ mode, text, background, ratio: contrastRatio(colors[text], colors[background]) }));
  });
}

export const failures = (measurements: PairMeasurement[]) =>
  measurements.filter(measurement => measurement.ratio < minimumRatio).sort((a, b) => a.ratio - b.ratio);

/** Which semantic tokens each seed is responsible for, so a badge blames the right slider. */
export const familyTokens: Record<ColorFamily, readonly SemanticColor[]> = {
  neutral: ["surface", "surface-raised", "surface-muted", "ink", "muted", "border"],
  primary: ["primary", "primary-soft", "on-primary", "focus"],
  accent: ["accent", "accent-soft", "on-accent"],
  success: ["success", "success-soft", "on-success"],
  warning: ["warning", "warning-soft", "on-warning"],
  danger: ["danger", "danger-soft", "on-danger"],
};

export type FamilyGuard = { family: ColorFamily; failing: number; worst: PairMeasurement | null };

export function familyGuard(measurements: PairMeasurement[], family: ColorFamily): FamilyGuard {
  const tokens = familyTokens[family];
  const owned = measurements.filter(measurement => tokens.includes(measurement.text) || tokens.includes(measurement.background));
  const worst = owned.reduce<PairMeasurement | null>((lowest, measurement) => !lowest || measurement.ratio < lowest.ratio ? measurement : lowest, null);
  return { family, failing: owned.filter(measurement => measurement.ratio < minimumRatio).length, worst };
}

export const guardSummary = (measurements: PairMeasurement[]) => ({
  failing: failures(measurements),
  worst: familyGuard(measurements, "neutral").worst && measurements.reduce((lowest, measurement) => measurement.ratio < lowest.ratio ? measurement : lowest),
  families: colorFamilies.map(family => familyGuard(measurements, family)),
});

/** One decimal is the resolution a reader can act on; the engine compares unrounded. */
export const formatRatio = (ratio: number) => ratio.toFixed(2) + ":1";
