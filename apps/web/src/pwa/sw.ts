/// <reference lib="webworker" />
/**
 * Workbox service worker, built by vite-plugin-pwa's injectManifest strategy.
 * Explicit routing beats a generated worker here: the navigation strategy, the
 * font/icon strategy and the offline fallback are each named in Issue #39, and a
 * generateSW config cannot express a stale-while-revalidate navigation route.
 */
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

/** Precached document that answers any navigation the network and cache both miss. */
const offlineFallback = "/index.html";
const day = 60 * 60 * 24;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// registerType "autoUpdate": the new worker takes over immediately, and the page
// asks for a reload through the toast instead of reloading under someone's hands.
self.skipWaiting();
clientsClaim();

// Navigations: the last good document paints at once, the network refreshes it.
registerRoute(new NavigationRoute(new StaleWhileRevalidate({
  cacheName: "xp-navigations",
  plugins: [new CacheableResponsePlugin({ statuses: [200] })],
}), {
  denylist: [/^\/api\//],
}));

// Cache local fonts only. Remote fonts use the page's font-src policy, not the
// worker's connect-src policy, which deliberately allows only this origin.
registerRoute(
  ({ request, url, sameOrigin }) => sameOrigin && (request.destination === "font" || /\.(?:woff2?|ttf|otf)$/.test(url.pathname)),
  new CacheFirst({
    cacheName: "xp-fonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 365 * day, purgeOnQuotaError: true }),
    ],
  }),
);

/**
 * Hashed build images. The name changes whenever the bytes do, so cache-first can
 * never serve a stale one; anything else (a proxied avatar, an unversioned upload)
 * is left to the network rather than frozen for 30 days by `destination === "image"`.
 */
const hashedImage = /^\/assets\/.+-[\w-]{8,}\.(?:png|jpe?g|gif|svg|webp|avif|ico)$/;

// Our own icons and manifest screenshots, plus hashed build images: stable or
// content-addressed names, both replaced by a deployment rather than edited in place.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && (url.pathname.startsWith("/pwa/") || hashedImage.test(url.pathname)),
  new CacheFirst({
    cacheName: "xp-icons",
    plugins: [
      // Same-origin only, so an opaque response is not reachable here.
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * day, purgeOnQuotaError: true }),
    ],
  }),
);

setCatchHandler(async ({ request }) => {
  if (request.destination === "document" || request.mode === "navigate") {
    return await matchPrecache(offlineFallback) ?? Response.error();
  }
  return Response.error();
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
