#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://localhost:3001/api/v1}"

cd "$WEB_DIR"

echo "==> Playwright base URL: $PLAYWRIGHT_BASE_URL"
echo "==> Playwright API base URL: $PLAYWRIGHT_API_BASE_URL"
echo "==> Seeding deterministic admin scenario"

SCENARIO_JSON="$(curl -sSf "$PLAYWRIGHT_API_BASE_URL/dev/playwright/admin-scenario")"
echo "$SCENARIO_JSON" > /tmp/servelink-playwright-admin-scenario.json

if command -v jq >/dev/null 2>&1; then
  export PLAYWRIGHT_ADMIN_EMAIL="${PLAYWRIGHT_ADMIN_EMAIL:-$(jq -r '.scenario.adminEmail' /tmp/servelink-playwright-admin-scenario.json)}"
  export PLAYWRIGHT_ADMIN_PASSWORD="${PLAYWRIGHT_ADMIN_PASSWORD:-$(jq -r '.scenario.adminPassword' /tmp/servelink-playwright-admin-scenario.json)}"

  if [[ -z "${TARGET_FO_ID:-}" ]]; then
    export TARGET_FO_ID="$(jq -r '.scenario.foIds[1] // empty' /tmp/servelink-playwright-admin-scenario.json)"
  fi
fi

echo "==> Running Playwright regression suite"
npx playwright test
