import { resolveColors, srgbHex, type ThemeSpec } from "@xp/theme";
import { presets } from "@xp/theme/presets";

/**
 * Fills the per-mode `theme-color` metas from the theme tokens instead of literal
 * colours, so the browser chrome cannot drift from the preset the app compiles.
 * The metas carry a `media` attribute each, so both values are set once at start-up
 * and the browser picks the matching one when the OS preference changes.
 */
export function applyThemeColorMetas(spec: ThemeSpec = presets.graphite): void {
  for (const mode of ["light", "dark"] as const) {
    const meta = document.head.querySelector<HTMLMetaElement>(`meta[name="theme-color"][media*="${mode}"]`);
    if (meta) meta.content = srgbHex(resolveColors(spec, mode)["surface-raised"]);
  }
}
