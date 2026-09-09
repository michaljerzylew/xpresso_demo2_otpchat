export type Oklch = { l: number; c: number; h: number };
export type ColorSeed = { hue: number; chroma: number };

// OKLab -> linear sRGB, CSS Color 4 conversion matrices.
// https://www.w3.org/TR/css-color-4/#color-conversion-code
export function linearRgb({ l, c, h }: Oklch): number[] {
  const a = c * Math.cos(h * Math.PI / 180);
  const b = c * Math.sin(h * Math.PI / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

export function validateColor(color: Oklch): void {
  if (![color.l, color.c, color.h].every(Number.isFinite) || color.l < 0 || color.l > 1 || color.c < 0 || color.c > 0.4) {
    throw new Error("OKLCH requires finite l (0..1), c (0..0.4), and h.");
  }
}

// Reduce chroma before emitting CSS so browser gamut mapping and the guard agree.
export function toGamut(color: Oklch): Oklch {
  validateColor(color);
  const inGamut = (c: number) => linearRgb({ ...color, c }).every(v => v >= -1e-7 && v <= 1.0000001);
  if (inGamut(color.c)) return color;
  let low = 0;
  let high = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (inGamut(mid)) low = mid;
    else high = mid;
  }
  return { ...color, c: low };
}

export function contrastRatio(text: Oklch, background: Oklch): number {
  const luminance = (color: Oklch) => {
    const [r, g, b] = linearRgb(toGamut(color)).map(v => Math.max(0, Math.min(1, v)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(text);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function cssColor(color: Oklch): string {
  const { l, c, h } = toGamut(color);
  return `oklch(${l} ${c} ${h})`;
}

export const rampSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const lightness = [0.985, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.22, 0.15];

export function generateRamp(seed: ColorSeed): Record<number, Oklch> {
  return Object.fromEntries(rampSteps.map((step, index) => {
    const l = lightness[index];
    return [step, toGamut({ l, c: seed.chroma * Math.min(1, (1 - l) * 6, l * 4), h: seed.hue })];
  }));
}

/** sRGB hex for surfaces that cannot parse OKLCH: web manifests, meta tags, canvas. */
export function srgbHex(color: Oklch): string {
  const channels = linearRgb(toGamut(color)).map(value => {
    const linear = Math.max(0, Math.min(1, value));
    const encoded = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255).toString(16).padStart(2, "0");
  });
  return "#" + channels.join("");
}
