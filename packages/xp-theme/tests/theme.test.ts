import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { compileTheme, checkContrast, resolveColors, textBackgroundPairs, type ThemeSpec } from "../src/theme";
import { contrastRatio, generateRamp, rampSteps, linearRgb, srgbHex, toGamut } from "../src/colors";
import { presets } from "../src/presets";

describe("preset compilation", () => {
  it.each(Object.entries(presets))("%s has complete modes and AA text pairs", (_name, spec) => {
    const css = compileTheme(spec);
    expect(css).toContain(":root {");
    expect(css).toContain("[data-theme=dark]");
    expect(css).toContain("prefers-color-scheme: dark");
    expect(checkContrast(spec)).toEqual([]);
    expect(Object.keys(resolveColors(spec, "light"))).toEqual(Object.keys(resolveColors(spec, "dark")));
    for (const name of Object.keys(resolveColors(spec, "light"))) {
      // Root light, explicit dark and OS dark each need locally resolved aliases.
      expect(css.split(`--xp-color-${name}: var(--xp-${name});`)).toHaveLength(4);
    }
    expect(textBackgroundPairs).toHaveLength(36);
    expect(css).not.toMatch(/NaN|undefined/);
  });

  it("generates monotone, in-gamut ramps even for high chroma seeds", () => {
    for (const hue of [0, 60, 120, 180, 240, 300]) {
      const ramp = generateRamp({ hue, chroma: 0.4 });
      const tones = rampSteps.map(step => ramp[step]);
      expect(tones).toHaveLength(11);
      tones.forEach((color, i) => {
        expect(color.h).toBe(hue);
        expect(linearRgb(color).every(v => v >= -1e-7 && v <= 1.0000001)).toBe(true);
        if (i) expect(color.l).toBeLessThan(tones[i - 1].l);
      });
    }
  });

  it("keeps mode overrides independent and reports the affected pairs", () => {
    const spec: ThemeSpec = { ...presets.graphite, overrides: { dark: { ink: { l: 0.15, c: 0, h: 0 }, surface: { l: 0.15, c: 0, h: 0 } } } };
    expect(resolveColors(spec, "light")).toEqual(resolveColors(presets.graphite, "light"));
    expect(checkContrast(spec)).toContainEqual({ mode: "dark", text: "ink", background: "surface", ratio: 1, minimum: 4.5 });
    expect(checkContrast(spec).every(failure => failure.mode === "dark")).toBe(true);
  });

  it("uses WCAG linear-light luminance, including the unrounded 4.5 boundary", () => {
    const black = { l: 0, c: 0, h: 0 };
    const white = { l: 1, c: 0, h: 0 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 6);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 6);
    const spec: ThemeSpec = { ...presets.mono, overrides: { light: { surface: white, ink: { l: Math.cbrt(1.05 / 4.499 - 0.05), c: 0, h: 0 } } } };
    expect(checkContrast(spec, [["ink", "surface"]])[0].ratio).toBeCloseTo(4.499, 5);
    spec.overrides!.light!.ink!.l = Math.cbrt(1.05 / 4.501 - 0.05);
    expect(checkContrast(spec, [["ink", "surface"]])).toEqual([]);
  });

  it("compiles font faces, safe quoted stacks and all metric controls", () => {
    const spec: ThemeSpec = { ...presets.paper, spacingScale: 1.5, radiusScale: 0, shadowScale: 2, density: 0.8,
      fonts: { ...presets.paper.fonts, sans: ["Example Sans", "sans-serif"], webfonts: [{ family: "Example Sans", src: "/fonts/example.woff2", weight: "100 900" }] } };
    const css = compileTheme(spec);
    expect(css).toContain('--xp-font-sans: "Example Sans", sans-serif;');
    expect(css).toContain('src: url("/fonts/example.woff2")');
    expect(css).toContain("font-display: swap");
    expect(css).toContain("--xp-space-scale: 1.5;");
    expect(css).toContain("--xp-radius-scale: 0;");
    expect(css).toContain("--xp-density-factor: 0.8;");
    expect(css).toContain("--xp-shadow-s: 0 0.125rem 0.25rem color-mix(in srgb, var(--xp-shadow-color) 6%, transparent);");
    expect(css).toContain("--xp-shadow-m: 0 0.5rem 1.5rem color-mix(in srgb, var(--xp-shadow-color) 10%, transparent), 0 0.125rem 0.25rem color-mix(in srgb, var(--xp-shadow-color) 6%, transparent);");
    expect(css).toContain("--xp-shadow-l: 0 1.5rem 4rem color-mix(in srgb, var(--xp-shadow-color) 16%, transparent), 0 0.25rem 0.75rem color-mix(in srgb, var(--xp-shadow-color) 8%, transparent);");
  });

  it("emits local subset font faces and rejects malformed or injected unicode ranges", () => {
    const css = compileTheme(presets.graphite);
    expect(css).toContain('src: url("/fonts/inter-latin-wght-normal.woff2")');
    expect(css).toContain("unicode-range: U+0000-00FF,");
    const withRange = (unicodeRange: string): ThemeSpec => ({ ...presets.graphite,
      fonts: { ...presets.graphite.fonts, webfonts: [{ family: "Inter", src: "/fonts/inter.woff2", unicodeRange }] } });
    expect(compileTheme(withRange("U+4??, U+0100-02FF"))).toContain("unicode-range: U+4??, U+0100-02FF;");
    for (const range of ["", "U+FFF-000", "U+110000", "U+??????", "U+00FF; color: red", "U+0000,"]) {
      expect(() => compileTheme(withRange(range))).toThrow("Invalid font unicode range.");
    }
  });

  it("rejects invalid values instead of silently emitting broken CSS", () => {
    expect(() => compileTheme({ ...presets.graphite, spacingScale: NaN })).toThrow();
    expect(() => compileTheme({ ...presets.graphite, density: 0 })).toThrow();
    expect(() => generateRamp({ hue: Infinity, chroma: 0.1 })).toThrow();
    expect(() => compileTheme({ ...presets.graphite, fonts: { ...presets.graphite.fonts, webfonts: [{ family: "Bad", src: "javascript:alert(1)" }] } })).toThrow();
  });

  it("builds metric adapters from the existing fluid source and semantic-only Tailwind colors", () => {
    const css = readFileSync(new URL("../dist/theme.css", import.meta.url), "utf8");
    expect(css).toMatch(/--space-m: calc\(\(clamp\(.+cqi.+\)\) \* var\(--xp-space-scale, 1\)\)/);
    expect(css).toMatch(/--radius-s: calc\(\(clamp\(.+cqi.+\)\) \* var\(--xp-radius-scale, 1\)\)/);
    expect(css).toContain("1200px <= width < 1600px");
    expect(css).not.toContain("--text-step-");
    const tailwind = readFileSync(new URL("../dist/tailwind.css", import.meta.url), "utf8");
    expect(tailwind).toContain("@theme inline");
    expect(tailwind).toContain("--color-*: initial");
    expect(tailwind).toContain("--color-primary: var(--xp-primary)");
    expect(tailwind).toContain("--font-sans: var(--xp-font-sans)");
  });
});

describe("sRGB hex projection", () => {
  it("matches the ramp's own luminance and stays inside the byte range", () => {
    for (const spec of Object.values(presets)) for (const mode of ["light", "dark"] as const) {
      for (const color of Object.values(resolveColors(spec, mode))) {
        const hex = srgbHex(color);
        expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        const decoded = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
          .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
        const expected = linearRgb(toGamut(color)).map(value => Math.max(0, Math.min(1, value)));
        for (const [index, channel] of decoded.entries()) expect(Math.abs(channel - expected[index])).toBeLessThan(0.01);
      }
    }
  });

  it("projects the ramp poles onto the sRGB extremes", () => {
    expect(srgbHex({ l: 0, c: 0, h: 0 })).toBe("#000000");
    expect(srgbHex({ l: 1, c: 0, h: 0 })).toBe("#ffffff");
  });
});
