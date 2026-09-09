import { contrastRatio, cssColor, generateRamp, validateColor, type ColorSeed, type Oklch } from "./colors";

export const colorFamilies = ["primary", "neutral", "accent", "success", "warning", "danger"] as const;
export type ColorFamily = typeof colorFamilies[number];
export type ThemeMode = "light" | "dark";
export type SemanticColor = "surface" | "surface-raised" | "surface-muted" | "ink" | "muted" | "border" | "focus" | "shadow-color"
  | ColorFamily | `${ColorFamily}-soft` | `on-${ColorFamily}`;
export type ThemeSpec = {
  fonts: {
    sans: string[];
    serif: string[];
    mono: string[];
    webfonts: { family: string; src: string; weight?: string; style?: "normal" | "italic"; unicodeRange?: string }[];
  };
  colors: Record<ColorFamily, ColorSeed>;
  spacingScale: number;
  radiusScale: number;
  shadowScale: number;
  density: number;
  overrides?: Partial<Record<ThemeMode, Partial<Record<SemanticColor, Oklch>>>>;
};

function validateSpec(spec: ThemeSpec): void {
  for (const key of ["spacingScale", "radiusScale", "shadowScale", "density"] as const) {
    if (!Number.isFinite(spec[key]) || spec[key] < 0 || ((key === "spacingScale" || key === "density") && spec[key] === 0)) {
      throw new Error(`${key} must be finite and ${key === "spacingScale" || key === "density" ? "positive" : "nonnegative"}.`);
    }
  }
  for (const family of colorFamilies) {
    const seed = spec.colors[family];
    validateColor({ l: 0.5, c: seed.chroma, h: seed.hue });
  }
  for (const family of ["sans", "serif", "mono"] as const) {
    if (!spec.fonts[family].length) throw new Error(`${family} font stack cannot be empty.`);
  }
}

export function resolveColors(spec: ThemeSpec, mode: ThemeMode): Record<SemanticColor, Oklch> {
  validateSpec(spec);
  const ramps = Object.fromEntries(colorFamilies.map(name => [name, generateRamp(spec.colors[name])])) as Record<ColorFamily, Record<number, Oklch>>;
  const dark = mode === "dark";
  const n = ramps.neutral;
  const colors = {
    surface: n[dark ? 950 : 50],
    "surface-raised": dark ? n[900] : { l: 1, c: 0, h: spec.colors.neutral.hue },
    "surface-muted": n[dark ? 800 : 100],
    ink: n[dark ? 50 : 950],
    muted: n[dark ? 400 : 600],
    border: n[dark ? 800 : 200],
    focus: ramps.primary[dark ? 300 : 700],
    "shadow-color": n[950],
  } as Record<SemanticColor, Oklch>;
  for (const family of colorFamilies) {
    colors[family] = ramps[family][dark ? 300 : 700];
    colors[`${family}-soft`] = ramps[family][dark ? 900 : 100];
    colors[`on-${family}`] = n[dark ? 950 : 50];
  }
  for (const [token, value] of Object.entries(spec.overrides?.[mode] ?? {})) {
    if (!(token in colors)) throw new Error(`Unknown semantic color: ${token}`);
    validateColor(value);
    colors[token as SemanticColor] = value;
  }
  return colors;
}

export const textBackgroundPairs: readonly (readonly [SemanticColor, SemanticColor])[] = [
  ...(["ink", "muted"] as const).flatMap(text => (["surface", "surface-raised", "surface-muted"] as const).map(background => [text, background] as const)),
  ...colorFamilies.flatMap(family => [
    [family, "surface"], [family, "surface-raised"], [family, "surface-muted"],
    [family, `${family}-soft`], [`on-${family}`, family],
  ] as [SemanticColor, SemanticColor][]),
];

export function checkContrast(spec: ThemeSpec, pairs = textBackgroundPairs) {
  return (["light", "dark"] as const).flatMap(mode => {
    const colors = resolveColors(spec, mode);
    return pairs.flatMap(([text, background]) => {
      const ratio = contrastRatio(colors[text], colors[background]);
      return ratio < 4.5 ? [{ mode, text, background, ratio, minimum: 4.5 }] : [];
    });
  });
}

