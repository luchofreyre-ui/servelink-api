# Nu Standard + ServeLink — Critical Path Execution Audit (v1)

**Document type:** Governance-backed execution prioritization (launch-critical truth extraction).  
**Inputs (mandatory):**

| Input | Path |
|-------|------|
| Completion census | `docs/audits/NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md` |
| Primitive registry | `docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md` |
| Phase 0 protocol | `docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md` |
| Deploy truth | `docs/operations/production-deployment-governance-v1.md` |
| Merge / CI governance | `docs/operations/ci-and-merge-governance-v1.md` |
| Warehouse refresh governance | `docs/operations/warehouse-refresh-scheduling-governance-v1.md` |
| Admin ops backend audit | `docs/system-audits/admin-ops-backend-reporting-audit-20260427.md` |

**Explicit non-goals:** roadmap brainstorming, feature ideation, speculative scaling, VC narrative.

**Evidence discipline:** Claims cite repo artifacts. **Production runtime** (actual Railway/Vercel env values, live Stripe posture) is **UNKNOWN** here unless stated as operator-owned verification per deploy governance.

---

## Phase 0 — Input reconciliation

### Baselines separated

| Layer | Definition | Evidence hook |
|-------|------------|----------------|
| **`origin/main`** | Integration branch as fetched from `origin` | PR **#144** / commit **`80cca00`** merged **`OperationalAnalyticsRefreshRun`**, refresh-run services, and **`GET refresh-runs`** alongside **`POST refresh-snapshots`** (`services/api/prisma/schema.prisma`; `operational-analytics-refresh-run.service.ts`; see **`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`**). |
| **Local WIP branches** | Branches not merged to `origin/main` | Treat any local-only tree as **non-canonical for production** until merged. |
| **Production runtime** | Live deploy + env | Governed by `production-deployment-governance-v1.md`: **`main` green ≠ production updated**; parity requires HTTP + Railway history checks—**not asserted** in this doc. |
| **Merged-but-unproved cadence** | Governance substrate merged; autonomous cron still policy-off | **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`** stays gated until operator-owned **manual `POST …/refresh-snapshots`** proof in the target environment (`warehouse-refresh-scheduling-governance-v1.md`; OA merge proof §6). |

### Registry vs `origin/main` (**OperationalAnalyticsRefreshRun** — reconciled)

**PR #144** (**commit `80cca00`**) merged the **`OperationalAnalyticsRefreshRun`** model and OA refresh governance substrate. **Remaining OA gap is not model absence on `origin/main`.** **Remaining OA gap:** target-environment **manual `POST …/refresh-snapshots`** proof (captured counters / freshness fields) **before** **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON=true`**.

### Manual warehouse refresh on `origin/main`

`admin-operational-intelligence.controller.ts` exposes **`POST refresh-snapshots`** with refresh-run ledger semantics post-**#144**. Distinction vs automation remains: **cron** warehouse refresh is separate (**CP-10**, **`CronRunLedger`** correlation per registry §12).

---

## Phase 1 — True operational completion definition

**Definition used here:** Nu Standard is **operationally complete** when the platform can **run the cleaning business day-to-day** with **admin/operator workflows** and **automated reliability paths** such that **routine success does not depend on engineers fixing production**, **except** for explicitly documented manual runbooks where automation is intentionally off.

This is **not** “every envisioned subsystem shipped.” It **is** “money, schedule, dispatch, customer commitments, and operational visibility hold together under normal load.”

