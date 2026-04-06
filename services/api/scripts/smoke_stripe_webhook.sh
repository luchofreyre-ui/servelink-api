#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "=== Servelink Stripe Webhook Smoke Test ==="
echo "BASE_URL = $BASE_URL"
echo

echo "1) Legacy POST /api/v1/webhooks/stripe must not exist (404) ..."
LEGACY_CODE="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"payment_intent.succeeded"}')"

if [ "$LEGACY_CODE" != "404" ]; then
  echo "   ❌ FAIL: expected HTTP 404 for removed legacy route (got $LEGACY_CODE)"
  exit 1
fi
echo "   HTTP $LEGACY_CODE (expected 404)"

echo
echo "2) Canonical POST /api/v1/stripe/webhook is reachable (expects error without valid Stripe signature) ..."
# Without stripe-signature the handler returns a structured failure — not 404.
CANONICAL_CODE="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"payment_intent.succeeded"}')"

if [ "$CANONICAL_CODE" = "404" ]; then
  echo "   ❌ FAIL: canonical route returned 404"
  exit 1
fi
echo "   HTTP $CANONICAL_CODE (not 404 — route registered)"

echo
echo "✅ SMOKE TEST PASS"
