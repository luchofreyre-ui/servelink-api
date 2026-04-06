# Servelink / Nu Standard Cleaning — Platform Feature Inventory

**Scope:** Evidence from this repository only (`~/Desktop/servelink`).  
**Generated:** Codebase audit (Prisma schema, NestJS modules, Next.js `apps/web`, Vite `apps/admin`, docs).  
**Not included:** Production deployment topology, third-party dashboards, or features not represented in source.

---

## How to read this document

- **Implemented** — Executable code paths + persistence and/or HTTP APIs exist.
- **Partially implemented** — Core exists but missing depth (e.g. UI without matching API, or API stub).
- **Presentational only** — UI/copy/SEO without confirmed backing mutations or domain services in this repo.
- **Planned / scaffolded only** — Docs, types, or empty shells with no substantive logic wired.

Where relevant, items are tagged **Backend** vs **UI / client-only**.

---

## 1. Trust / verification / compliance

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **JWT auth + refresh rotation** | Register/login/refresh/logout; hashed refresh tokens with rotation fields. | Session security baseline. | `services/api/src/auth/*`, `User`, `RefreshToken` in `prisma/schema.prisma` | **Implemented** (Backend) |
| **Role enum (customer / fo / admin)** | Coarse access separation on `User.role`. | Tenant-style RBAC foundation. | `Role` enum, `JwtAuthGuard`, `AdminGuard`, `roles.guard.ts` | **Implemented** (Backend) |
| **Admin permissions decorator** | `@AdminPermissions(...)` on controllers. | Fine-grained ops policy. | `services/api/src/common/admin/*` | **Partially implemented** — `AdminPermissionsGuard` returns true for all admins (`admin-permissions.guard.ts`); `GET /api/v1/me` returns `permissions: []` (`me.controller.ts`). |
| **Stripe webhook ingestion** | Receives Stripe events; idempotent receipt table. Single ingress: `POST /api/v1/stripe/webhook`. | Payment truth vs platform state. | `modules/billing/stripe.webhook.controller.ts`, `StripeWebhookHandlerService`, `StripeWebhookReceipt` model | **Implemented** (Backend) |
| **Dispute case persistence** | `DisputeCase` tied to booking + Stripe dispute id. | Chargeback workflow data model. | `prisma/schema.prisma`, billing/ledger dispute flows in tests | **Implemented** (Backend) |
| **Refund intents + admin refund APIs** | Refund intent records; admin refund/reconcile controllers; optional Bull queue. | Controlled refunds with audit. | `RefundIntent` model, `BillingRefundsController`, `RefundIntentAdminController`, `refunds.queue.processor.ts` | **Implemented** (Backend) |
| **Billing integrity sweep (cron)** | Scheduled checks; can emit OpsAlerts / rollups. | Proactive financial integrity. | `services/api/src/modules/billing/integrity.sweep.cron.ts` | **Implemented** (Backend) |
| **Ops anomalies / alerts** | OpsAlert + OpsAlertRollup + audit trail; admin inbox APIs (ack/resolve/assign, SLA filters). | Operator safety net for money/dispatch/data issues. | `AnomaliesAdminController`, models `OpsAlert`, `OpsAlertRollup`, `OpsAlertAudit` | **Implemented** (Backend) |
| **Ledger invariant violation alerts** | On imbalance, emits critical alerts + rollup (ledger service). | Prevents silent accounting drift. | `services/api/src/modules/ledger/ledger.service.ts` | **Implemented** (Backend) |
| **Public “trust” marketing copy** | Trust section text on homepage-style content. | Conversion / brand. | `apps/web/src/content/homepage.ts`, `TrustSignalsRow.tsx` (under `components/seo/**` — see tsconfig note below) | **Presentational only** (UI) unless wired to real verification APIs (not found). |
| **Knowledge “evidence standard” (copy)** | Editorial standard for cleaning content. | SEO/brand rigor. | `apps/web/src/knowledge/validation/evidenceStandard.ts` | **Presentational / editorial** (no enforcement service in API) |

**tsconfig note (web):** `apps/web/tsconfig.json` **excludes** `src/components/knowledge/**`, `seo/**`, `local-seo/**`, `analytics/**` from the TypeScript project. Files may still exist and be referenced at build time depending on imports; treat excluded trees as **lower assurance** for “default” CI/typecheck unless explicitly included.

---