| Criterion | MUST be true for completion | Evidence-backed notes |
|-----------|------------------------------|------------------------|
| Customer booking independence | Customers can complete booking + deposit path via **implemented** public API + web without engineer hotfixes | Public funnel exists (`public-booking-orchestrator.controller.ts`, `/book` pages); **live** Stripe + inventory correctness = deploy/env proof |
| Payment reliability | Webhooks + intents + reconciliation **paths exist**; anomalies **surfaced** to ops | Stripe controllers + ops anomaly surfaces exist; **cron-assisted reconciliation opt-in** (`ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON` pattern per census) |
| Scheduling reliability | Holds/slots/recurring **implemented** | Modules + migrations cited in census |
| Admin operational independence | Ops can see backlog health and act **without DB diving** | **Partially contradicted** by `admin-ops-backend-reporting-audit-20260427.md` (cron health + slot hold summary gaps) |
| Dispatch reliability | Offers/progression **implemented**; automation **may be cron-gated** | `dispatch.worker.ts` + `ENABLE_DISPATCH_CRON`; if disabled, **operator/manual cadence required** — still “complete” only if that cadence is **operationally owned**, not engineering-default |
| Reconciliation | Ledger + admin reconcile endpoints exist; **batch reconciliation may be cron-gated** | Ledger admin controller + Stripe reconcile admin controller |
| Observability | Health/readiness + operational surfaces | `/api/v1/system/health`, `/api/v1/system/readiness`; OA dashboard + cron ledger grouping in `operational-intelligence-query.service.ts` (**partial** coverage vs all crons) |
| Anomaly handling | Admin queues + ack/resolve flows | `anomalies.admin.controller.ts` (+ audit inventory) |
| Replay / auditability | Analytics replay suite + audits **exist**; bounded to analytics read models per registry | Registry §4; **not** automatic proof of financial replay completeness |
| Deployment safety | Documented merge≠deploy discipline | `production-deployment-governance-v1.md` |
| Operational governance | Phase 0 + registry + CI governance checks | `docs/governance/*`, PR CI |
| Recurring customer support | Recurring modules + admin ops summary endpoints | `recurring.ops.controller.ts`; UI patched per 2026-04-27 audit |
| FO/admin tooling sufficiency | FO shell + dispatch response endpoints | Routes cited in census |

---

## Phase 2 — Critical path extraction

**Scope:** Only items that **block** safe real-world operation, **operational independence**, **deploy/runtime truth**, or **trustworthy financial posture** — derived from census + governance docs, not feature imagination.

**Priority tags**

| Tag | Meaning |
|-----|---------|
| **MUST_HAVE** | Launch / safe operations blocked without it |
| **SHOULD_HAVE** | High leverage for independence; painful without |
| **POST_LAUNCH** | Explicitly gated policy items (often automation) |
| **GOVERNED_BUT_DISABLED** | Implemented; default-off env per code |

### Critical path table