const genericFonts = new Set(["serif", "sans-serif", "monospace", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace"]);
function quoted(value: string): string {
  if (!value || /[\x00-\x1f\x7f<>]/.test(value)) throw new Error("Invalid font string.");
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function compileTheme(spec: ThemeSpec): string {
  validateSpec(spec);
  const common: Record<string, string | number> = {
    "space-scale": spec.spacingScale,
    "radius-scale": spec.radiusScale,
    "shadow-scale": spec.shadowScale,
    "density-factor": spec.density,
  };
  for (const family of ["sans", "serif", "mono"] as const) {
    common[`font-${family}`] = spec.fonts[family].map(font => genericFonts.has(font) ? font : quoted(font)).join(", ");
  }
  for (const family of colorFamilies) {
    for (const [step, color] of Object.entries(generateRamp(spec.colors[family]))) common[`${family}-${step}`] = cssColor(color);
  }
  const shadow = (offset: number, blur: number, opacity: number) =>
    `0 ${offset * spec.shadowScale / 16}rem ${blur * spec.shadowScale / 16}rem color-mix(in srgb, var(--xp-shadow-color) ${opacity}%, transparent)`;
  common["shadow-s"] = shadow(1, 2, 6);
  common["shadow-m"] = `${shadow(4, 12, 10)}, ${shadow(1, 2, 6)}`;
  common["shadow-l"] = `${shadow(12, 32, 16)}, ${shadow(2, 6, 8)}`;
  const declarations = (values: Record<string, string | number>) => Object.entries(values).map(([name, value]) => `  --xp-${name}: ${value};`).join("\n");
  const modeCss = (mode: ThemeMode) => {
    const values = Object.fromEntries(Object.entries(resolveColors(spec, mode)).map(([name, value]) => [name, cssColor(value)]));
    // Emit aliases in each mode scope so nested themes resolve locally too.
    const aliases = Object.fromEntries(Object.keys(values).map(name => [`color-${name}`, `var(--xp-${name})`]));
    return `${declarations(values)}\n${declarations(aliases)}\n  color-scheme: ${mode};`;
  };
  const fonts = spec.fonts.webfonts.map(font => {
    if (!/^(https:\/\/|\/(?!\/))/.test(font.src)) throw new Error("Webfonts require an HTTPS or root-relative URL.");
    if (font.weight && !/^\d{1,4}( \d{1,4})?$/.test(font.weight)) throw new Error("Invalid font weight.");
    if (font.style && !["normal", "italic"].includes(font.style)) throw new Error("Invalid font style.");
    if (font.unicodeRange !== undefined) {
      const ranges = font.unicodeRange.split(",").map(range => range.trim());
      if (!ranges.every(range => {
        if (!/^U\+(?:[\da-f]{1,6}(?:-[\da-f]{1,6})?|[\da-f]{0,5}\?{1,6})$/i.test(range)) return false;
        const [start, end = start] = range.slice(2).split("-");
        const lower = parseInt(start.replace(/\?/g, "0"), 16);
        const upper = parseInt(end.replace(/\?/g, "F"), 16);
        return start.length <= 6 && lower <= upper && upper <= 0x10ffff;
      })) throw new Error("Invalid font unicode range.");
    }
    return `@font-face { font-family: ${quoted(font.family)}; src: url(${quoted(font.src)}); font-weight: ${font.weight ?? "400"}; font-style: ${font.style ?? "normal"}; font-display: swap;${font.unicodeRange ? ` unicode-range: ${font.unicodeRange};` : ""} }`;
  }).join("\n");
  return `${fonts}\n:root {\n${declarations(common)}\n${modeCss("light")}\n}\n[data-theme=dark] {\n${modeCss("dark")}\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n${modeCss("dark")}\n  }\n}\n`;
}