## 2. Dispatch / routing / offers / exceptions

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Dispatch engine + worker** | Async dispatch processing (Bull-backed when Redis configured). | Scales offer generation. | `DispatchService`, `DispatchWorker`, `dispatch.module.ts` | **Implemented** (Backend) |
| **Booking offers lifecycle** | Offers with rank, rounds, expiry, accept/reject/expired states. | Marketplace-style FO matching. | `BookingOffer` model, FO offer response controller, booking transitions | **Implemented** (Backend) |
| **Dispatch decisions + candidates** | Each pass records decision status, scoring version, candidate rows with reason codes and score breakdown JSON. | Explainable automation + audit. | `DispatchDecision`, `DispatchDecisionCandidate`, `DispatchDecisionService`, enums `DispatchDecisionStatus`, `DispatchCandidateReasonCode` | **Implemented** (Backend) |
| **Dispatch config (versioned)** | Weighted scoring params, offer expiry, multi-pass penalty, JSON config blob; publish audits. | Tunable operations without code deploy. | `DispatchConfig`, `DispatchConfigPublishAudit`, `DispatchConfigService`, `dispatch-config.admin.controller.ts` | **Implemented** (Backend) |
| **FO-facing dispatch APIs** | FO sees/responds to offers (controllers under dispatch module). | Execution layer for providers. | `dispatch.fo.controller.ts`, `dispatch.fo-offer-response.controller.ts` | **Implemented** (Backend) |
| **Admin dispatch exceptions API** | List/filter dispatch exception bookings for admin. | Control tower visibility. | `dispatch.admin.controller.ts` (referenced in module), web: `apps/web/.../admin/exceptions/*` | **Implemented** (Backend + UI) |
| **Manual dispatch ops (admin)** | Manual assign / redispatch / exclude provider / clear exclusions. | Human override path. | `admin-dispatch-ops.controller.ts`, `DispatchOpsService` | **Implemented** (Backend) |
| **Admin dispatch decisions queue** | Submitted decisions with execution status (apply hold/reassign/etc.). | Bridges human intent to automation. | `AdminDispatchDecision` model, `admin-dispatch-decisions/*` | **Implemented** (Backend) |
| **Reputation / reliability signals** | FO reputation tier, reliability label, dispatch stats models. | Inputs to ranking and governance. | `FranchiseOwnerReputation`, `FranchiseOwnerDispatchStats`, `ReputationService` | **Implemented** (Backend) |
| **Slot holds + availability** | Hold windows on calendar; cleanup worker; metrics endpoint. | Double-booking prevention. | `BookingSlotHold`, `SlotHoldsService`, `SlotAvailabilityService`, `slot-hold-cleanup.worker.ts` | **Implemented** (Backend) |
| **Booking command center (admin)** | Hold, mark review, approve, reassign (limited), operator note; workflow on `BookingDispatchControl`. | Operator workflow on a booking. | `admin-bookings.controller.ts`, `admin-bookings.service.ts`, `BookingDispatchControl`, `AdminBookingWorkflowState` | **Implemented** (Backend + Next admin UI on booking detail) |
| **Portfolio operational snapshot (client)** | Derives “signals” from booking screen JSON for FO/admin cards. | Executive-style narrative from live data. | `apps/web/src/portfolio/*`, used in `fo/page.tsx`, admin exceptions | **Partially implemented** — **client-side** interpretation of APIs; not a separate backend “portfolio service.” |

**Routes (web — Next app shell):**

- `/admin/exceptions`, `/admin/exceptions/[id]`
- `/admin/dispatch-config`
- `/admin/bookings/[id]` (command center + timeline + explainer consumption)
- `/admin/activity`, `/admin/anomalies`, `/admin/ops` (lightweight hub)

**Routes (admin Vite app — `apps/admin`):** React Router paths in `adminRoutes.ts` (`/exceptions`, `/dispatch-config`, `/bookings/:id`, `/supply/*`, etc.) — see **Supply** section for API gap.

---

