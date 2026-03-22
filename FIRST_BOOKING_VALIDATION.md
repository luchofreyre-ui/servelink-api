# First Booking Validation

## Goal
Validate one real booking end-to-end with no manual database edits.

## Preconditions
- API deployed
- Web deployed
- Stripe keys configured
- `migrate deploy` completed
- `/api/v1/system/health` returns ok
- `/api/v1/system/readiness` returns ok

## Flow
1. Create a real customer account
2. Book a real service through the customer UI
3. Confirm quote values render
   - quotedSubtotal
   - quotedMargin
   - quotedTotal
4. Open secure checkout
5. Complete payment
6. Confirm booking status updates
   - paymentStatus = paid
7. Open admin booking detail
8. Confirm operational detail shows:
   - payment record
   - payment intent ID
   - quoted commercial fields
   - trust events
   - anomalies list
9. Open admin anomalies page
10. Confirm there are no unexpected open payment anomalies
11. Start and complete service flow
12. Confirm timeline updates on customer booking page
13. Confirm no manual DB edits were required

## Failure conditions
- payment intent creation fails
- payment confirm fails
- readiness fails
- admin operational detail is missing payment data
- anomalies cannot be acknowledged/resolved
- booking cannot progress without manual intervention
