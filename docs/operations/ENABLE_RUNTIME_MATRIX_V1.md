# ENABLE runtime matrix (v1)

Canonical inventory of **`ENABLE_*`** / **`NEXT_PUBLIC_*`** gates referenced by **Nu Standard / Servelink** application code for automation and diagnostics **as observed in `services/api` and `apps/web`**.

---

## Authority & boundaries

- **Merged ≠ deployed** — [`production-deployment-governance-v1.md`](./production-deployment-governance-v1.md).
- **Implemented ≠ runtime-proven** — green CI does not prove live env values; **`UNKNOWN`** unless operators snapshot Railway/Vercel (or staging parity).
- **Cron gated ≠ cron-safe** — many ticks **`recordSkipped`** in **`CronRunLedger`** when disabled ([`warehouse-refresh-scheduling-governance-v1.md`](./warehouse-refresh-scheduling-governance-v1.md), codebase).
- This matrix documents **code semantics** and **launch-facing policy placeholders**. It **does not** invent production values.

---

## How defaults were derived

| Pattern | Meaning | Variables |
|---------|---------|-----------|
| `process.env.X !== "true"` early-return | **Off when unset**; cron/UI skips unless **`true`** | Most crons below |
| **`isCronDisabledByExplicitFalse`** (`payment-lifecycle-cron-env.ts`) | **On when unset**; disabled **only** when env trimmed lowercase **`false`** | Payment lifecycle + remaining-balance auth |
| **`truthyMaster` / `"true"`\|`"1"`** | **Off when unset** / malformed safe-off | Service matrix shadow, structured booking metadata shadow |
| **`NEXT_PUBLIC_*`** | Embedded at **Next.js build**; not Nest secrets | Web toggles |

**Companion vars (not `ENABLE_*`, but operator-relevant):** `SERVICE_MATRIX_SHADOW_SAMPLE_RATE`, `SERVICE_MATRIX_SHADOW_SURFACES`, `OPERATIONAL_OUTBOX_PROCESSOR_BATCH_LIMIT`, `PAYMENT_LIFECYCLE_RECONCILIATION_CRON_BATCH`.

---

## Matrix