## 3. Financial ledger / payouts / liabilities / settlement

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Double-entry journal** | `JournalEntry` + `JournalLine`; append-only extension blocks mutation/deletes on ledger tables in Prisma layer. | Investor-grade money accounting. | `ledger.service.ts`, `JournalEntry`, `JournalLine`, `LedgerAccount`, `LineDirection`, `JournalEntryType` | **Implemented** (Backend) |
| **Ledger validation** | Validates balances, refund caps, payable/deferred non-negativity, etc. | Trust in automation. | `LedgerService.validate…`, metrics `ledgerValidationViolationsTotal` | **Implemented** (Backend) |
| **Stripe-linked billing** | PaymentIntent tracking on bookings; Stripe service. | Cash collection. | `BookingStripePayment`, `billing.stripe.controller.ts`, `StripeService` | **Implemented** (Backend) |
| **Billing sessions + finalization** | Time on-site billing sessions; final billable amounts. | Usage-based revenue. | `BillingSession`, `BookingBillingFinalization`, booking billing endpoints | **Implemented** (Backend) |
| **Payout batches** | Preview eligible FO payables; lock batch; mark executed posts `PAYOUT` ledger entries. | FO settlement workflow. | `PayoutsService`, `PayoutBatch`, `PayoutLine` | **Implemented** (Backend) — **explicitly “no real money transfer; admin-only”** in `payouts.service.ts` docstring. |
| **Payout blocked ops alerts** | When payout would overdraw or FO payable negative, emits OpsAlert + rollup. | Prevents bad payouts. | `payouts.service.ts` | **Implemented** (Backend) |
| **Billing adjustments admin** | Admin adjustments controller (posting paths). | Manual corrections. | `billing.adjustments.controller.ts` | **Implemented** (Backend) |
| **Dispute ledger postings** | Dispute-related entry types in enum; e2e tests cover lifecycle. | Chargeback accounting. | `JournalEntryType` includes `DISPUTE_*`, tests under `services/api/test/stripe.disputes.*` | **Implemented** (Backend) |

**UI:** Admin booking economics / billing cards in web (`AdminBookingEconomicsCard`, billing compute helpers) consume booking APIs — **partial** relative to full ledger exposure to non-admin roles.

---

## 4. Supply / inventory / reorder / vendors

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Supply admin UI (Vite)** | Overview, FO supply detail, shipment planner, rules, activity pages; typed API client expecting `/api/v1/admin/supply/*`. | Ops console for consumables / replenishment (intended). | `apps/admin/src/admin/features/supply/**` | **Planned / scaffolded only (UI)** |
| **Supply backend API** | — | — | **No matches** for `supply` controllers/services under `services/api/src` | **Not implemented** in this API repo (as of audit). |

**Conclusion:** Supply is a **strong UI + contract expectation** without a matching Nest module in this repository.

---

## 5. Pricing / estimating / quoting

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Static public pricing endpoint** | Returns hourly rate, billing increment, exclusions list. | Marketing + simple quote assumptions. | `services/api/src/controllers/pricing.controller.ts` — `GET /api/v1/pricing/cleaning` | **Implemented** (Backend) — **static JSON**, not dynamic quote engine. |
| **Estimator service (large)** | Deterministic estimator with risk bands, modes (unit tests describe STANDARD/CAPPED/STAGED). | Intelligent quoting / scope risk. | `services/api/src/modules/estimate/estimator.service.ts` (wired via `EstimateModule` in `BookingsModule`) | **Implemented** (Backend) |
| **Booking estimate snapshot** | Persists estimator inputs/outputs on booking. | Audit trail of what customer was quoted. | `BookingEstimateSnapshot` model, used from `BookingsService` | **Implemented** (Backend) |
| **Public booking flow UI** | `/book` route hosts `BookingFlowClient` (precision-luxury marketing stack). | Nu Standard acquisition funnel. | `apps/web/src/app/(public)/book/page.tsx`, `components/marketing/precision-luxury/booking/*` | **Partially implemented** — depth depends on API wiring inside client (not fully traced here). |

---

