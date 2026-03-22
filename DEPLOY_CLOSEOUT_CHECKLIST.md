# Servelink Deploy Closeout Checklist

## Backend
- [ ] `npx prisma migrate deploy` completed successfully
- [ ] environment variables present
- [ ] Stripe secrets configured correctly
- [ ] `npm run build` passes in `services/api`
- [ ] smoke script passes against deployed API

## Frontend
- [ ] `npm run build` passes in `apps/web`
- [ ] customer booking page shows quote + payment state
- [ ] admin booking detail shows payments + anomalies + trust events
- [ ] admin anomalies page loads and actions work

## Operational
- [ ] create booking
- [ ] quote is persisted
- [ ] payment intent can be created
- [ ] payment can be confirmed
- [ ] booking status updates correctly
- [ ] admin can inspect operational detail
- [ ] anomaly paths visible and resolvable

## Launch
- [ ] test booking completed end-to-end
- [ ] no manual database edits required
- [ ] no blocker errors in server logs
- [ ] no blocker errors in browser console

## Final polish
- [ ] secure Stripe checkout renders when publishable key is present
- [ ] manual payment controls hidden in production by default
- [ ] launch readiness card returns healthy state
- [ ] revenue readiness card returns values
- [ ] booking UI telemetry captures launch-day testing events

## Production lock
- [ ] NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS=false
- [ ] NEXT_PUBLIC_ENABLE_BOOKING_UI_TELEMETRY=false
- [ ] REQUIRE_STRIPE=true in production
- [ ] STRIPE_SECRET_KEY present
- [ ] STRIPE_WEBHOOK_SECRET present
- [ ] STRIPE_PUBLISHABLE_KEY present
- [ ] NEXT_PUBLIC_API_BASE_URL points to deployed API
- [ ] WEB_BASE_URL points to deployed web app
