# Warehouse refresh scheduling governance (v1)

Governed cadence and observability expectations for **operational analytics warehouse** refreshes — **documentation and operator process only** until an explicit implementation lane is approved.

---

## Purpose

Warehouse refreshes **hydrate read-only analytics / replay / graph / science materializations** used by the admin command surface. They **replace snapshot rows** for a configured aggregate window so dashboards can show persisted batches, replay timelines, topology archives, cohort frames, and related aggregates.

---

## Explicit non-goals

Warehouse refresh **must never** be confused with or substituted for:

- **Booking mutation** (status, assignment, schedule, lifecycle).
- **Payment mutation** (Stripe intents, captures, refunds, reconciliation side-effects beyond reading counts).
- **Dispatch mutation** (offers, routing execution).
- **Workflow timer processing** — that is **`POST /api/v1/admin/workflow-executions/timers/process-once`** and optional **`WorkflowTimerWakeCron`**; **do not** invoke it from warehouse automation without a separate governance decision.
- **Autonomous optimization**, auto-approval, or customer-facing behavior changes.

---

## Manual refresh contract (canonical today)

| Item | Detail |
|------|--------|
| **Route** | **`POST /api/v1/admin/operational-intelligence/refresh-snapshots`** |
| **Auth** | **Admin JWT** (`JwtAuthGuard` + `AdminGuard`) |
| **Body** | Optional `{ "aggregateWindow": "<window>" }`; default window is the platform **`AS_OF_NOW`** constant. |
| **Behavior** | Calls **`OperationalAnalyticsAggregationService.refreshPlatformOperationalSnapshots`**, which **reads** operational/workflow/booking counts and **writes** analytics warehouse tables (snapshots, aggregates, and chained snapshot batches — replay/graph/science/incident paths as implemented). |
| **Distinct from** | **`POST /api/v1/admin/operational-intelligence/replay-compare`** — explicit pairwise replay comparison for selected sessions; still analytics-side, but **not** the bulk warehouse refresh. |

**Product copy:** The operational intelligence dashboard describes refresh as **explicit POST only; never auto-scheduled from this surface** (see `operational-intelligence-query.service.ts`). This governance doc **does not** change runtime behavior until **Warehouse Refresh Cron V1** is implemented and approved.

---

## Recommended cadence (policy)

1. **Manual after major operational movement** — merges/releases touching workflows, replay, or ops-heavy periods: run **one authenticated refresh** and verify observability fields (below).
2. **Scheduled candidate — only after authenticated one-time proof** — once a manual refresh has succeeded in production and response counters are captured, consider automation on an interval of **15–60 minutes** (environment-specific). Start conservative (e.g. **hourly**).
3. **Daily deeper replay/science snapshot candidate** — optional later lane if panels need longer horizons; define separately so bulk refresh duration and DB load are acceptable.

---

## Staleness interpretation

| Observation | Meaning |
|-------------|---------|
| **Empty warehouse panels** | **Not** proof the system is broken — often **no refresh yet** or **no upstream producer rows** for that subsystem. |
| **Stale warehouse** | **Not** the same as live ops failure — **live counters** on approvals/workflows/bookings remain authoritative for **current** posture until snapshots are refreshed. |
| **Stale warehouse** | **Is** a signal that command-surface **persisted history** (replay/graph/science) may lag; prioritize refresh or automation **after** observability is in place. |

---

## Required observability before automation

Before enabling **any** cron or external scheduler that calls the refresh path, operators must be able to see (via logs, admin API, or admin UI — implementation TBD in **Warehouse Refresh Cron V1**):

| Signal | Why |
|--------|-----|
| **Last refresh started** (`startedAt`) | Proves a run was attempted. |
| **Last refresh succeeded / failed** | Binary health. |
| **Duration** | Detect slow runs / DB pressure. |
| **Snapshots / aggregates written** | Confirms core warehouse write path. |
| **Replay sessions / frames / diffs written** (as applicable) | Confirms replay materialization path. |
| **Graph nodes / edges / chronology frames written** (as applicable) | Confirms entity-graph batch path. |
| **Science / cohort / validity rows written** (as applicable) | Confirms science & validity batches. |
| **Error text if failed** | Diagnosis without guessing. |

**Structured logging today:** Successful refresh emits **`OPERATIONAL_ANALYTICS_REFRESH`** with `windowKey`, `snapshotsWritten`, `aggregatesWritten`; subsystem failures are **warn** logs per batch (`OPERATIONAL_*_REFRESH_FAILED`). Automation should **extend** visibility (e.g. **`CronRunLedger`** metadata + admin surfacing), not replace operator judgment.

---

## Failure policy

- Failures should **alert admin ops** (logging, monitoring, future UI strip); they **must not** mutate bookings, payments, dispatch, or customer flows.
- **No retry storm** — backoff and/or skip until next scheduled window unless a human triggers a manual retry.
- **No customer-facing degradation** — warehouse refresh is **admin/analytics** scope; customers do not depend on snapshot freshness for booking UX.

---

## Automation approval gate (all required)

Automation (**Warehouse Refresh Cron V1** or equivalent) is **not** approved until:

1. **One authenticated manual refresh** in production proves **HTTP 200**, **`ok: true`**, and **response counter shape** (snapshots/aggregates + subsystem counts as applicable), with **no unintended business mutation** (spot-check bookings/payments unchanged).
2. **Feature flag** — env-gated **default off** or **explicit enable** (mirror **`ENABLE_*_CRON`** patterns for payment lifecycle crons).
3. **`CronRunLedger` row** per run — reuse **`CronRunLedgerService`** (`recordStarted` / `recordSucceeded` / `recordFailed` / `recordSkipped`) with **`jobName`** stable and **`metadata`** carrying written counts and `aggregateWindow`.
4. **Admin health surface** — extend existing **cron ledger** / ops summary patterns (see admin ops backlog / command center cron tiles) so warehouse refresh runs are visible alongside reconciliation crons.

Until all four hold, remain on **manual POST only**.

---

## Existing platform patterns (reuse)

| Pattern | Location | Behavior |
|---------|----------|----------|
| **Nest `@Cron` + env disable** | `payment-lifecycle-reconciliation.cron.service.ts`, `remaining-balance-authorization.cron.service.ts` | `*/15 * * * *`, **`ENABLE_*` explicit false** skips run and ledger **`skipped`**. |
| **`CronRunLedgerService`** | `common/reliability/cron-run-ledger.service.ts` | Persists **`CronRunLedger`** rows: `jobName`, `status`, `startedAt`, `finishedAt`, `durationMs`, `errorMessage`, `metadata`. |
| **Dispatch worker crons** | `dispatch.worker.ts` | Higher frequency; ledger-wrapped; swallow errors to avoid process crash — **different risk profile** than warehouse refresh. |
| **Manual-only refresh** | `admin-operational-intelligence.controller.ts` | **`refresh-snapshots`** — **no `@Cron`** today. |

**Operational intelligence copy** explicitly distinguishes **refresh-snapshots** (analytics) from **`timers/process-once`** (workflow timers).

---

## Next implementation lane

**Warehouse Refresh Cron V1** — only after this governance doc is acknowledged and the **automation approval gate** checklist is satisfied.

Prerequisite operational lane: **Authenticated Manual Refresh Proof V1** — one production POST with captured response JSON and timestamp.

---

## Related docs

- `docs/operations/production-deployment-governance-v1.md`
- `docs/operations/railway-deploy-hygiene-v1.md`
- `DEPLOY_CLOSEOUT_CHECKLIST.md`