| ID | Subsystem | Priority | Current state | Evidence | Why critical path | Dependency chain | Failure mode if unfinished | Partial? | Governed? | Runtime-proven? | Severity |
|----|-----------|----------|---------------|----------|-------------------|------------------|----------------------------|----------|-----------|-----------------|----------|
| CP-1 | **Production deploy parity** | MUST_HAVE | Process documented; **not automatic from merge** | `production-deployment-governance-v1.md` | Operators cannot trust features/customer flows are live | Merge → **explicit deploy** → HTTP parity checks | Silent prod skew; “works in CI” hallucination | N/A (process) | Yes (doc) | **UNKNOWN** without operator logs | **CRITICAL** |
| CP-2 | **Authoritative `ENABLE_*` matrix** | MUST_HAVE | Code proves many crons **skip** unless env true | Census grep set (`ENABLE_DISPATCH_CRON`, `ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON`, billing crons, OA warehouse cron, workflow timer wake, etc.) | Unknown toggles ⇒ unknown automation vs stall | Deploy parity → env inventory → **runbook** → staged enables | Dispatch/outbox/payments stagnate; incidents need engineers | Yes (crons exist) | Partial (ledger skips recorded) | **UNKNOWN** (env) | **CRITICAL** |
| CP-3 | **Registry/schema truth alignment** | MUST_HAVE | **`OperationalAnalyticsRefreshRun` merged on `origin/main`** via PR **#144** (`80cca00`); ongoing discipline for **future** primitives | Schema + **`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`** | Phase 0 reuse requires merged anchors match registry | **Maintain** Phase 0 + registry updates on changes (**residual OA:** env proof before cron—**not** missing model) | Drift returns if later merges diverge from registry | Yes | Yes | **UNKNOWN** (deploy parity) | **MEDIUM** |
| CP-4 | **Manual OA refresh proof before cron** | MUST_HAVE (policy gate) | Governance mandates manual proof first | `warehouse-refresh-scheduling-governance-v1.md` § cadence + observability | Enabling cron without proof violates stated governance | Successful manual `POST refresh-snapshots` in target env → capture counters → consider cron | Bad cadence / load / false confidence in dashboards | **Manual POST exists on `main`** | Yes | **Requires env action** | **HIGH** |
| CP-5 | **Admin ops independence gaps** | SHOULD_HAVE → MUST_HAVE *if* single admin runs ops | Backend signals without UI / summaries | `admin-ops-backend-reporting-audit-20260427.md` (cron health, slot holds) | Operators depend on engineering/DB for situational awareness | Read-only reporting lanes → deploy | Slower incident response; hidden backlog | Partial endpoints exist | Yes | Partial | **HIGH** |
| CP-6 | **Dispatch automation enablement decision** | SHOULD_HAVE / conditional MUST_HAVE | Cron gated | `dispatch.worker.ts` | If false and no compensating manual dispatch cadence, **progression depends on hidden process** | CP-2 → operational proof → enable or formalize manual SOP | Jobs stuck in pre-dispatch states | Yes | Yes (`CronRunLedger` paths) | **UNKNOWN** | **HIGH** |
| CP-7 | **Operational outbox processor enablement** | SHOULD_HAVE / conditional MUST_HAVE | Cron gated | `operational-outbox.processor.cron.ts` | Delivery latency / backlog if processor never runs | CP-2 → proof `POST …/process-once` or cron enable per ops doc | Customer comms drift | Yes | Yes | **UNKNOWN** | **HIGH** |
| CP-8 | **Workflow timer wake** | SHOULD_HAVE (when timers used heavily) | Cron gated | `workflow-timer-wake.cron.ts` | stalled workflows if only cron advances timers | Admin `timers/process-once` **or** enable cron (registry warns separation from warehouse refresh) | Workflow stalls | Yes | Yes | **UNKNOWN** | **MEDIUM–HIGH** |
| CP-9 | **Billing reconciliation / integrity crons** | SHOULD_HAVE for hands-off money hygiene | Several opt-in / env-conditional patterns | Census list (`integrity.sweep`, `refunds`, `remaining-balance`, `payment-lifecycle-reconciliation`) | Without enables, **more manual finance vigilance** | Policy + CP-2 → staged enables | Silent drift, anomaly volume | Yes | Yes | **UNKNOWN** | **HIGH** (finance-heavy ops) |
| CP-10 | **OA warehouse cron** | POST_LAUNCH automation candidate | Explicit default-off | `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` + warehouse governance | Analytics lag ≠ booking truth, but **command surface deception** if misunderstood | CP-4 → observability → conservative cadence | Stale dashboards only if ops understand staleness semantics | Yes scaffold | Yes | N/A until enabled | **MEDIUM** |

---

## Phase 3 — Execution order

