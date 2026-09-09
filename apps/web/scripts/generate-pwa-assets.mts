import { pwa } from "../src/app-modules";
/**
 * Generates every committed PWA asset from two sources of truth: the theme preset
 * that compiles `@xp/theme/theme.css`, and `apps/web/brand/icon.svg`. Nothing here
 * hardcodes a colour, so changing the preset and re-running this script moves the
 * manifest, the icons and the install UI together.
 *
 *   pnpm --filter web pwa:assets                 # icons + manifest
 *   pnpm --filter web pwa:assets --screenshots   # also re-cut manifest screenshots
 *
 * Screenshots come from the browser evidence suite (`pnpm --filter web evidence`),
 * so the images the install dialog shows are the same ones the review looked at.
 * Rasterisation uses system Chrome through Playwright: no image dependency, and the
 * bytes come from the same engine that renders the app.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";
import { resolveColors, srgbHex } from "@xp/theme";
import { presets } from "@xp/theme/presets";

// The preset the theme package compiles into theme.css. Keep the two in step.
const spec = presets.graphite;
const light = resolveColors(spec, "light");
const dark = resolveColors(spec, "dark");
const plate = srgbHex(light.primary);
const mark = srgbHex(light["on-primary"]);

const app = new URL("../", import.meta.url);
const iconDirectory = new URL("public/pwa/", app);
const evidence = new URL("evidence/", app);
mkdirSync(fileURLToPath(iconDirectory), { recursive: true });
const source = readFileSync(new URL("brand/icon.svg", app), "utf8");

/** The manifest `id` the app declares; the resolved form is what identifies an install. */
const manifestId = "/";

/** Public origin for install matching; configure before deployment. */
export function deployOrigin(): string {
  const project = JSON.parse(readFileSync(new URL("project.json", app), "utf8"));
  return project.deployOrigin ? new URL(project.deployOrigin).origin : "";
}

/**
 * The web app id Chromium matches an install against: the manifest `id` resolved
 * against the origin, which is exactly what the browser computes for itself.
 */
export function webAppId(): string {
  return new URL(manifestId, deployOrigin() + "/").href;
}

type IconSpec = { file: string; size: number; corner: number; markScale: number; transparent: boolean };
const icons: IconSpec[] = [
  { file: "icon-192.png", size: 192, corner: 96, markScale: 1, transparent: true },
  { file: "icon-512.png", size: 512, corner: 96, markScale: 1, transparent: true },
  // Maskable icons are full-bleed; the mark stays inside the 80% safe zone.
  { file: "icon-maskable-192.png", size: 192, corner: 0, markScale: 0.62, transparent: false },
  { file: "icon-maskable-512.png", size: 512, corner: 0, markScale: 0.62, transparent: false },
  // iOS applies its own corner mask and never honours transparency.
  { file: "apple-touch-icon-180.png", size: 180, corner: 0, markScale: 0.82, transparent: false },
];

async function rasterizeIcon(page: Page, icon: IconSpec): Promise<void> {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<style>
    html, body { margin: 0; padding: 0; background: transparent; }
    svg {
      display: block; width: ${icon.size}px; height: ${icon.size}px;
      --icon-background: ${plate}; --icon-mark: ${mark};
      --icon-corner: ${icon.corner}; --icon-mark-scale: ${icon.markScale};
    }
  </style>${source}`);
  await page.locator("svg").screenshot({
    path: fileURLToPath(new URL(icon.file, iconDirectory)),
    omitBackground: icon.transparent,
  });
}

type ShotSpec = { file: string; from: string; formFactor: "wide" | "narrow"; label: string };
const shots: ShotSpec[] = pwa.screenshots;

/** The declared sizes are read back from the bytes, so the manifest cannot lie about them. */
function pngSize(file: URL): string {
  const bytes = readFileSync(file);
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") throw new Error(`${fileURLToPath(file)} is not a PNG.`);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

/** Captured at the target viewport by the evidence suite, so nothing is resampled here. */
function copyShot(shot: ShotSpec): void {
  const origin = new URL(shot.from, evidence);
  if (!existsSync(origin)) {
    throw new Error(`Missing ${fileURLToPath(origin)}. Run: XP_BROWSER_CHANNEL=chrome pnpm --filter web evidence`);
  }
  copyFileSync(origin, new URL(shot.file, iconDirectory));
}

export function buildManifest(): string {
  const shortcut = [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }];
  const manifest = {
    id: manifestId,
    name: "xpresso_demo2_otpchat",
    short_name: "xpresso_demo2_otpchat",
    description: pwa.description,
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    // Address bar and splash colours resolved from the theme's light mode; the
    // per-mode <meta name="theme-color"> pair in index.html overrides this in the
    // browser UI, which the manifest format cannot express on its own.
    theme_color: srgbHex(light["surface-raised"]),
    background_color: srgbHex(light.surface),
    categories: ["productivity", "business"],
    // The self-reference navigator.getInstalledRelatedApps() matches an install against.
    // `url` stays relative so it resolves against whatever origin serves the manifest;
    // `id` must be the absolute web app id, which desktop Chromium requires and the
    // top-level `id` above does not substitute for. prefer_related_applications stays
    // absent, so nothing displaces the browser's own install flow.
    related_applications: deployOrigin() ? [{ platform: "webapp", url: "/manifest.webmanifest", id: webAppId() }] : [],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: pwa.shortcuts.map(link => ({ ...link, icons: shortcut })),
    screenshots: shots.map(shot => ({
      src: `/pwa/${shot.file}`,
      sizes: pngSize(new URL(shot.file, iconDirectory)),
      type: "image/png",
      form_factor: shot.formFactor,
      label: shot.label,
    })),
  };
  return JSON.stringify(manifest, null, 2) + "\n";
}

/** Dark-mode values live only in the runtime metas; expose them so tests can compare. */
export const themeColors = {
  light: srgbHex(light["surface-raised"]),
  dark: srgbHex(dark["surface-raised"]),
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const withScreenshots = process.argv.includes("--screenshots");
  if (withScreenshots) for (const shot of shots) copyShot(shot);
  // Imported here so tests can reuse buildManifest() without launching a browser.
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ channel: process.env.XP_BROWSER_CHANNEL ?? "chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
    for (const icon of icons) await rasterizeIcon(page, icon);
    // ICO supports a PNG payload. Reuse the PWA mark for legacy /favicon.ico requests.
    const png = readFileSync(new URL("icon-192.png", iconDirectory));
    const header = Buffer.alloc(22);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header[6] = header[7] = 192;
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    await writeFile(new URL("public/favicon.ico", app), Buffer.concat([header, png]));
    await page.close();
  } finally {
    await browser.close();
  }
  await writeFile(new URL("public/manifest.webmanifest", app), buildManifest());
  console.log(`PWA assets: ${icons.length} icons${withScreenshots ? ` + ${shots.length} screenshots` : ""} + manifest.webmanifest (theme ${themeColors.light} / ${themeColors.dark}).`);
}
