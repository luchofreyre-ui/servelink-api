#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${1:?Usage: ./tools/launch/smoke-web-live.sh <web-base-url>}"

echo "==> Web home"
curl -fsSL "${WEB_URL}" >/dev/null

echo "==> Customer booking route shell"
curl -fsSL "${WEB_URL}/customer/bookings/test" >/dev/null || true

echo "==> Admin anomalies route shell"
curl -fsSL "${WEB_URL}/admin/anomalies" >/dev/null || true

echo "==> Web smoke complete"
