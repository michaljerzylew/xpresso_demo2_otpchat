import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Issue #74: after the CSS diet the entry stylesheet is the only render-blocking
// request left on first paint, and it is small enough to travel inside the
// document. Above this size the link stays, so a stylesheet that grows again
// cannot silently bloat every HTML response instead of failing the size gate.
const inlineStylesheetLimit = 150 * 1024;

function inlineEntryStylesheet(): Plugin {
  return {
    name: "xp-inline-entry-stylesheet",
    enforce: "post",
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find(output =>
        output.type === "asset" && output.fileName.endsWith(".html") && typeof output.source === "string");
      if (html?.type !== "asset" || typeof html.source !== "string") return;
      let document = html.source;
      for (const [key, output] of Object.entries(bundle)) {
        if (output.type !== "asset" || !output.fileName.endsWith(".css")) continue;
        const css = String(output.source);
        const escaped = output.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const link = document.match(new RegExp(`<link\\b[^>]*href="/${escaped}"[^>]*>`));
        // A route-level CSS chunk has no link in the document and stays a file.
        if (!link?.[0].includes('rel="stylesheet"')) continue;
        // Inlining is a first-paint optimisation, never a correctness risk.
        if (css.length > inlineStylesheetLimit || css.includes("</style")) continue;
        document = document.replace(link[0], `<style>${css}</style>`);
        delete bundle[key];
        // Inlining removes the file the size gate used to be measured on, so the
        // build names it here and `pnpm --filter web size:css` reports it gzipped.
        this.info(`inlined ${output.fileName} into the document: ${(css.length / 1024).toFixed(1)} kB`);
      }
      html.source = document;
    },
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Settings still renders AdaptiveOverlay for PWA install help (#79).
        // Keep that dependency out of the entry without deferring Settings' form
        // arrival. This is an eager shared chunk, not a reduction in total bytes.
        onlyExplicitManualChunks: true,
        // Reserve index-* for the actual entry, including size/grep checks.
        chunkFileNames: chunk => chunk.name === "index" ? "assets/shared-[hash].js" : "assets/[name]-[hash].js",
        manualChunks(id) {
          if (id.includes("/vaul/") || id.endsWith("/xp-primitives/src/adaptive-overlay.tsx")) return "install-overlay";
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    inlineEntryStylesheet(),
    VitePWA({
      // The worker is hand-written (src/pwa/sw.ts): Issue #39 names a
      // stale-while-revalidate navigation route, which generateSW cannot express.
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "sw.ts",
      registerType: "autoUpdate",
      // The registration lives in src/pwa/register.ts so the reload toast owns it.
      injectRegister: null,
      // scripts/generate-pwa-assets.mts writes public/manifest.webmanifest from the
      // theme tokens, and index.html links it; the plugin must not emit a second one.
      manifest: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
        globIgnores: ["**/pwa/screenshot-*.png"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
});
