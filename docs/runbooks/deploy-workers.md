# Deploy Workers

Status: live since 2026-09-05 at https://xs_boilerplate.milkies.work (Worker `xpresso-boilerplate`, proxied AAAA `100::`). Tooling verified locally and in production.

## Deploy

Run from the repository root with Node 22+, pnpm 10, dependencies installed, and the workspace packages built (`pnpm -r build` on a fresh checkout). Wrangler is pinned in both the root and `apps/web/package.json` so root-level `npx` resolves the installed version instead of downloading a release.

Supply `CLOUDFLARE_API_TOKEN` through the process environment using your secret manager. It needs Workers Scripts edit and zone Workers Routes edit permissions for deployment; DNS edit for the DNS step in zone `78d2442920a4612b381ca27fd643082b`. Supply `CLOUDFLARE_ACCOUNT_ID` in the environment if account selection is needed.

```bash
scripts/deploy.sh
scripts/ensure_dns.sh
curl -sI https://xs_boilerplate.milkies.work/
curl -sI https://xs_boilerplate.milkies.work/inbox
```

Deployment replaces Worker `xpresso-boilerplate` and its assets at route `xs_boilerplate.milkies.work/*`. Record Wrangler's version/deployment IDs for rollback. Both HTTP checks must return 200 and the CSP, nosniff, and referrer policy headers before marking the site live in README.

## DNS

`ensure_dns.sh` requires bash, curl and jq. It creates proxied AAAA `100::` with automatic TTL for `xs_boilerplate.milkies.work`. Repeated runs leave the correct record unchanged. Conflicting A, AAAA or CNAME records cause an error without modifying them. API, HTTP and JSON failures stop the script. Run serially; simultaneous invocations are not coordinated.

This address is a routing placeholder for the Worker, not an origin server. To undo a first activation, the Operator removes only the newly created DNS record. Worker rollback does not undo DNS changes.

## Rollback

From the repository root, use the pinned Wrangler:

```bash
export PATH="$PWD/apps/web/node_modules/.bin:$PATH"
npx wrangler rollback -c apps/web/wrangler.toml
# Or select a previously recorded version:
npx wrangler rollback VERSION_ID -c apps/web/wrangler.toml
```

Rollback restores a previous Worker version and its assets. It requires an earlier deployed version; the first deployment has no predecessor. Repeat the two HTTP checks afterwards. DNS and local Git files are unchanged.

## Serving policy

`run_worker_first = true` ensures the security headers apply to static assets as well as navigation responses ([Cloudflare routing documentation](https://developers.cloudflare.com/workers/static-assets/binding/)). The ASSETS binding supplies the Vite `dist` output and SPA fallback. Hashed files under `/assets/` receive one-year immutable caching; HTML revalidates. The CSP permits same-origin resources and Google Fonts; inline styles support the app's runtime theme variables.

`script-src` is `'self'` plus one `sha256` hash per inline script in `index.html`, and never `'unsafe-inline'`. Today that is exactly one script: the theme bootstrap, which has to run before the first paint so a dark-mode reader is not shown a light frame. `apps/web/scripts/csp-hashes.mjs` derives the hashes from `index.html` and writes `apps/web/src/csp-hashes.ts`, which `apps/web/src/csp.ts` composes into the header; `pnpm --filter web build` runs the generator first, so a deployment cannot carry a stale hash. Editing the inline script without rebuilding is caught by `apps/web/tests/csp.test.mjs`, which fails when the committed module drifts from the HTML.

A hash and `'unsafe-inline'` are alternatives rather than a fallback pair: any browser that understands hashes ignores `'unsafe-inline'` in the same directive. So a browser too old for hashes blocks the bootstrap and falls back to the app setting the theme after mount, which is the pre-#76 behaviour and not a security hole.

After a deploy, confirm the header names a hash and that nothing is blocked:

```bash
curl -sI https://xs_boilerplate.milkies.work/ | grep -io "script-src[^;]*"
# Against a local wrangler dev, with the port you chose:
XP_BASE_URL=http://127.0.0.1:8791 pnpm --filter web test:browser:csp
```

## Secrets policy

Tokens only enter the process environment, never files, Git, dotenv files, shell history, command arguments, or pasted logs. Do not enable shell tracing. The DNS script passes its authorization header through stdin and does not print API response bodies. Do not commit Wrangler caches or generated build output.

## Local verification without credentials

Use an empty temporary XDG config directory and isolate the legacy `~/.wrangler` lookup too (the builder used a temporary Node preload overriding `os.homedir()` to that empty directory). Unset Cloudflare authentication environment variables, set `CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false`, and disable Wrangler telemetry (`WRANGLER_SEND_METRICS=false`). These checks do not deploy or configure DNS:

```bash
export PATH="$PWD/apps/web/node_modules/.bin:$PATH"
pnpm --filter web build
npx wrangler deploy -c apps/web/wrangler.toml --dry-run --outdir /tmp/xp-wrangler-dry
npx wrangler dev -c apps/web/wrangler.toml --port 8787
# In another terminal, run both curl checks against http://127.0.0.1:8787.
# Stop Wrangler with Ctrl-C afterwards.
bash -n scripts/ensure_dns.sh
env -u CLOUDFLARE_API_TOKEN bash scripts/ensure_dns.sh # expected nonzero
```
