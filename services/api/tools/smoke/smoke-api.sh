#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"

echo "==> Smoke: docs"
curl -fsSL "${BASE_URL}/docs" >/dev/null

echo "==> Smoke: health-ish root"
curl -fsSL "${BASE_URL}/" >/dev/null || true

echo "==> Smoke: admin ops anomalies route (expect auth/403/401 or structured response)"
curl -i -s "${BASE_URL}/api/v1/admin/ops/anomalies" | head -n 20

echo "==> Smoke complete"
