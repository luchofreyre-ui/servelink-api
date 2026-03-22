# Servelink Launch Day Runbook

## 1. Pre-launch
- Confirm backend build passes
- Confirm frontend build passes
- Confirm `npx prisma migrate deploy` completed
- Confirm Stripe keys are set correctly
- Confirm `/api/v1/system/health` returns `ok: true`
- Confirm `/api/v1/system/readiness` returns `ok: true`

## 2. Smoke checks
- Open customer booking page
- Confirm quote values render
- Confirm secure checkout button renders
- Confirm payment intent can be created
- Confirm admin booking operational detail loads
- Confirm admin anomalies page loads
- Confirm revenue readiness card loads

## 3. First live booking
- Create booking
- Verify quotedSubtotal / quotedMargin / quotedTotal
- Complete payment
- Verify `paymentStatus=paid`
- Verify admin operational detail shows payment record
- Verify trust events and anomalies behave as expected

## 4. If payment fails
- Check admin anomalies page
- Check booking operational detail
- Confirm mismatch / payment failure anomaly exists
- Resolve only after root cause is understood

## 5. If deploy fails
- Verify env variables
- Verify DB reachable
- Verify API readiness endpoint
- Re-run frontend and backend builds
- Re-run smoke scripts

## 6. Do not launch if
- payment intent creation fails
- payment confirm fails
- operational detail is broken
- anomalies page is broken
- readiness endpoint fails
