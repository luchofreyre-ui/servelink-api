# Servelink Deploy Closeout Checklist

## Backend
- [ ] Before any **`railway up`** API deploy: **`npm run check:railway-api-deploy-tree`** passes from repo root (see **`docs/operations/railway-deploy-hygiene-v1.md`**).
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
- [ ] Warehouse refresh cron stays **disabled by default** — **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`** unset or not **`true`** unless explicitly approved for that environment (`docs/operations/warehouse-refresh-scheduling-governance-v1.md`).
- [ ] Admin ops command center shows **operational analytics warehouse refresh cron** tile and **`cronLedger`** rows for **`operational_analytics_warehouse_refresh`** after first ledger writes (skipped ticks still create rows when DB available).
- [ ] Warehouse refresh cadence understood — **`docs/operations/warehouse-refresh-scheduling-governance-v1.md`** (manual **`POST /api/v1/admin/operational-intelligence/refresh-snapshots`**; optional cron only after approval gate).
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