## 6. Booking / intake / job creation

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Booking CRUD + lifecycle** | Create booking; status machine (`BookingStatus` enum); assign, schedule, start, complete, cancel, reopen. | Core operating object. | `bookings.controller.ts`, `bookings.service.ts` | **Implemented** (Backend) |
| **Booking events stream** | `BookingEvent` types include dispatch/offers lifecycle. | Timeline / audit. | `BookingEventsService`, `GET /api/v1/bookings/:id/events` | **Implemented** (Backend) |
| **Dispatch timeline + explainer + exception detail** | Read models for admin/FO understanding of dispatch. | Reduces support load. | `GET .../dispatch-timeline`, `.../dispatch-explainer`, `.../dispatch-exception-detail` | **Implemented** (Backend) |
| **Operator notes (booking)** | POST dispatch operator notes. | Human context on dispatch. | `bookings.controller.ts` | **Implemented** (Backend) |
| **Geofence / site fields on booking** | `siteLat`, `siteLng`, `geofenceRadiusMeters`, `lastInsideAt`, `outsideSinceAt`. | Trust/verification for on-site work. | `Booking` model | **Partially implemented** — fields exist; end-to-end enforcement depth not fully cataloged here. |
| **Location pings** | Stored pings with lat/lng/accuracy. | Proof of presence pipeline. | `LocationPing` model, booking `POST :id/site` | **Implemented** (Backend) — **UI depth** varies by app surface. |
| **Add-ons via SMS confirmation** | `BookingAddon` + `SmsConfirmation` models. | Upsell / confirmation flows. | `prisma/schema.prisma`, `SmsModule` | **Partially implemented** — modules exist; full UX trace omitted. |
| **Customer / FO profile REST (contract doc)** | Documented in `docs/api/contract-map.md`. | Standard SaaS profile APIs. | **No `customers/me` or `fos/me` controllers found** in `services/api/src` | **Planned / scaffolded only** (docs ahead of code) |

---

## 7. Admin / command center / config / anomalies / activity

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Admin activity feed** | Merged feed: config publish audits, operator notes, manual dispatch, admin dispatch decisions, anomaly audits, command-center activity. | “What happened?” | `AdminActivityService`, `admin-activity.controller.ts`, web `/admin/activity` | **Implemented** |
| **Ops anomalies inbox** | List/ack/resolve/assign; SLA/mine/unassigned filters; fingerprint rollup mode. | “What needs attention?” | `AnomaliesAdminController` (~2.6k LOC), web `/admin/anomalies` | **Implemented** |
| **Dispatch config publish** | Draft/active/archive; publish audits with diff snapshots. | Safe operational tuning. | `DispatchConfigAdminController`, `DispatchConfigPublishAudit` | **Implemented** |
| **Admin dashboard (Next)** | Pulls dispatch exceptions + activity snippet. | Landing ops view. | `apps/web/.../admin/page.tsx` | **Implemented** (UI + API) |
| **Second admin app (Vite)** | Separate operational UI branded “Nu Standard Cleaning Admin.” | Alternate deployment (`admin.nustandardcleaning.com` per README). | `apps/admin/**` | **Partially implemented** — overlaps with Next `/admin`; **supply** screens lack API in this repo. |
| **Dev Playwright scenario API** | Seeds users/bookings/alerts for deterministic tests. | Engineering / demo reliability. | `DevController` `GET /api/v1/dev/playwright/admin-scenario`, `dev.service.ts` | **Implemented** (non-prod gated in `app.module.ts`) |

---

## 8. Franchise owner capabilities

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **FO dashboard (Next)** | Uses portfolio selectors over booking screen fetches. | FO operating picture. | `apps/web/.../(fo)/fo/page.tsx`, `FranchiseOwnerDashboard.tsx` | **Implemented** (UI + API reads) |
| **FO booking detail** | Booking screen for FO role. | Execution. | `apps/web/.../fo/bookings/[id]/page.tsx` | **Implemented** (UI) |
| **FO dispatch offer response** | API endpoints for responding to offers. | Core marketplace loop. | `dispatch.fo-offer-response.controller.ts` | **Implemented** (Backend) |
| **FO capability / matching fields** | Team size, travel, coords, job stats, safety hold. | Matching inputs. | `FranchiseOwner` model + related stats tables | **Implemented** (data model + services) |
| **Admin FO provider link helpers** | Admin API for provider linkage. | Identity/capability wiring. | `fo.admin.controller.ts` | **Implemented** (Backend) |

---

## 9. Customer-facing capabilities

| Feature | What it does | Why it matters | Where (code) | Status |
|--------|---------------|----------------|--------------|--------|
| **Customer home + booking detail** | Authenticated shell routes. | Self-serve. | `apps/web/.../customer/page.tsx`, `customer/bookings/[id]/page.tsx` | **Implemented** (UI) |
| **Public marketing site** | Homepage, services catalog, book flow, guides/questions static routes. | Acquisition. | `apps/web/src/app/(public)/*`, marketing components | **Implemented** (UI) |
| **Notifications shell route** | Page exists in app shell. | Engagement placeholder. | `apps/web/.../notifications/page.tsx` | **Partially implemented** — depth not audited. |

---

## 10. Nu Standard public platform capabilities

