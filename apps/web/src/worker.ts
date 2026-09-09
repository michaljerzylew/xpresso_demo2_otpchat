import { CSP } from './csp';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Workers assets supplies the SPA fallback configured in wrangler.toml.
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('Content-Security-Policy', CSP);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const pathname = new URL(request.url).pathname;
    const type = response.headers.get('Content-Type');
    if (pathname === '/sw.js') {
      // A stale worker script cannot be replaced by a new deployment, so it never caches.
      response.headers.set('Cache-Control', 'no-cache');
      response.headers.set('Service-Worker-Allowed', '/');
    } else if (pathname === '/manifest.webmanifest') {
      // Installability depends on this parsing as a manifest, whatever the asset server guessed.
      response.headers.set('Content-Type', 'application/manifest+json; charset=utf-8');
      response.headers.set('Cache-Control', 'no-cache');
    } else if (response.status === 200 && /^\/assets\/.+-[\w-]{8,}\.[\w]+$/.test(pathname)
      && !type?.includes('text/html')) {
      // Never give the SPA fallback a year-long cache, even at an asset-like URL.
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (response.status === 200 && pathname.startsWith('/pwa/')) {
      // Icons and screenshots keep stable names, so a deployment must be able to replace them.
      response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else if (type?.includes('text/html')) {
      response.headers.set('Cache-Control', 'no-cache');
    }
    return response;
  },
};
