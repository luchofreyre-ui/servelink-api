# Operational Analytics Refresh Governance — Merge Proof & Runtime Context (v1)

**Purpose:** Authoritative merge-context document for the OA refresh governance lane: aligns registry claims with schema, documents verification performed locally, and separates **merged / deployed / disabled** truth without implying production action.

**Classification (Phase 0):** **`EXTEND_EXISTING_PRIMITIVE`** — adds `OperationalAnalyticsRefreshRun` + services for the **manual / explicit HTTP** warehouse refresh plane already documented in [`docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](../governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md). **`CORRELATE_EXISTING_PRIMITIVES`** applies vs **`CronRunLedger`** when both cron and manual refresh participate; **no third ledger** is introduced.

**Companion audits:** [`NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`](./NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md), [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](./NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md).

---

## 1. Subsystem scope (this PR)

| Concern | Delivery |
|---------|----------|
| Durable audit rows | Prisma model `OperationalAnalyticsRefreshRun` + migration `20260509180000_operational_analytics_refresh_run_audit` |
| Manual refresh execution | `OperationalAnalyticsRefreshRunService.executeManualWarehouseRefresh` wired from `POST …/refresh-snapshots` |
| Single-flight | Serializable transaction + active `started` row gate; **409 Conflict** via `HttpException` when blocked |
| Stale reconciliation | Orphan `started` runs past threshold terminalized to `failed` before new refresh (see constants + tests) |
| Replay classification | `operational-analytics-refresh-replay.classification.ts` — audit-only comparison across successful runs |
| Operator visibility | `GET …/refresh-runs` + web `AdminWarehouseRefreshAuditPanel` + strip wiring |

---

## 2. Operational / governance risks this resolves

| Risk (pre-merge on `main`) | Resolution |
|-----------------------------|------------|
| Registry referenced `OperationalAnalyticsRefreshRun` while **schema lacked model** | Migration + schema alignment restores **single source of truth** for manual refresh narrative |
| Weak durable trace for manual warehouse refresh | Persisted rows with fingerprint, freshness envelope, warnings |
| Concurrent manual refreshes | Single-flight + stale reconciliation |
| Silent overlap with cron plane | Refresh run records **`triggerSource`** / route metadata; cron remains separate **`CronRunLedger`** — correlate in ops tooling per registry §12 |

---

## 3. Remains intentionally disabled (unchanged)

| Item | Evidence |
|------|----------|
| Warehouse refresh **cron** | `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` — default **not** `true`; see [`docs/operations/warehouse-refresh-scheduling-governance-v1.md`](../operations/warehouse-refresh-scheduling-governance-v1.md) |
| Other subsystem crons | Dispatch, outbox, workflow timers, billing sweeps — **not** touched by this lane |

This PR **does not** enable cron or change Railway/Vercel configuration.

---

## 4. API surface (admin, authenticated)

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/api/v1/admin/operational-intelligence/refresh-snapshots` | Manual warehouse refresh via refresh-run service; **409** when blocked (active non-stale run) |
| `GET` | `/api/v1/admin/operational-intelligence/refresh-runs?limit=` | Lists recent runs, `activeRun`, stale reconciliation count, replay classification summary |

**Existing routes unchanged in contract:** `dashboard`, `replay-compare` remain; refresh POST **preserves** explicit automation semantics (comment in controller).

---

## 5. Runtime proof achieved (local / CI-class)

Executed on branch **`feat/operational-analytics-refresh-governance-v1`** prior to merge:

| Check | Command / artifact | Result |
|-------|-------------------|--------|
| Governance anchors | `npm run check:governance-docs` | Pass |
| API typecheck | `npm run typecheck:api` (root) | Pass |
| Web typecheck | `npm run typecheck:web` (root) | Pass |
| OA refresh tests | `services/api`: `npm test -- --testPathPatterns=operational-analytics-refresh` | **11** tests pass |
| Replay classification unit tests | (included above) | Pass |
| OA warehouse cron regression | `npm test -- --testPathPatterns=operational-analytics-warehouse-refresh.cron` | **3** tests pass (cron still env-gated) |
| API build | `services/api`: `npm run build` | Pass |

**Interpretation:** Proves **implementation coherence** and **non-regression** of gated cron scaffold — **not** production HTTP parity (operator-owned per deploy governance).

---

## 6. Proof still missing before cron enablement

Per warehouse refresh governance:

1. Successful **manual** `POST refresh-snapshots` in **target production** (or staging parity) with captured counters / freshness fields.
2. Operator agreement on **cadence** and **observability** (CronRunLedger rows for warehouse job name already surfaced in intelligence query patterns on `main`).
3. Explicit env flip **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON=true`** — **out of scope** for this merge unless separately approved.

---

## 7. Duplicate-authority prevention

- **Manual plane:** `OperationalAnalyticsRefreshRun` — authoritative for **HTTP-triggered** refresh attempts.
- **Cron plane:** `CronRunLedger` — authoritative for **scheduled** ticks.
- **Forbidden:** a parallel “refresh succeeded” table for the same narrative; future correlation should use **metadata / shared correlation id** per Phase 0 protocol — not a third ledger.

---

## 8. Truth separation (at merge review time)

| Layer | State |
|-------|--------|
| **This branch** | OA refresh governance implementation + this proof doc (when committed). |
| **`origin/main` (pre-merge)** | No `OperationalAnalyticsRefreshRun` model; registry/schema drift per census. |
| **Production** | **Unknown** — merge ≠ deploy (`docs/operations/production-deployment-governance-v1.md`). |
| **Cron** | **Disabled by default** — unchanged. |

---

## 9. Critical-path rationale (extract)

Aligns **critical-path item CP-3** in [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](./NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md): restores registry/schema alignment and reduces Phase 0 ambiguity without introducing duplicate execution planes.

**STOP — documentation only; no runtime flags enabled by this file.**
