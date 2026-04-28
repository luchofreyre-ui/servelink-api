# Admin Ops Backend + Reporting Audit — 2026-04-27

## Purpose

This audit verifies what backend operational state exists, what admin ops currently surfaces, what reporting is missing, and what tests prove the admin ops system. The goal is to close admin visibility gaps without changing the stable public booking/payment/scheduling runtime.

## Locked Runtime Baseline

- Public booking is stable.
- Stripe deposit lifecycle is stable.
- Tenant enforcement is active.
- Wall-clock scheduling consistency is active.
- FO matching and slot holds are stable.

## Audit Scope

- Admin operations dashboard
- Payment operations visibility
- Booking lifecycle exception visibility
- Payment anomaly reporting
- FO supply readiness reporting
- Slot/hold operational visibility
- Dispatch/review queue visibility
- Tenant-scoped admin reads
- Backend endpoints feeding admin ops
- Playwright/API tests proving admin ops visibility

## Findings Summary

| Area | Backend State Exists? | Surfaced in Admin Ops? | Test Coverage? | Status | Required Action |
|---|---:|---:|---:|---|---|
| Payment anomalies | Yes | Yes | Yes | Implemented | None |
| Deposit/payment lifecycle status | Yes | Partial | Yes | Partially implemented | Document remaining lifecycle-count gap |
| Reconciliation cron status | Yes | No | Yes | Backend-only | Add read-only reporting later if operators need cron health |
| Remaining balance auth status | Yes | No | Yes | Backend-only | Add read-only reporting later if operators need cron health |
| Booking lifecycle events | Yes | Partial | Yes | Partially implemented | Keep anomaly/activity surfaces; avoid broad event dashboard |
| Review-required bookings | Yes | Yes | Yes | Implemented | None |
| Dispatch readiness | Yes | Yes | Yes | Implemented | None |
| FO supply readiness | Yes | Yes | Yes | Implemented | None |
| Slot hold risk/expiry | Yes | No | Yes | Backend-only | Documentation gap; no admin endpoint currently summarizes holds |
| Tenant-scoped admin reads | Yes | Not directly surfaced | Yes | Implemented where relevant | No UI patch needed |
| Recurring ops | Yes | Was debug/probe only | Partial | Patched | Replace probe with real recurring ops page and tests |

## Backend Endpoint Inventory

| Endpoint | Controller | Purpose | Auth/Tenant Behavior | Admin UI Consumer | Status |
|---|---|---|---|---|---|
| `GET /api/v1/system/ops/summary` | `ReliabilityOpsController` | Ops summary counts and hotspots | `JwtAuthGuard` + `ReliabilityAdminGuard` | `loadAdminOpsPageData` / `/admin/ops` | Implemented |
| `GET /api/v1/system/ops/bookings/invalid-assignment-state` | `ReliabilityOpsController` | Invalid assignment drilldown | `JwtAuthGuard` + `ReliabilityAdminGuard` | `OpsSystemBacklog` | Implemented |
| `GET /api/v1/system/ops/bookings/dispatch-locked` | `ReliabilityOpsController` | Dispatch lock drilldown | `JwtAuthGuard` + `ReliabilityAdminGuard` | `DispatchLockedTable` | Implemented |
| `GET /api/v1/system/ops/bookings/review-required` | `ReliabilityOpsController` | Review-required drilldown | `JwtAuthGuard` + `ReliabilityAdminGuard` | `ReviewRequiredTable` | Implemented |
| `GET /api/v1/system/ops/dispatch/deferred` | `ReliabilityOpsController` | Deferred dispatch drilldown | `JwtAuthGuard` + `ReliabilityAdminGuard` | `DeferredDispatchTable` | Implemented |
| `GET /api/v1/system/ops/dispatch/manual-actions` | `ReliabilityOpsController` | Manual dispatch actions in last 24h | `JwtAuthGuard` + `ReliabilityAdminGuard` | `ManualDispatchTable` | Implemented |
| `GET /api/v1/system/ops/supply/franchise-owners` | `ReliabilityOpsController` | FO readiness diagnostics | `JwtAuthGuard` + `ReliabilityAdminGuard` | `FoSupplyReadinessSection` | Implemented |
| `GET /api/v1/admin/payments/ops-summary` | `AdminPaymentsController` | Payment reliability summary | `JwtAuthGuard` + `AdminGuard` + permission | `AdminOperationsCommandCenter` | Implemented |
| `GET /api/v1/admin/payments/anomalies` | `AdminPaymentsController` | Open payment anomalies | `JwtAuthGuard` + `AdminGuard` + permission | `AdminOperationsCommandCenter` | Implemented |
| `GET /api/v1/admin/ops/anomalies` | `AnomaliesAdminController` | Ops anomaly queue | `JwtAuthGuard` + `AdminGuard` | `AdminOpsAnomaliesPanel`, `/admin/anomalies` | Implemented |
| `GET /api/v1/admin/ops/anomalies/counts` | `AnomaliesAdminController` | Anomaly counts | `JwtAuthGuard` + `AdminGuard` | Admin anomaly UI | Implemented |
| `GET /api/v1/admin/supply/franchise-owners` | `SupplyFranchiseOwnerAdminController` | FO supply admin overview | `JwtAuthGuard` + `AdminGuard` | Supply admin routes | Implemented |
| `GET /api/v1/recurring/ops/summary` | `RecurringOpsController` | Recurring generation health counts | `JwtAuthGuard` + `ReliabilityAdminGuard` | `/admin/ops/recurring` | Patched UI consumer |
| `GET /api/v1/recurring/ops/exhausted` | `RecurringOpsController` | Exhausted recurring occurrences | `JwtAuthGuard` + `ReliabilityAdminGuard` | `/admin/ops/recurring` | Patched UI consumer |