**Brand / domain:** “Nu Standard Cleaning” appears in content registries, local SEO data, `apps/admin` titles, and `publicContentRegistry.ts` (`PUBLIC_SITE_URL` = `https://nustandardcleaning.com`).

| Surface | What it does | Where | Status |
|---------|--------------|-------|--------|
| **Service area / local SEO content** | City- and intent-structured copy. | `apps/web/src/local-seo/**` (tsconfig-excluded from strict TS project) | **Presentational + structured content** |
| **Knowledge / cleaning encyclopedia** | Problems, surfaces, methods, tools, clusters; metadata helpers. | `apps/web/src/knowledge/**`, `components/knowledge/**` (excluded from TS project) | **Partially implemented** — large content system; build/typecheck guarantees vary |
| **Conversion / intent CTAs** | Attribution helpers, funnel components. | `apps/web/src/analytics/conversion/**` (excluded), `components/conversion/**` | **Partially implemented** |
| **SEO components** | Schema sets, trust row, related links. | `components/seo/**` (excluded) | **Presentational** |

---

## 11. Investor demo / presentation capabilities

| Finding | Evidence | Status |
|---------|----------|--------|
| **No separate “investor app” package** | No dedicated `investor/` or `demo/` app; no standalone slide deck generator in repo. | N/A |
| **Portfolio-style executive panels** | Admin booking governance + portfolio health/summary cards built from **client-side selectors** over API payloads. | `apps/web/src/components/portfolio/admin/*`, `portfolioOperationalSelectors.ts`, `AdminBookingGovernanceCard.tsx` | **Implemented** as **presentation layer on real APIs** |
| **Deterministic dev scenario** | Repeatable multi-booking dataset for demos/tests. | `dev.service.ts` Playwright scenario | **Implemented** (non-prod) |
| **Metrics / health / readiness** | Operational endpoints for platform health. | `health.controller.ts`, `readiness.controller.ts`, `metrics.controller.ts`, `metrics.registry.ts` | **Implemented** (Backend) |

---

## 12. True backend/system capabilities vs UI-only (summary)

### Strong backend systems (this repo)

- Dispatch (offers, decisions, candidates, config, worker, FO APIs).
- Bookings lifecycle + dispatch read models + slot holds.
- Stripe webhook + billing + refunds + finalization + disputes data model.
- Double-entry ledger + validation + invariant alerts.
- Payout batching **as ledger workflow** (not bank rails).
- Ops alerts / anomalies with rich admin API.
- Admin booking command center + activity feed merge.
- Estimator + persisted `BookingEstimateSnapshot`.
- Auth (JWT + refresh) + coarse roles.

### UI-first or doc-first (weaker backend match)

- **Supply chain admin** UI without `services/api` supply module.
- **Customer/FO profile** endpoints documented in `docs/api/contract-map.md` **not found** in controllers.
- **RBAC permissions** advertised on `/me` but empty; guard allows all admin permissions.
- Large **SEO/knowledge** trees with **tsconfig excludes** → treat as **content/marketing subsystem** with weaker default engineering gates.

---

## 13. Most underrepresented capabilities (easy to underplay in investor materials)

1. **Dispatch decision candidate artifacts** — persisted `scoreBreakdown`, `eligibilitySnapshot`, and enumerated `DispatchCandidateReasonCode` → strong “explainable AI/ops” story.
2. **Versioned dispatch config + publish audits with diff snapshots** — real **change management** for automation.
3. **Append-only double-entry ledger + Prisma-layer immutability** + **invariant violation → critical OpsAlert** — rare maturity for a vertical SaaS at this stage.
4. **Payout preview/eligibility + blocked payout alerts** — shows **capital / liability discipline** even before bank integration.
5. **Ops anomaly system** (SLA, assignment, rollup, audit trail) — operator-grade **control tower**.
6. **Integrity sweep cron** — proactive **financial hygiene**.
7. **Slot holds + cleanup worker** — real **capacity / scheduling** hardening.
8. **Dispute lifecycle tests** — demonstrates **payments edge cases** are not hand-waved.
9. **Booking dispatch explainer + exception detail APIs** — operational **transparency** for support.
10. **Refresh token rotation schema** — security hygiene often skipped in MVPs.

---

## 14. Critical gaps or missing proof

