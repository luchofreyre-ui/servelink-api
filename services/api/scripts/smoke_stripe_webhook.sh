#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "=== Servelink Stripe Webhook Smoke Test ==="
echo "BASE_URL = $BASE_URL"
echo

echo "1) POST /api/v1/webhooks/stripe ..."
RES="$(curl -s -X POST "$BASE_URL/api/v1/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"payment_intent.succeeded"}')"

echo "   Response: $RES"

OK="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.ok===true ? "true":"false");' "$RES")"
TYPE="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j?.received?.event_type || "");' "$RES")"

if [ "$OK" != "true" ]; then
  echo
  echo "❌ FAIL: expected ok=true"
  exit 1
fi

if [ "$TYPE" != "payment_intent.succeeded" ]; then
  echo
  echo "❌ FAIL: expected received.event_type=payment_intent.succeeded (got: $TYPE)"
  exit 1
fi

echo
echo "✅ SMOKE TEST PASS"