## Admin UI Inventory

| Route/Component | Data Source | Current Sections | Missing Sections | Status |
|---|---|---|---|---|
| `/admin/ops` | Client reads admin dispatch/activity/payment APIs; server reads `system/ops/*` | Payment operations, dispatch exceptions/actions, admin activity, anomalies, dispatch backlog, FO readiness, review-required | Cron health and slot hold summary are not surfaced | Partially implemented |
| `/admin/ops/recurring` | `GET /api/v1/recurring/ops/summary`, `GET /api/v1/recurring/ops/exhausted` | Recurring summary and exhausted occurrences | None for existing backend fields | Patched |
| `/admin/bookings/[id]` | Booking/admin command center APIs | Booking overview, dispatch timeline, authority/command center sections | Not part of this patch | Existing coverage found |

## Verified Gaps

List only gaps proven by code inspection.

| Gap | Type | Blast Radius | Required Fix |
|---|---|---:|---|
| `/admin/ops` rendered `RecurringSystemProbe`, a debug component with alert buttons hitting `/recurring` and `/recurring/debug/routes`, while the linked `/admin/ops/recurring` page did not exist. | Frontend / Test | Admin ops only | Replace probe with a real recurring ops navigation link, add `/admin/ops/recurring`, consume existing read-only recurring ops endpoints, and add Playwright coverage. |
| Recurring ops backend endpoint existed but had no admin UI consumer. | Frontend | Admin ops only | Add typed reads to `adminOps.ts` and render summary/exhausted rows. |
| Playwright coverage proved inline ops actions and anomaly pages but not the presence of Payment Operations, FO Supply Readiness, Review Required, or recurring ops dashboard sections. | Test | Admin ops only | Add focused admin ops visibility test. |
| Reconciliation cron and remaining-balance auth cron log batch state but expose no read-only admin summary endpoint. | Documentation / Backend | Admin reporting only | Document as not evidenced; defer endpoint until operator requirements are explicit. |
| Slot hold active/expired/consumed state exists in `BookingSlotHold` and cleanup code but lacks admin summary reporting. | Documentation / Backend | Admin reporting only | Document as not evidenced; defer endpoint until operator requirements are explicit. |

## Non-Gaps

List suspected issues that are already implemented.

| Suspected Missing Piece | Evidence | Conclusion |
|---|---|---|
| Payment anomaly visibility | `PaymentReliabilityService`, `AdminPaymentsController`, `AdminOperationsCommandCenter`, and `payment-reliability.e2e.spec.ts` cover open anomalies and payment reliability counts. | Implemented. |
| Review-required bookings | `OpsVisibilityService.getReviewRequiredBookings`, `/system/ops/bookings/review-required`, `OpsSystemBacklog`, and admin ops inline Playwright tests. | Implemented. |
| FO supply readiness | `FoService.listFoSupplyReadinessDiagnostics`, `/system/ops/supply/franchise-owners`, `FoSupplyReadinessSection`, and `fo-supply-readiness-ops.e2e.spec.ts`. | Implemented. |
| Dispatch readiness/actions | `ReliabilityOpsController`, `dispatch-ops.service.ts`, `DispatchLockedTable`, and `admin-ops-inline-actions.spec.ts`. | Implemented. |
| Ops anomaly lifecycle | `AnomaliesAdminController` and `ops-anomalies-ack.e2e.spec.ts` cover list, ack, assign, resolve, and audit reads. | Implemented. |
| Recurring ops backend summary | `RecurringOpsController` and `RecurringService.getRecurringOpsSummary` exist; service-level test covers aggregate calls. | Backend implemented; UI now patched. |

## Tests Found

