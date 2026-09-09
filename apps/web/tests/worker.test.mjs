import assert from 'node:assert/strict';
import { test } from 'vitest';
import worker from '../src/worker.ts';

test('security headers wrap the asset response without losing its body or metadata', async () => {
  const response = await worker.fetch(new Request('https://example.com/inbox'), {
    ASSETS: { fetch: async () => new Response('app', { headers: { 'Content-Type': 'text/html', ETag: 'v1' } }) },
  });
  assert.equal(await response.text(), 'app');
  assert.equal(response.headers.get('ETag'), 'v1');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  // The inline theme bootstrap is named by hash; tests/csp.test.mjs owns the hash itself.
  assert.match(response.headers.get('Content-Security-Policy'), /script-src 'self' 'sha256-[^']+';/);
  // The device simulator and the configurator's preview strip frame this origin (#41), so only
  // foreign embedding is refused.
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'self'$/);
  assert.equal(response.headers.get('Cache-Control'), 'no-cache');
});

test('the service worker and the manifest are served so a deployment can replace them', async () => {
  const serve = (path, type) => worker.fetch(new Request(`https://example.com${path}`), {
    ASSETS: { fetch: async () => new Response('asset', { headers: { 'Content-Type': type } }) },
  });

  const sw = await serve('/sw.js', 'text/javascript');
  assert.equal(sw.headers.get('Cache-Control'), 'no-cache');
  assert.equal(sw.headers.get('Service-Worker-Allowed'), '/');
  // The worker script and the manifest must both survive the CSP.
  for (const directive of [/worker-src 'self';/, /manifest-src 'self';/, /connect-src 'self';/]) {
    assert.match(sw.headers.get('Content-Security-Policy'), directive);
  }

  const manifest = await serve('/manifest.webmanifest', 'text/plain');
  assert.equal(manifest.headers.get('Content-Type'), 'application/manifest+json; charset=utf-8');
  assert.equal(manifest.headers.get('Cache-Control'), 'no-cache');

  const icon = await serve('/pwa/icon-512.png', 'image/png');
  assert.equal(icon.headers.get('Cache-Control'), 'public, max-age=3600, must-revalidate');
});

test('only successful hashed non-HTML assets receive immutable caching', async () => {
  for (const [path, type, status, immutable] of [
    ['/assets/index-Ab12_cd3.js', 'text/javascript', 200, true],
    ['/assets/index-Ab12_cd3.css', 'text/css', 200, true],
    ['/assets/missing-Ab12_cd3.js', 'text/html', 200, false],
    ['/assets/index-Ab12_cd3.js', 'text/plain', 404, false],
    ['/assets/plain.js', 'text/javascript', 200, false],
  ]) {
    const response = await worker.fetch(new Request(`https://example.com${path}`), {
      ASSETS: { fetch: async () => new Response('body', { status, headers: { 'Content-Type': type } }) },
    });
    assert.equal(response.headers.get('Cache-Control')?.includes('immutable') ?? false, immutable, `${path} ${type} ${status}`);
    assert.equal(response.status, status);
  }
});
