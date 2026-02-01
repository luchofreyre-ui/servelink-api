#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
PHONE="${PHONE:-+19185551234}"
ADDON_TYPE="${ADDON_TYPE:-deep_clean}"
PRICE_CENTS="${PRICE_CENTS:-2500}"
CURRENCY="${CURRENCY:-usd}"

echo "=== Servelink SMS Addon Smoke Test ==="
echo "BASE_URL   = $BASE_URL"
echo "PHONE      = $PHONE"
echo "ADDON_TYPE = $ADDON_TYPE"
echo "PRICE_CENTS= $PRICE_CENTS"
echo "CURRENCY   = $CURRENCY"
echo

# 1) Create (or reuse) user + create booking in DB via PrismaService (NO singleton export)
echo "1) Creating/reusing user + creating booking..."
BOOKING_JSON="$(node -r ts-node/register - <<'NODE'
const { PrismaService } = require('./src/prisma');

(async () => {
  const phone = process.env.PHONE || "+19185551234";
  const prisma = new PrismaService();
  await prisma.$connect();

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `smoke_${Date.now()}@servelink.local`,
        phone,
        passwordHash: "x",
        role: "customer",
      },
    });
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      hourlyRateCents: 5000,
      estimatedHours: 2,
      currency: "usd",
      status: "pending_payment",
      notes: "",
    },
  });

  console.log(JSON.stringify({ phone, userId: user.id, bookingId: booking.id }));

  await prisma.$disconnect();
})();
NODE
)"
echo "   DB created: $BOOKING_JSON"

BOOKING_ID="$(node -e 'const s=process.argv[1]; console.log(JSON.parse(s).bookingId);' "$BOOKING_JSON")"
export BOOKING_ID

# 2) Create addon confirmation via API
echo
echo "2) POST /api/v1/sms/create-addon ..."
CREATE_RES="$(curl -s -X POST "$BASE_URL/api/v1/sms/create-addon" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"addon\": {
      \"type\": \"$ADDON_TYPE\",
      \"bookingId\": \"$BOOKING_ID\",
      \"priceCents\": $PRICE_CENTS,
      \"currency\": \"$CURRENCY\"
    }
  }")"
echo "   API response: $CREATE_RES"

CODE="$(node -e 'const s=process.argv[1]; const j=JSON.parse(s); if(!j.code) process.exit(2); console.log(j.code);' "$CREATE_RES")"
export CODE
echo "   Code = $CODE"

# 3) Approve via inbound YES <code>
echo
echo "3) POST /api/v1/sms/inbound (YES $CODE) ..."
INBOUND_RES="$(curl -s -X POST "$BASE_URL/api/v1/sms/inbound" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"body\": \"YES $CODE\"
  }")"
echo "   API response: $INBOUND_RES"

APPLIED="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j?.result?.applied===true ? "true":"false");' "$INBOUND_RES")"
if [ "$APPLIED" != "true" ]; then
  echo
  echo "❌ FAIL: inbound did not apply addon (applied=$APPLIED)"
  exit 1
fi
echo "   applied = true ✅"

# 4) GET status/<code>
echo
echo "4) GET /api/v1/sms/status/$CODE ..."
STATUS_RES="$(curl -s "$BASE_URL/api/v1/sms/status/$CODE")"
echo "   API response: $STATUS_RES"

STATUS="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.status||"");' "$STATUS_RES")"
if [ "$STATUS" != "approved" ]; then
  echo
  echo "❌ FAIL: status is not approved (status=$STATUS)"
  exit 1
fi
echo "   status = approved ✅"

# 5) Verify BookingAddon exists in DB
echo
echo "5) Verify BookingAddon row exists in Postgres ..."
VERIFY_JSON="$(node -r ts-node/register - <<'NODE'
const { PrismaService } = require('./src/prisma');

(async () => {
  const bookingId = process.env.BOOKING_ID;
  const smsCode = process.env.CODE;

  const prisma = new PrismaService();
  await prisma.$connect();

  const byCode = await prisma.bookingAddon.findUnique({ where: { smsCode } });
  const byBooking = await prisma.bookingAddon.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });

  console.log(JSON.stringify({
    bookingId,
    smsCode,
    foundByCode: !!byCode,
    byCode,
    countByBooking: byBooking.length,
  }));

  await prisma.$disconnect();
})();
NODE
)"
echo "   DB verify: $VERIFY_JSON"

FOUND="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.foundByCode===true ? "true":"false");' "$VERIFY_JSON")"
COUNT="$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.countByBooking||0);' "$VERIFY_JSON")"

if [ "$FOUND" != "true" ] || [ "$COUNT" -lt 1 ]; then
  echo
  echo "❌ FAIL: BookingAddon not found in DB"
  exit 1
fi

echo
echo "✅ SMOKE TEST PASS"
echo "   bookingId = $BOOKING_ID"
echo "   smsCode   = $CODE"