| Test | What It Proves | Currently Passing? | Gaps |
|---|---|---:|---|
| `apps/web/tests/playwright/regression/admin/admin-ops-inline-actions.spec.ts` | `/admin/ops` loads and inline actions use server eligibility fields. | Not run in this audit yet | Does not assert broad section inventory. |
| `apps/web/tests/playwright/regression/admin/admin-ops-sections.spec.ts` | `/admin/ops` surfaces payment, FO readiness, review-required, recurring link, and removes debug recurring probe; `/admin/ops/recurring` renders backend fields. | Added, pending local run | Requires running web/API Playwright environment. |
| `services/api/test/fo-supply-readiness-ops.e2e.spec.ts` | FO readiness ops endpoint is admin-protected and grounded in readiness/eligibility evaluators. | Not run in this audit yet | None for endpoint. |
| `services/api/test/payment-reliability.e2e.spec.ts` | Payment anomalies and payment ops summary expose real DB-backed counts. | Not run in this audit yet | Summary lacks explicit remaining balance cron status. |
| `services/api/test/ops-anomalies-ack.e2e.spec.ts` | Ops anomaly list/ack/resolve/assign/audit lifecycle. | Not run in this audit yet | None for anomaly lifecycle. |
| `services/api/test/recurring.service.phase8.spec.ts` | Recurring ops summary service issues expected aggregate counts. | Not run in this audit yet | No controller E2E coverage found. |
| `services/api/test/payment-lifecycle-reconciliation.spec.ts` | Reconciliation and remaining-balance cron/service behavior. | Not run in this audit yet | No admin reporting endpoint for cron status. |

## Patch Plan

Only include patches that are supported by verified gaps.

- Remove `RecurringSystemProbe` from `/admin/ops` because it is a debug UI and linked to a missing route.
- Add recurring ops typed API readers to `apps/web/src/lib/api/adminOps.ts`.
- Add `RecurringOpsDashboard` and `/admin/ops/recurring` to surface existing backend recurring ops data.
- Add Playwright coverage for admin ops section visibility and recurring ops page rendering.
- Do not change public booking, payment lifecycle, Stripe, slot generation, FO matching, or booking creation logic.

## Validation Commands

Document exact commands run.

- `git status --short`
- `git log --oneline -5`
- `find`/`rg` equivalents via Cursor Glob/RG for admin ops, reliability, payment, booking, dispatch, supply, tests.
- `cat package.json`
- `cat apps/web/package.json`
- `cat services/api/package.json`
- `cd apps/web && npm run typecheck`
- `cd services/api && npm run typecheck`
- `cd services/api && npm run build`
- `cd apps/web && npm run build`
- Playwright not run locally because no active web/API dev server was available in existing terminals; run `PLAYWRIGHT_SKIP_WEBSERVER=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/playwright/regression/admin/admin-ops-sections.spec.ts` once the local stack is already running.

## Final Recommendation

1. Patch verified admin ops gaps now.

## Operator Scenarios

1. Payment succeeds but booking not assigned
   - Detection: Payment operations shows open anomalies and stuck payment counts; dispatch backlog shows invalid assignment and review-required queues.
   - Admin location: `/admin/ops` Payment operations, Dispatch backlog, Review Required, and Open anomalies links.
   - Operator action: Open the linked booking/anomaly, review payment lifecycle state, then use existing dispatch exception or booking detail actions when eligible.
   - Remaining gap: No single guided recovery workflow exists for every payment-succeeded/unassigned variant.

2. Cron stops running
   - Detection: System Health marks payment reconciliation or remaining-balance auth cron `CRITICAL` when the latest run is missing or stale.
   - Admin location: `/admin/ops` System Health.
   - Operator action: Confirm scheduler/process health, inspect API logs for the cron kind, and restart or redeploy the API if the process is unhealthy.
   - Remaining gap: Cron health is in-memory only and resets on process restart; no durable cron run ledger or operator retry button exists yet.

3. Slot holds accumulate / leak
   - Detection: Slot Hold Integrity shows active, expired, and consumed hold counts and warns when expired persisted holds are present.
   - Admin location: `/admin/ops` Slot Hold Integrity.
   - Operator action: Verify cleanup worker/API scheduler health and inspect affected hold rows before running any manual database cleanup.
   - Remaining gap: No admin drilldown or cleanup action exists for expired holds; consumed count is the existing process metric because confirmed holds are deleted.

4. FO supply becomes invalid
   - Detection: FO Supply Readiness surfaces ready, blocked configuration, and inactive/restricted franchise owners with reasons.
   - Admin location: `/admin/ops` FO Supply Readiness.
   - Operator action: Open the affected FO/admin configuration and correct missing schedule, provider, travel, or status settings.
   - Remaining gap: The ops page reports supply blockers but does not provide one-click remediation from the summary card.

5. Cross-tenant data issue
   - Detection: Tenant enforcement now fails closed on booking creation and tenant-scoped booking reads; anomalies/backlog may expose downstream symptoms.
   - Admin location: Booking detail/admin exception surfaces when a specific booking is involved.
   - Operator action: Validate tenant context and affected booking/customer records before escalating for data repair.
   - Remaining gap: No dedicated cross-tenant audit dashboard exists; investigation still requires targeted record inspection.
