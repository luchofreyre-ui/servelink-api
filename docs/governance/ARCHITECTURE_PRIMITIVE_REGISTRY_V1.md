# ServeLink Architecture Primitive Registry (v1)

**Status:** Living document. Update when adding **new durable execution, audit, lock, or orchestration primitives**.

**Companion:** [`PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](./PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md)

---

## How to read this registry

- **Authority scope:** What this primitive is allowed to decide or record (single source of truth for that concern).
- **Reuse guidance:** Preferred action for new features touching this area.
- **Duplication risk:** What goes wrong if a second primitive claims the same authority.

This registry is **evidence-grounded** (paths point at real code). It is **not** an exhaustive catalog of every Prisma model—only primitives that shape **execution narrative, concurrency, audit, orchestration, or lineage**.

---

## 1. Execution / run ledgers

| Primitive | Source files | Domain | Purpose | Authority scope | Reuse guidance | Duplication risk | Extend? | Isolated? |
|-----------|--------------|--------|---------|-----------------|----------------|------------------|---------|-----------|
| **`CronRunLedger`** | `services/api/prisma/schema.prisma` (`CronRunLedger`); `services/api/src/common/reliability/cron-run-ledger.service.ts` | Cross-cutting cron reliability | Append-oriented record per cron job invocation: `started` / `succeeded` / `failed` / `skipped`, timings, `metadata` JSON | **Cron-plane** truth for scheduled ticks | **Reuse** for any **scheduled** job needing ledger visibility | Second ledger per cron job causes split narratives | Yes (metadata, callers) | No |
| **`OperationalAnalyticsRefreshRun`** | `schema.prisma`; `services/api/src/modules/operational-analytics/operational-analytics-refresh-run.service.ts`; `admin-operational-intelligence.controller.ts` | Operational analytics warehouse refresh | Durable audit + single-flight + stale `started` reconciliation for **explicit** refresh (`POST …/refresh-snapshots`) | **Manual / explicit HTTP** warehouse refresh governance anchor | **Extend** for OA refresh phases/correlation keys—not a second run table | Parallel “refresh run” table duplicates authority | Yes (narrow columns) | No — OA-specific |
| **`WorkflowExecution`** (+ related rows) | `schema.prisma` (`WorkflowExecution`, `WorkflowExecutionStep`, timers, waits); `services/api/src/modules/workflow/**` | Booking/workflow orchestration | Long-lived workflow state machine: `state`, `executionStage`, payloads, steps | **Workflow lifecycle** for aggregates (e.g. booking) | **Reuse** workflow engine for workflow features—not for warehouse batch refresh | Using workflow tables for analytics refresh conflates domains | Via workflow module APIs | Intentionally **domain-bound** to workflow |
| **`SystemTestPipelineJob`** | `schema.prisma`; `services/api/src/modules/system-tests-pipeline/**` | System test CI/CD orchestration | Durable pipeline rows: `stage`, `status`, `dedupeKey`, Bull queue linkage | **System-test pipeline** plane only | **Reuse** for system-test stages only | Treating as general job runner duplicates Bull + ledger patterns | Yes within subsystem | **Yes** — subsystem isolated |
| **`SystemTestRun`** (+ intelligence) | `schema.prisma`; ingestion/analysis modules | System tests | Run ingest + `SystemTestRunIntelligence` (`sourceContentHash`, analysis) | Test **run** artifact truth | Reuse for test analytics—not production booking paths | N/A for prod mutation domains | Yes | **Yes** |

---

## 2. Cron / scheduler systems

| Primitive | Source files | Purpose | Authority | Notes |
|-----------|--------------|---------|-----------|-------|
| **`@nestjs/schedule` cron classes** | e.g. `operational-analytics-warehouse-refresh.cron.ts`, `workflow-timer-wake.cron.ts`, `billing/*.cron*.ts`, `operational-outbox.processor.cron.ts` | Time-triggered ticks | Each domain owns its cron; **ledger** via `CronRunLedger` when wired | Warehouse OA cron uses env gate `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` |
| **`CronRunLedgerService`** | `common/reliability/cron-run-ledger.service.ts` | Normalize recordStarted/Succeeded/Failed/Skipped | Cron observability | Safe shared helper |

---

## 3. Workflow systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **Workflow engine surface** | `services/api/src/modules/workflow/**`; `workflow.constants`, orchestration preview/simulation | Execute and persist workflow state, approvals, governance |
| **Workflow analytics aggregates** | `WorkflowAnalyticsAggregate` in schema; queried by operational intelligence | Read-model snapshots derived from workflow/posture—not a second workflow executor |

**Rule:** Workflow **execution authority** stays in the workflow module. Analytics **reads** aggregates; it does not replace workflow state.

---

## 4. Replay / audit systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **Operational replay graph** | `OperationalReplaySession`, `OperationalReplayDiff`, `OperationalReplayFrame`, … in schema; `operational-replay-*.ts`, `operational-replay-intelligence-suite.service.ts` | Deterministic replay archives and comparisons for **analytics read models** |
| **Replay classification (warehouse refresh)** | `operational-analytics-refresh-replay.classification.ts` | Audit-only comparison of **successful** refresh runs (counters + freshness envelope)—does not block execution |
| **Ops / dispatch / estimate audits** | `OpsAlertAudit`, `DispatchConfigPublishAudit`, `EstimateAccuracyAudit`, `WorkflowApprovalAudit` | Domain-specific mutation/observation audit trails |

---

## 5. Idempotency systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **DB unique `idempotencyKey`** | Many models (e.g. `JournalEntry`, `PayoutBatch`, booking/payment intents)—see `schema.prisma` grep | **Financial and critical mutation** exactly-once semantics (`P2002` retry-read patterns in services) |
| **`IdempotencyInterceptor`** | `services/api/src/common/reliability/idempotency.interceptor.ts` | Short-lived HTTP response dedupe by header (in-memory TTL)—not durable ledger |
| **`OperationalAnalyticsRefreshRun.idempotencyKey`** | refresh-run service | Deterministic **request fingerprint** for audit correlation—not global HTTP idempotency |

---

## 6. Lock / mutex systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **`DispatchLockService`** | `dispatch/dispatch-lock.service.ts`; `Booking.dispatchLockedAt` | Serialize dispatch attempts per booking |
| **Serializable transactions + retry (`P2034`)** | `operational-analytics-refresh-run.service.ts` | Single-flight gate + stale reconciliation for OA refresh **without** booking-row locks |
| **In-memory dispatch idempotency** | `dispatch.service.ts` (keyed map)—pattern alongside DB lock | Short-circuit duplicate dispatch triggers |

**Rule:** Booking dispatch locks **must not** be reused as a generic distributed mutex for unrelated domains.

---

## 7. Operational analytics systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **Aggregation** | `operational-analytics-aggregation.service.ts`; subgraph aggregators (balancing, outcome, entity graph, …) | Recompute deterministic snapshots |
| **Intelligence dashboard** | `operational-intelligence-query.service.ts` | Compose admin dashboard + freshness (`warehouse-operational-freshness.ts`) |
| **Warehouse freshness classification** | `warehouse-operational-freshness.ts`; cron ledger inputs | Read-model freshness—not execution lease |

---

## 8. Admin operational systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **Admin OA API** | `admin-operational-intelligence.controller.ts`; related admin OA controllers | Authenticated read/mutation surfaces for ops intelligence |
| **Web command center** | `apps/web/src/components/admin/AdminOperationsCommandCenter.tsx`, `AdminOperationalIntelligenceStrip.tsx`, audit panels | Operator UX—no independent execution authority |

---

## 9. Lineage / provenance systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **`OperationalExperimentLineage`** | schema; `operational-longitudinal-aggregation.service.ts` | Consecutive-batch / experiment lineage in warehouse (e.g. pairing categories)—**analytics lineage**, not financial provenance |
| **Snapshot versioning fields** | `analyticsEngineVersion`, `aggregateWindow`, engine constants across Operational* models | Version/window scoping for deterministic recomputation |

**Rule:** Lineage here means **analytics batch lineage**. **Ledger/journal** lineage for money is under billing/ledger modules.

---

## 10. System test orchestration systems

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **`SystemTestPipelineJob`** | schema + pipeline service | Queue-backed stages, dedupe keys |
| **BullMQ usage** | System-tests pipeline processor paths | Async execution with `jobId` / dedupe |

---

## 11. Stale reconciliation patterns

| Primitive | Source files | Purpose |
|-----------|--------------|---------|
| **OA refresh stale `started`** | `operational-analytics-refresh-run.service.ts` (`reconcileStaleStartedRunsInTx`); constants in `operational-analytics.constants.ts` | Terminalize orphan `started` refresh rows past threshold |
| **Operational presence stale** | `operational-command-presence.service.ts` (`OPERATIONAL_PRESENCE_STALE_MS`) | Omit stale **operator heartbeats** from presence snapshots—**not** refresh leases |

---

## 12. Known overlap / correlation points (do not duplicate)

| Pair | Relationship |
|------|----------------|
| **`OperationalAnalyticsRefreshRun` ↔ `CronRunLedger`** | **Parallel narratives:** manual refresh vs cron tick both touch warehouse recomputation; **different tables by design today**. Future work should **CORRELATE** (shared correlation id / dual-write policy), not invent a third ledger. |
| **`CronRunLedger` ↔ OA cron service** | OA warehouse cron **already** records ledger rows when enabled—extend metadata there for cron-side detail. |
| **`WorkflowExecution` ↔ OA refresh** | **No merge.** Workflow owns workflow lifecycles; OA refresh owns analytics warehouse batches. |

---

## Change control

- Adding a **new** category row here should accompany a **Phase 0** note in the implementing PR (see Phase 0 protocol doc).
- Prefer **one authority per execution narrative** per domain; split tables only when **planes** differ (cron vs explicit HTTP vs workflow).
