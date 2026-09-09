#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Wrangler is also pinned at the root for this root-level npx command.
pnpm --filter web build && npx wrangler deploy -c apps/web/wrangler.toml
