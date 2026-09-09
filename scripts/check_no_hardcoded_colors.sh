#!/usr/bin/env bash
# Local CI gate (also run by web:test); no GitHub Actions required.
# The scan itself lives in the Node beside this file: excluding comment text without blinding the
# gate needs a real scanner, and TypeScript's own is already a dependency of the app.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/check_no_hardcoded_colors.mjs "$@"