| Variable | Subsystem | Default | Current Launch Policy | Activation Preconditions | Required Runtime Proof | Rollback Procedure | Governed-But-Disabled | Production Safe | Notes |
|----------|-----------|---------|----------------------|--------------------------|------------------------|-------------------|----------------------|-----------------|-------|
| `ENABLE_DISPATCH_CRON` | Dispatch worker ticks (`dispatch.worker.ts`) | **Off** if unset / not exactly **`true`** | **UNKNOWN** env-dependent — treat as **governed-but-disabled posture** until matrix snapshot exists (**CP-2** lane via audits — [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md)). Manual/other progression **must** be owned per ops SOP if cron stays off. | Dispatch SLA acceptance + **`CronRunLedger`** observability plan | **`CronRunLedger`** shows **`started`/`succeeded`** when intended; dispatch backlog acceptable — evidence captured ([`DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md`](./DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md)) | Remove **`true`** or unset → **`skipped`** entries (`disabled_by_env`); observe backlog recovery path | Yes | **UNKNOWN** until env logged | High-impact automation — Master Plan forbids wholesale cron flip without CP-2 + proof ([`NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md`](../governance/NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md)). |
| `ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON` | Operational outbox batch processor cron (`operational-outbox.processor.cron.ts`) | **Off** if unset | Prefer **`POST …/process-once`** early rollout per module header — cron remains optional gated lane | Queue depth limits acceptable (`OPERATIONAL_OUTBOX_PROCESSOR_BATCH_LIMIT`) | Processor **`CronRunLedger`** success rows + latency acceptable | Set **`≠ true`** → skips logged | Yes | **UNKNOWN** | **`NODE_ENV=test`** forces **`skipped`** in code paths — CI differs from prod semantics only via env. |
| `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` | OA warehouse refresh cron (`operational-analytics-warehouse-refresh.cron.ts`) | **Off** if unset | **Post-launch automation candidate** — manual **`POST refresh-snapshots`** proof **required first** ([warehouse governance](./warehouse-refresh-scheduling-governance-v1.md)) | Automation approval gate (manual POST proof + observability + ledger correlation narrative) | **200** manual **`POST /api/v1/admin/operational-intelligence/refresh-snapshots`** with counters logged + **`OperationalAnalyticsRefreshRun`** visibility (`refresh-runs`) per OA merge proof | Set **`≠ true`** → **`recordSkipped`**; dashboards may lag — acceptable semantics ([warehouse staleness table](./warehouse-refresh-scheduling-governance-v1.md)) | Yes | Yes (**analytics-only** path — does not mutate booking/payment/dispatch per warehouse doc) | Job name **`operational_analytics_warehouse_refresh`** in **`CronRunLedger`**. |
| `ENABLE_WORKFLOW_TIMER_WAKE_CRON` | Workflow timer wake (`workflow-timer-wake.cron.ts`) | **Off** if unset | **UNKNOWN** — conditional SHOULD_HAVE when workflows relied upon heavily ([critical path audit](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md)) | Alternative **`timers/process-once`** cadence documented OR cron acceptance | **`CronRunLedger`** outcomes accept backlog semantics | Set **`≠ true`** → skips | Yes | **UNKNOWN** | Separate governance lane from warehouse refresh ([warehouse doc §explicit non-goals](./warehouse-refresh-scheduling-governance-v1.md)). |
| `ENABLE_REFUND_CRON` | Refunds cron safety net (`refunds.cron.service.ts`) | **Off** if unset (`!== "true"`) | Typically **POST_LAUNCH** optional unless finance mandates batch refunds sweep | Finance approval + anomaly discipline | Ledger **`skipped`** vs **`succeeded`** review before widen usage | Set **`≠ true`** | Yes | **UNKNOWN** | Comment in source describes optional safety-net semantics. |
| `ENABLE_INTEGRITY_SWEEP` | Billing integrity sweep (`integrity.sweep.cron.ts`) | **Off** if unset | SHOULD_HAVE hygiene candidate — env-dependent ([critical path audit](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md)) | Finance posture documented | Sweep **`CronRunLedger`** rows acceptable blast radius | Set **`≠ true`** | Yes | **UNKNOWN** | Controlled sweep — verify ledger naming before declaring prod-safe in isolation. |
| `ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON` | Payment lifecycle reconciliation (`payment-lifecycle-reconciliation.cron.service.ts`) | **On when unset** — disabled **only** when explicitly **`false`** ([`payment-lifecycle-cron-env.ts`](../../services/api/src/modules/billing/payment-lifecycle-cron-env.ts)) | **UNKNOWN** actual prod posture — absence is **not** proof cron runs ([truth separation](./production-deployment-governance-v1.md)) | Ops acknowledges reconciliation blast radius + anomaly tooling | **`CronRunLedger`** **`payment_lifecycle_reconciliation`** + ops anomalies behave acceptably | Set **`ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON=false`** (explicit) per rollback playbook ([`CONTROLLED_ACTIVATION_PLAYBOOK_V1.md`](./CONTROLLED_ACTIVATION_PLAYBOOK_V1.md)) | **Inverted semantics — Not governed-but-disabled by default** | **UNKNOWN** | Repo-derived docs ≠ deployed proof — Mis-setting **`false`** disables automation; coordinate finance/on-call. |
| `ENABLE_REMAINING_BALANCE_AUTH_CRON` | Remaining balance authorization cron (`remaining-balance-authorization.cron.service.ts`) | **On when unset** — disabled **only** when explicitly **`false`** | **UNKNOWN** actual prod posture | Same family as payment cron governance — staged observation window recommended before widening batches | Ledger rows accept anomaly posture | Set **`=false`** explicit | **Inverted semantics** | **UNKNOWN** | Shares **`payment-lifecycle-cron-env`** pattern — differs materially from **`!== "true"`** cron gates. |
| `ENABLE_SERVICE_MATRIX_SHADOW` | Service matrix shadow sampling (`service-matrix-shadow-config.ts`, callers) | **Off** when unset / malformed | **Stay default-off for shadow diagnostics** unless staged soak documented ([engineering SERVICE_MATRIX docs](../engineering/SERVICE_MATRIX_S2_SHADOW_INTEGRATION_DESIGN_V1.md)) | Payload/logging sinks validated | Sampling behaves ≤ declared **`SERVICE_MATRIX_SHADOW_SAMPLE_RATE`**; logs absent unexpected PII | Set **`false`** / unset | Yes | Yes (**non-enforcement path per design**) | Companion **`SERVICE_MATRIX_SHADOW_SAMPLE_RATE`**, **`SERVICE_MATRIX_SHADOW_SURFACES`**. |
| `ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW` | Structured booking metadata read-path shadow (`booking-operational-metadata-shadow.ts`) | **Off** when unset | Diagnostics-only — parity/backfill governance lanes decide widening ([engineering structured metadata docs](../engineering/STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md)) | Admin/read tooling observes mismatches safely | Spot logs **`structured_booking_metadata_shadow`** or equivalent diagnostics discipline | Unset / **`≠ true|1`** | Yes | Yes (shadow-only; malformed treated **off**) | Never substitutes authoritative writes — Phase 0 still applies before widening mutation lanes. |
| `NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS` | Web booking payment UX guardrail (`apps/web/src/lib/env.ts`) | **Off** unless **`=== "true"`** at **build** | **UNKNOWN** per deployed bundle — verify preview/build logs when diagnosing UX drift | Product/on-call approval before exposing manual payment tooling publicly | Spot prod **`NEXT_PUBLIC_*`** parity checklist ([deploy parity checklist](./DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md)) | Redeploy web **without** flag truthy | n/a | **UNKNOWN** | Public embed — treat like prod UX mutation gate even though analytics-risk profile differs from cron plane. |
| `NEXT_PUBLIC_ENABLE_BOOKING_UI_TELEMETRY` | Web booking telemetry (`apps/web/src/lib/env.ts`) | **Off** unless **`=== "true"`** at **build** | **UNKNOWN** per deployed bundle | Privacy/consent posture respected product-side | Verify telemetry ingress absent/leaky endpoints unintended | Redeploy web without truthy flag | n/a | **UNKNOWN** | Separate plane from Nest **`ENABLE_*`**. |

### Discovery note — UI-only reference

| Token | Repo finding |
|-------|----------------|
| `ENABLE_ORCHESTRATION_BOOKING_TRANSITION_INVOCATION` | Appears only as instructional copy in `apps/web/src/components/admin/AdminWorkflowApprovalsSection.tsx` — **no `process.env` consumer located under `services/api`** at matrix authoring time. |

---

## Related docs

- [`DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md`](./DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md) — parity verification cadence.
- [`CONTROLLED_ACTIVATION_PLAYBOOK_V1.md`](./CONTROLLED_ACTIVATION_PLAYBOOK_V1.md) — staged flip discipline (cron/env gates **orthogonal** to merge).
- [`NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`](../audits/NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md) — repository-evidence census.
- [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md) — CP-2 / CP-10 linkage.

**STOP** — documentation artifact only (matrix regeneration expectation: `rg ENABLE_[A-Z0-9_]+ services/api apps/web` on meaningful churn).
