import { pwa } from "../src/app-modules";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { resolveColors, srgbHex } from "@xp/theme";
import { presets } from "@xp/theme/presets";
import { buildManifest, deployOrigin, webAppId } from "../scripts/generate-pwa-assets.mts";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const manifest = JSON.parse(read("public/manifest.webmanifest"));

function pngSize(name) {
  const bytes = readFileSync(new URL("../public/pwa/" + name, import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", name);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

test("the committed manifest is exactly what the generator produces", () => {
  // Regenerating must be a no-op, so the manifest can never drift from the theme.
  assert.equal(read("public/manifest.webmanifest"), buildManifest());
});

test("the manifest is installable and describes the registered app routes", () => {
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.display_override, ["window-controls-overlay", "standalone"]);
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.ok(manifest.name && manifest.short_name);
  for (const purpose of ["any", "maskable"]) {
    const sizes = manifest.icons.filter(icon => icon.purpose === purpose).map(icon => icon.sizes).sort();
    assert.deepEqual(sizes, ["192x192", "512x512"], purpose);
  }
  assert.deepEqual(manifest.shortcuts.map(shortcut => shortcut.url), pwa.shortcuts.map(shortcut => shortcut.url));
  assert.deepEqual(manifest.screenshots.map(shot => shot.form_factor), pwa.screenshots.map(shot => shot.formFactor));
  for (const shot of manifest.screenshots) assert.ok(shot.label, shot.src);
  // The self-reference navigator.getInstalledRelatedApps() matches an install against.
  assert.deepEqual(manifest.related_applications, deployOrigin() ? [{
    platform: "webapp", url: "/manifest.webmanifest", id: webAppId(),
  }] : []);
  assert.equal("prefer_related_applications" in manifest, false, "a related app must not replace the install");
});

test("the related-app id is the manifest id resolved against the deployed origin", () => {
  // Desktop Chromium matches on this absolute web app id, which the top-level `id`
  // does not substitute for; a relative value there can never match an install.
  if (!deployOrigin()) { assert.deepEqual(manifest.related_applications, []); return; }
  const [related] = manifest.related_applications;
  assert.equal(related.id, new URL(manifest.id, deployOrigin() + "/").href);
  assert.equal(related.id, deployOrigin() + "/");
  assert.equal(new URL(related.id).origin, deployOrigin(), "the id must name the origin the app is served from");
  assert.equal(new URL(JSON.parse(read("project.json")).deployOrigin).origin, deployOrigin());
});

test("manifest colours come from the theme tokens, not from literals", () => {
  const light = resolveColors(presets.graphite, "light");
  assert.equal(manifest.theme_color, srgbHex(light["surface-raised"]));
  assert.equal(manifest.background_color, srgbHex(light.surface));
});

test("every declared image exists at its declared pixel size", () => {
  for (const asset of [...manifest.icons, ...manifest.screenshots]) {
    assert.equal(pngSize(asset.src.replace("/pwa/", "")), asset.sizes, asset.src);
  }
  assert.equal(pngSize("apple-touch-icon-180.png"), "180x180");
});

test("index.html carries the per-device metas and no literal colour", () => {
  const html = read("index.html");
  assert.match(html, /content="width=device-width, initial-scale=1\.0, viewport-fit=cover"/);
  assert.match(html, /<meta name="color-scheme" content="light dark" \/>/);
  for (const mode of ["light", "dark"]) {
    // Values are filled at run time from the tokens, so the attribute ships empty.
    assert.match(html, new RegExp(`<meta name="theme-color" media="\\(prefers-color-scheme: ${mode}\\)" content="" />`));
  }
  for (const meta of ["mobile-web-app-capable", "apple-mobile-web-app-capable", "apple-mobile-web-app-status-bar-style", "apple-mobile-web-app-title"]) {
    assert.match(html, new RegExp(`<meta name="${meta}"`), meta);
  }
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180"/);
  // Local Inter subsets need a preload, but no unused Google font connection.
  for (const origin of ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]) {
    assert.doesNotMatch(html, new RegExp(`rel="preconnect" href="${origin}"`), origin);
  }
  const withWebfonts = Object.entries(presets).filter(([, preset]) => preset.fonts.webfonts.length);
  assert.deepEqual(withWebfonts.map(([name]) => name), ["graphite"]);
  assert.match(html, /<link rel="preload" href="\/fonts\/inter-latin-wght-normal\.woff2" as="font" type="font\/woff2" crossorigin/);
  for (const font of presets.graphite.fonts.webfonts) {
    assert(font.src.startsWith("/fonts/"), "default fonts stay same-origin and offline-capable");
    assert(readFileSync(new URL(`../public${font.src}`, import.meta.url)).length > 0);
    assert(font.unicodeRange, "subset font loading requires unicode ranges");
  }
});

test("the service worker routes navigations, fonts, icons and offline documents", () => {
  const sw = read("src/pwa/sw.ts");
  assert.match(sw, /precacheAndRoute\(self\.__WB_MANIFEST\)/);
  assert.match(sw, /new NavigationRoute\(new StaleWhileRevalidate\(/);
  assert.equal(sw.match(/new CacheFirst\(/g).length, 2);
  assert.match(sw, /request\.destination === "font"/);
  assert.match(sw, /url\.pathname\.startsWith\("\/pwa\/"\)/);
  // Cache-first is limited to names a deployment replaces; a bare image destination is not one.
  assert.doesNotMatch(sw, /request\.destination === "image"/);
  assert.match(sw, /hashedImage\.test\(url\.pathname\)/);
  assert.match(sw, /setCatchHandler/);
  assert.match(sw, /matchPrecache\(offlineFallback\)/);
  // registerType "autoUpdate" needs the worker to take over on its own.
  assert.match(sw, /self\.skipWaiting\(\);/);
  assert.match(sw, /clientsClaim\(\);/);
});

test("the plugin builds our worker and leaves the manifest to the generator", () => {
  const config = read("vite.config.ts");
  assert.match(config, /strategies: "injectManifest"/);
  assert.match(config, /registerType: "autoUpdate"/);
  assert.match(config, /filename: "sw\.ts"/);
  assert.match(config, /manifest: false/);
});

test("font caching intercepts only same-origin fonts, leaving remote fonts to the page CSP", () => {
  const matcher = read("src/pwa/sw.ts").match(/(\(\{ request, url, sameOrigin \}\) => [^\n]+),\n/)[1];
  const matches = new Function("return " + matcher)();
  for (const [destination, path, font] of [["font", "/dynamic", true], ["", "/fonts/inter.woff2", true], ["", "/image.png", false]]) {
    for (const sameOrigin of [true, false]) {
      assert.equal(matches({ request: { destination }, url: new URL(path, "https://example.test"), sameOrigin }), sameOrigin && font);
    }
  }
});

test("PWA documentation describes Graphite's shipped and precached font subsets", () => {
  const doc = readFileSync(new URL("../../../docs/engineering/pwa.md", import.meta.url), "utf8");
  assert.doesNotMatch(doc, /every built-in preset ships an empty/);
  for (const face of presets.graphite.fonts.webfonts) assert(doc.includes(face.src));
  assert.match(doc, /preload/);
  assert.match(doc, /precache/);
});

test("the install hook asks Chromium whether the app is already installed", () => {
  const hook = read("src/pwa/usePwaInstall.ts");
  assert.match(hook, /getInstalledRelatedApps/);
  assert.match(hook, /app\.platform === "webapp"/);
});

test("the shell spends the safe-area insets and kills touch latency", () => {
  const css = read("src/shell/shell.css");
  for (const side of ["top", "right", "bottom", "left"]) {
    assert.match(css, new RegExp(`--xp-safe-${side}: env\\(safe-area-inset-${side}, 0px\\);`), side);
  }
  assert.match(css, /block-size: 100svh; block-size: 100dvh/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /-webkit-tap-highlight-color: transparent/);
  for (const surface of ['workspace-content', 'workspace-sidebar-navigation', 'route-list', 'route-detail', 'route-inspector']) {
    assert.match(css, new RegExp(`\\.${surface}\\s*\\{[^}]*overscroll-behavior: contain`), `${surface} contains its own overscroll`);
  }
  assert.match(css, /padding-block-start: calc\(var\(--space-3xs\) \+ var\(--xp-safe-top\)\)/);
});
