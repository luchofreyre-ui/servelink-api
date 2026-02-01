#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3001"

echo "== register user =="
AUTH=$(curl -s -X POST "$BASE/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"booking_smoke_$(date +%s)@servelink.local\",\"phone\":\"+1555$(date +%S)00000\",\"password\":\"Password123!\"}")

TOKEN=$(echo "$AUTH" | jq -r '.access_token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: token not returned"
  echo "$AUTH"
  exit 1
fi

echo "== create booking =="
BOOKING_ID=$(curl -s -X POST "$BASE/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: smoke-booking-1" \
  -d '{"note":"created"}' | jq -r '.id')

if [ -z "$BOOKING_ID" ] || [ "$BOOKING_ID" = "null" ]; then
  echo "ERROR: booking id not returned"
  exit 1
fi
echo "BOOKING_ID=$BOOKING_ID"

echo "== schedule =="
S1=$(curl -s -X POST "$BASE/api/v1/bookings/$BOOKING_ID/schedule" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: smoke-schedule-1" \
  -d '{"note":"scheduled"}' | jq -r '.status')
echo "status=$S1"
test "$S1" = "pending_dispatch"

echo "== cancel =="
S2=$(curl -s -X POST "$BASE/api/v1/bookings/$BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: smoke-cancel-1" \
  -d '{"note":"canceled"}' | jq -r '.status')
echo "status=$S2"
test "$S2" = "canceled"

echo "== events length =="
N=$(curl -s "$BASE/api/v1/bookings/$BOOKING_ID/events" \
  -H "Authorization: Bearer $TOKEN" | jq 'length')
echo "events=$N"
test "$N" = "3"

echo "== idempotency (cancel again, same key) =="
S3=$(curl -s -X POST "$BASE/api/v1/bookings/$BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: smoke-cancel-1" \
  -d '{"note":"canceled again"}' | jq -r '.status')
echo "status=$S3"
test "$S3" = "canceled"

N2=$(curl -s "$BASE/api/v1/bookings/$BOOKING_ID/events" \
  -H "Authorization: Bearer $TOKEN" | jq 'length')
echo "events=$N2"
test "$N2" = "3"

echo "✅ smoke_booking_events OK"
