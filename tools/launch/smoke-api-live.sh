#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?Usage: ./tools/launch/smoke-api-live.sh <api-base-url>}"

echo "==> API health"
curl -fsSL "${BASE_URL}/api/v1/system/health"

echo
echo "==> API readiness"
curl -fsSL "${BASE_URL}/api/v1/system/readiness"

echo
echo "==> API docs"
curl -fsSL "${BASE_URL}/docs" >/dev/null

echo
echo "==> API smoke complete"