**Rules applied:** minimize governance drift & duplicate authority (Phase 0); **no cron enablement without deploy parity + proof**; prefer **visibility before autonomy**; align registry with schema before extending primitives (**OperationalAnalyticsRefreshRun** alignment satisfied post-**#144**).

### 1. Implementation order (lanes — repo-grounded)

| Seq | Lane | Rationale |
|-----|------|-----------|
| I1 | **Maintain registry/schema discipline** for refresh-run primitive (substrate merged **#144**) | Keeps Phase 0 honest; **`CORRELATE_EXISTING_PRIMITIVES`** for cron vs manual per registry §12. |
| I2 | **Admin read-only observability** for remaining cron health + slot holds | Directly addresses proven gaps in `admin-ops-backend-reporting-audit-20260427.md` without new execution authority. |
| I3 | **Correlation metadata only** between `CronRunLedger` rows and manual refresh narratives when both active | Registry-aligned; avoids third ledger. |
| I4 | **Runbook + typed env inventory** (documentation/scripts **outside** feature code if desired) | Satisfies CP-2; no cron flip implied. |

### 2. Merge order

| Seq | Merge unit | Rationale |
|-----|------------|-----------|
| M1 | OA refresh governance implementation (**done:** PR **#144** / **`80cca00`**) | Registry/schema alignment for **`OperationalAnalyticsRefreshRun`** restored on `main`. |
| M2 | Admin observability increments | Low blast radius if read-only. |
| M3 | Any workflow/dispatch/payment mutation lanes **only** after CI green + migration governance satisfied | `ci-and-merge-governance-v1.md` |

### 3. Deployment order

| Seq | Deploy step | Rationale |
|-----|-------------|-----------|
| D1 | Deploy API **or** web **only** when lane isolation dictates; verify parity | `production-deployment-governance-v1.md` § parity skew |
| D2 | Post-deploy: `/api/v1/system/readiness`, migration logs, route existence probes | Same doc § verification |
| D3 | Record deployed SHA vs `origin/main` | Anti-drift |

### 4. Operational proof order (before autonomy)

| Seq | Proof | Gate |
|-----|-------|------|
| P1 | Manual **`POST …/refresh-snapshots`** success in target env + captured counters | Warehouse governance |
| P2 | Explicit **`ENABLE_*` decision log** per subsystem | CP-2 |
| P3 | If enabling dispatch/outbox/workflow/billing crons: observe **`CronRunLedger`** outcomes (already queried for OA warehouse job name in intelligence query service pattern) | Ledger-backed proof |
| P4 | Replay classification / analytics audits — **verify intended scope** (analytics read models only per registry) | Avoid mistaking analytics replay for money replay |

---

## Phase 4 — Governed-but-disabled inventory

| System | Implemented | Governed | Disabled mechanism | Why disabled (repo-stated) | Missing proof | Gate to enable | Launch-required? |
|--------|-------------|----------|--------------------|---------------------------|---------------|----------------|------------------|
| OA warehouse refresh cron | Yes (`operational-analytics-warehouse-refresh.cron.ts`) | Yes (`warehouse-refresh-scheduling-governance-v1.md`) | `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON !== "true"` → skip | Manual proof before cadence | Successful manual refresh + observability | Env true + monitoring | **No** — POST_LAUNCH automation candidate |
| Dispatch worker ticks | Yes (`dispatch.worker.ts`) | Partial (`CronRunLedger` when paths hit) | `ENABLE_DISPATCH_CRON` | Safety / rollout control | Dispatch progression acceptable under load | Env true + ops checklist | **Depends** on Nu Standard dispatch SOP |
| Operational outbox processor cron | Yes (`operational-outbox.processor.cron.ts`) | Yes (comment: prefer process-once early) | `ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON` | Batch delivery caution | Queue depth / latency acceptable | Env true or alternate worker | **Depends** on comms SLA |
| Workflow timer wake | Yes (`workflow-timer-wake.cron.ts`) | Yes (separate from warehouse refresh) | `ENABLE_WORKFLOW_TIMER_WAKE_CRON` | Optional tick | Timer backlog acceptable | Env true or admin process-once cadence | **Depends** on workflow usage |
| Payment lifecycle reconciliation cron | Yes (`payment-lifecycle-reconciliation.cron.service.ts`) | Yes (env semantics in code) | Explicit false disables | Controlled reconciliation blast radius | Anomaly rates monitored | Env policy | Finance posture dependent |
| Remaining balance authorization cron | Yes (`remaining-balance-authorization.cron.service.ts`) | Similar | Env gate pattern | Controlled batch | Same | Env policy | Finance dependent |
| Refund cron | Yes (`refunds.cron.service.ts`) | Commented opt-in safety net | `ENABLE_REFUND_CRON !== "true"` | Safety | Same | Env true | Usually POST_LAUNCH |
| Integrity sweep | Yes (`integrity.sweep.cron.ts`) | `ENABLE_INTEGRITY_SWEEP` | Env gate | Controlled sweep | Same | Env true | SHOULD_HAVE hygiene |

**OA refresh run ledger + replay classification:** **Merged on `origin/main`** via PR **#144** (**`80cca00`**). **Remaining gap:** target-environment manual **`POST refresh-snapshots`** proof before **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`**—**not** model absence.

---

## Phase 5 — Real-world failure risk analysis (practical)

| Risk | Why it hurts | Evidence |
|------|--------------|----------|
| **Deploy drift** | Customer/admin sees CI-green features; prod 404 / stale behavior | Deploy governance doc historical lesson |
| **Invisible cron posture** | Dispatch/outbox/finance timers silently idle | Env gates + skip paths |
| **Misread analytics staleness** | Ops assumes warehouse mirrors live posture | Warehouse governance “staleness interpretation” table |
| **Registry/schema mismatch** | Wrong team builds overlapping primitives if drift reappears on future merges | Census CP-3 (**OA primitive merged #144**) |
| **Duplicate authority on refresh** | Split narratives between cron ledger and manual refresh without correlation keys | Registry §12 correlation rule |
| **Admin dependence on engineers** | Cron + hold blind spots | Admin ops audit gaps |
| **Financial anomaly storms without batch reconciliation** | More manual Stripe/dashboard work | Opt-in reconciliation crons |

---

## Phase 6 — Final execution truth

1. **Launch-blocking (until satisfied):** **Deploy parity discipline** + **`ENABLE_*` truth** + **Phase 0/registry discipline** ( **`OperationalAnalyticsRefreshRun`** merged **#144**) + **manual warehouse refresh proof policy** before any warehouse cron.  
2. **Not launch-blocking:** OA warehouse **scheduled** cron (explicitly POST_LAUNCH candidate per warehouse governance) **if** operators accept manual refresh cadence + staleness semantics.  
3. **Post-launch:** Conservative automation ramps (warehouse interval), optional refund cron safety net, deeper replay/science cadences **after** observability proof.  
4. **Must NEVER enable before proof:** Any cron that advances dispatch, outbox, workflow, or finance batches **without** D1–D3 deploy parity + ledger/anomaly monitoring story — **contradicts existing governance posture**.  
5. **Dangerously under-governed:** **Production env reality** (unknown here): toggles may be unset without documentation → **operational fiction**.  
6. **Overbuilt relative to bare launch:** Large analytics/replay surface area **if** Nu Standard initially needs only core booking + dispatch + payments; however repo already carries it — **avoid parallel systems**, not necessarily delete.  
7. **Fastest path to operational completion *without* governance debt:** (a) verify deploy parity for merged OA routes, (b) ship **read-only** admin observability for cron/holds, (c) lock deploy+env runbooks, (d) prove manual paths, (e) enable automation **one subsystem at a time** with ledger proof — matches Phase 3 ordering.  
8. **Next five highest-leverage implementation lanes (evidence-tied, non-speculative):**

| # | Lane | Ties to |
|---|------|---------|
| L1 | Operator **manual `POST refresh-snapshots`** proof in target env + parity vs merged **#144** surfaces | CP-4, OA merge proof §6 |
| L2 | **Read-only admin endpoints + UI** for cron ledger summaries beyond partial intelligence grouping / slot-hold rollup | Admin audit gaps |
| L3 | **Correlation fields** between manual refresh runs and `CronRunLedger` metadata (no third ledger) | Registry `CORRELATE_EXISTING_PRIMITIVES` |
| L4 | **Runbook artifact** listing production `ENABLE_*` values + owners + rollback | CP-2 |
| L5 | **Dispatch/outbox enable playbooks** with acceptance checks using existing health + anomaly surfaces | CP-6, CP-7 |

---

## Appendix A — Dependency sketch (text DAG)

```
CP-1 Deploy parity ──┬──► CP-2 Env matrix ──► P3 Ledger proofs ──► (optional cron enables)
                     │
CP-3 Registry/schema discipline (OA merged **#144**) ──► D2 Migrate deploy verification
                     │
CP-4 Manual refresh proof ──► POST_LAUNCH OA cron consideration
                     │
CP-5 Admin observability ──► Operational independence
```

---

## Appendix B — MUST / SHOULD / POST_LAUNCH summary

| Bucket | IDs |
|--------|-----|
| **MUST_HAVE** | CP-1, CP-2, CP-3, CP-4 |
| **SHOULD_HAVE** | CP-5, CP-6, CP-7, CP-8, CP-9 |
| **POST_LAUNCH** | CP-10 + selective cron enables after proof |

---

## Validation checklist (authoring)

- [x] Census artifact referenced; findings reused without inventing new subsystem names.  
- [x] Registry + Phase 0 + warehouse refresh governance cited.  
- [x] `origin/main` vs historical pre-**#144** OA refresh branch context **explicitly** separated.  
- [x] No fabricated production URLs or env values.  
- [x] File/route references verified against repo (`admin-operational-intelligence.controller.ts` `refresh-snapshots` / `refresh-runs`; refresh-run service **on `origin/main`** post-**#144**).

**STOP** — read-only audit artifact complete.
