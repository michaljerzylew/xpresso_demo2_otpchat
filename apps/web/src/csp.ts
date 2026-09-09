import { inlineScriptHashes } from "./csp-hashes";

/**
 * The response CSP, assembled from a fixed policy plus the hashes of the inline
 * scripts `index.html` actually ships (`scripts/csp-hashes.mjs`).
 *
 * `script-src` never gains `'unsafe-inline'`: the theme bootstrap has to run before
 * the first paint, and a hash buys exactly that one script rather than every script
 * an injection could add. A browser that understands hashes ignores `'unsafe-inline'`
 * in the same directive anyway, so the two are alternatives, not a fallback pair.
 */
export function buildCsp(hashes: readonly string[]): string {
  const scriptSrc = ["'self'", ...hashes.map(hash => `'${hash}'`)].join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "connect-src 'self'",
    // Vite injects the theme's style rules at run time, which no hash can cover.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    // 'self', not 'none': the device simulator and the configurator's preview strip frame this
    // same origin, and in production 'none' would refuse both. Foreign embedding stays blocked.
    "frame-ancestors 'self'",
  ].join("; ");
}

export const CSP = buildCsp(inlineScriptHashes);