1. **Supply backend** — Admin UI expects `/api/v1/admin/supply/*`; **no implementation** found in API tree → **cannot claim end-to-end supply** from this repo alone.
2. **Bank / treasury execution** — Payouts explicitly **do not move real money** (`PayoutsService` docstring).
3. **Permissions / RBAC** — `permissions: []` and permissive `AdminPermissionsGuard` → **access control story is immature** vs UI surface area.
4. **Profile / CRM-style APIs** — Contract map suggests richer customer/FO profile HTTP layer **not implemented** here.
5. **Single coarse `PricingController`** — Public pricing is **static**; dynamic quote story relies on **Estimator** + booking snapshot, not a standalone quote API.
6. **Two admin frontends** (Next `/admin` vs Vite `apps/admin`) — **product/architecture fragmentation risk**; investor narrative should clarify **which is production** and **what ships**.
7. **Excluded TypeScript paths in `apps/web`** — Knowledge/SEO/analytics folders excluded from `tsc` project → **quality bar uneven** across marketing surfaces.
8. **Geofence / presence** — Model support exists; **end-to-end “verification product”** not fully evidenced from this audit alone.

---

## 15. Executive summary

### Top 10 strongest platform capabilities (evidence-backed)

1. **Dispatch automation platform** (offers, multi-pass decisions, explainable candidate rows, config versioning).
2. **Append-only double-entry ledger** with validation and **hard-fail invariant** alerting.
3. **Stripe-integrated billing + refunds + disputes** modeling with extensive automated tests.
4. **FO marketplace loop** (offers, responses, assignment) backed by real APIs.
5. **Admin ops layer** (anomalies inbox, activity feed, command center workflow states).
6. **Operational transparency APIs** (dispatch timeline, explainer, exception detail).
7. **Estimator engine + persisted quote snapshots** on bookings.
8. **Slot holds + cleanup** for scheduling safety.
9. **Payout batching on ledger** (eligibility + guardrails + alerts).
10. **Resilience endpoints** (health/readiness/metrics) + **dev scenario** for repeatable demos.

### Top 5 investor-differentiating capabilities

1. **Explainable dispatch** (candidate reason codes + score breakdown persistence).
2. **Ledger + invariant enforcement** tied to **operator alerts**.
3. **Versioned dispatch tuning** with **publish audits**.
4. **Integrity sweep + anomaly SLA workflows** (financial + ops seriousness).
5. **End-to-end booking + dispatch + billing + ledger** in **one** codebase (vertical integration).

### Top 5 things to show in the main presentation flow

1. **Live booking → dispatch offers → FO accept → assignment** (happy path).
2. **Dispatch explainer / exception detail** on a realistic edge case.
3. **Admin command center** state transitions on the same booking.
4. **Ledger + payout preview** showing **liability discipline** (even without bank rails).
5. **Ops anomaly** ack/resolve story on a **seeded or real alert**.

### Top 5 things to keep in backup (Q&A / appendix), not the main flow

1. **Prisma ledger immutability extension** (implementation detail).
2. **Refresh token rotation schema**.
3. **Full enum laundry lists** (`JournalEntryType`, `DispatchCandidateReasonCode`).
4. **Playwright/dev scenario** mechanics.
5. **tsconfig exclusions** and **unfinished supply API** — honest scope boundaries.

---

## Appendix A — Key file index (quick reference)

| Area | Paths |
|------|--------|
| API entry | `services/api/src/app.module.ts` |
| Schema | `services/api/prisma/schema.prisma` |
| Bookings | `services/api/src/modules/bookings/*` |
| Dispatch | `services/api/src/modules/dispatch/*` |
| Billing / Stripe / anomalies | `services/api/src/modules/billing/*` |
| Ledger | `services/api/src/modules/ledger/*` |
| Payouts | `services/api/src/modules/payouts/*` |
| Slot holds | `services/api/src/modules/slot-holds/*` |
| Admin bookings CC | `services/api/src/modules/admin/bookings/*` |
| Admin activity | `services/api/src/modules/admin/admin-activity.*` |
| Estimate | `services/api/src/modules/estimate/estimator.service.ts` |
| Public web (Next) | `apps/web/src/app/**` |
| Admin web (Next) | `apps/web/src/app/(app-shell)/(admin)/**` |
| Admin web (Vite) | `apps/admin/src/**` |
| API contract narrative | `docs/api/contract-map.md` |
| Nu Standard content registry | `apps/web/src/components/marketing/precision-luxury/content/publicContentRegistry.ts` |

---

*End of report.*
