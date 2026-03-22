#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:?Usage: ./tools/launch/smoke-launch.sh <api-base-url> <web-base-url>}"
WEB_URL="${2:?Usage: ./tools/launch/smoke-launch.sh <api-base-url> <web-base-url>}"

./tools/launch/smoke-api-live.sh "${API_URL}"
./tools/launch/smoke-web-live.sh "${WEB_URL}"

echo
echo "==> Launch smoke complete"
