# Nu Standard + ServeLink — Completion Census & Runtime Capability Audit (v1)

**Document type:** Canonical evidence-backed completion census (not a roadmap).  
**Audit standard:** Phase 0 inspection first; conclusions tie to repo artifacts, CI, migrations, routes, tests, and governance docs already on `main`.  
**Hard boundary:** This audit **does not** prove production HTTP/Railway/Vercel parity unless explicitly cited from repo docs—live verification remains operator-owned per `docs/operations/production-deployment-governance-v1.md` (**merged ≠ deployed**).

**Evidence baselines used during authoring:**

| Baseline | Meaning |
|----------|---------|
| **`origin/main` tree** | `git show origin/main:…` for schema/controllers where divergence from local branches matters. |
| **Working tree / branch** | Optional spot checks; local branch may carry unmerged work—**never confused with shipped `main`**. |
| **Governance** | `docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`, `docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`. |

**Spot verification performed for this revision:**

- **PR #144** (**commit `80cca00`**) merged **`OperationalAnalyticsRefreshRun`** into `services/api/prisma/schema.prisma` and shipped OA refresh governance substrate (`operational-analytics-refresh-run.service.ts`, **`GET refresh-runs`**, replay classification wiring—see **`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`**).
- **Remaining OA gap is not model absence on `origin/main`.** **Remaining OA gap:** operator-owned **manual `POST …/refresh-snapshots`** proof in the target environment **before** **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON=true`**.

---

## Phase 0 — Repo & runtime inspection summary

### Repo surfaces inventoried

| Surface | Evidence |
|---------|----------|
| API modules | 49 `*.module.ts` under `services/api/src` (Nest feature modules: bookings, billing, dispatch, workflow, operational-analytics, recurring, ledger, payouts, encyclopedia, system-tests-*, etc.). |
| API tests | ~185 `services/api/test/*.spec.ts` files; aggregate ~44k lines (wc); Jest entry via `services/api/package.json` `test` script. |
| Web app | 88 `page.tsx` routes under `apps/web/src/app` spanning `(public)`, `(admin)`, `(fo)`, `(customer)`, `admin/auth`. |
| Web CI gates | `apps/web/package.json`: Vitest, Playwright projects, `verify:local-*` scripts; `.github/workflows/pr-ci.yml` runs typecheck, build, Playwright verify flows against fresh Postgres + migrated DB. |
| Prisma | `services/api/prisma/migrations/**` — **187** `migration.sql` files present in workspace (large forward-only history). |
| API boot / migrations | `services/api/src/main.ts`: `prisma migrate deploy` before Nest boot; logs `=== MIGRATION COMPLETE ===` / failure exits process. |
| Container | `services/api/Dockerfile`: monorepo `COPY`, `npm ci`, `prisma generate`, `npm run build`, `node dist/main.js`. |
| Deploy docs | `docs/operations/production-deployment-governance-v1.md`, `railway-deploy-hygiene-v1.md`, `ci-and-merge-governance-v1.md`. |
| Governance docs | `docs/governance/*`, `npm run check:governance-docs`, PR CI step for governance anchors. |
| Prior internal audit | `docs/system-audits/admin-ops-backend-reporting-audit-20260427.md` (admin ops visibility / cron reporting gaps). |

### Runtime / deploy configuration (repo-only truth)

| Topic | Finding |
|-------|---------|
| Railway | Referenced in ops docs (`servelink-api`, healthcheck `/api/v1/system/readiness`); **no** `railway.toml` in repo—runtime env is **external**. |
| Vercel | No root `vercel.json` found; `main.ts` documents `*.vercel.app` CORS allowance for preview deployments. |
| Cron | Multiple `@Cron` classes; **most billing/dispatch/analytics ticks are env-gated** (`ENABLE_* !== "true"` → skip + often `CronRunLedger` “skipped”). Examples with evidence: `operational-analytics-warehouse-refresh.cron.ts` (`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`), `dispatch.worker.ts` (`ENABLE_DISPATCH_CRON`), `operational-outbox.processor.cron.ts` (`ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON`), `workflow-timer-wake.cron.ts` (`ENABLE_WORKFLOW_TIMER_WAKE_CRON`), `remaining-balance-authorization.cron.service.ts`, `payment-lifecycle-reconciliation.cron.service.ts`, `refunds.cron.service.ts`, `integrity.sweep.cron.ts`. |
| Health | `services/api/src/modules/system/system.controller.ts`: `GET /api/v1/system/health`, `GET /api/v1/system/readiness`. |

---

## Phase 1 — Subsystem inventory (with evidence anchors)

### Legend (inventory ≠ completion)

This section lists **what exists in the codebase**. Completion classification follows in Phase 2.

#### 1. Public customer experience

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Marketing / home | `apps/web/src/app/(public)/page.tsx` |
| Public booking | `apps/web/src/app/(public)/book/page.tsx`, `…/book/confirmation/page.tsx`, `…/book/direction-received/page.tsx` |
| Public booking API | `public-booking-orchestrator.controller.ts`: `POST …/availability`, `hold`, `deposit-prepare`, `funnel-milestone`, `confirm` under `/api/v1/public-booking` |
| Knowledge / SEO surfaces | Encyclopedia routes under `(public)/encyclopedia/**`; guides, products, compare, search |
| Customer shell | `(customer)/customer/**`, `customer/auth` |
| Notifications UI | `(app-shell)/notifications/page.tsx` |

#### 2. Admin / FO operations

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Admin home | `(admin)/admin/page.tsx` |
| Ops cockpit | `(admin)/admin/ops/page.tsx`, `ops/war-room`, `ops/recurring`, anomalies |
| Booking command center | `(admin)/admin/bookings/[id]/page.tsx`; API `admin-bookings.controller.ts` (hold, review, approve, reassign, operator notes, funnel milestones) |
| Dispatch config / exceptions | `admin/dispatch-config`, `admin/exceptions/**` |
| Workflow admin | `admin-workflow-executions.controller.ts` `/api/v1/admin/workflow-executions` |
| Operational intelligence | OA module + admin controllers (warehouse refresh **cron scaffold** default-off; **`OperationalAnalyticsRefreshRun`** manual plane merged via **#144** / **`80cca00**) |
| Authority / knowledge ops | Multiple `/admin/authority/*`, `knowledge-review`, `knowledge-ops` |
| FO shell | `(fo)/fo/**`, FO offers API `dispatch.fo-offer-response.controller.ts` |

#### 3. Payment + financial systems

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Stripe webhook | `stripe.webhook.controller.ts` `POST /api/v1/stripe/webhook` |
| Booking payment intents | `billing.stripe.controller.ts` under `/api/v1/bookings/:id/stripe/…` |
| Ledger admin reads | `ledger.admin.controller.ts` `/api/v1/admin/ledger/*` |
| Refund intents | `refund-intent.admin.controller.ts`; `refunds.cron.service.ts` (**opt-in** cron) |
| Reconcile admin | `stripe.reconcile.admin.controller.ts` |
| Ops anomalies | Large `anomalies.admin.controller.ts` under `/api/v1/admin/ops/*` |
| Payouts module | `modules/payouts/**` |
| Idempotency primitive | Registry + `schema.prisma` patterns + `IdempotencyInterceptor` (`common/reliability`) |

#### 4. Scheduling + operational execution

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Slot holds | `modules/slot-holds/**`, migration history includes `add_booking_slot_hold` |
| Dispatch worker / lock | `dispatch.worker.ts` (cron gated), `DispatchLockService` per registry |
| Recurring | `modules/recurring/**`, `recurring-plan/**`, `recurring.ops.controller.ts` |
| Workflow timers | `workflow-timer-wake.cron.ts` (**gated**) |
| Cron ledger | `CronRunLedger` model on `origin/main` schema + `cron-run-ledger.service.ts` |

#### 5. Governance + reliability systems

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Architecture primitive registry | `docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md` (**on `main`**) |
| Phase 0 protocol | `docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md` |
| CI governance | `.github/workflows/pr-ci.yml` + `check:governance-docs` + migration immutability check |
| Migration governance docs | `docs/engineering/prisma-migration-governance-v1.md`, `docs/operations/prisma-production-migration-governance-v1.md` |
| Deploy governance | `production-deployment-governance-v1.md` (explicit **deploy drift risk**) |

#### 6. Analytics + intelligence

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Operational analytics snapshots | `OperationalAnalyticsSnapshot` on `origin/main` schema |
| Aggregation / intelligence query | `operational-analytics-aggregation.service.ts`, `operational-intelligence-query.service.ts` (module on `main`) |
| Warehouse refresh cron scaffold | `operational-analytics-warehouse-refresh.cron.ts` (**default-off** env) |
| Refresh run ledger + replay classification | **`OperationalAnalyticsRefreshRun`** + services **on `origin/main`** (PR **#144**, **`80cca00`**) per **`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`** |
| Replay intelligence suite | Schema/migrations include operational replay models (e.g. migration names referencing `operational_replay` phases) |
| Experiment lineage | Registry cites `OperationalExperimentLineage` + longitudinal aggregation service |

#### 7. Internal platform architecture

| Subsystem | Exists (evidence) |
|-----------|-------------------|
| Orchestration / public booking orchestrator | `public-booking-orchestrator.module.ts` |
| Operational outbox | `operational-outbox/**` + gated processor cron |
| System test pipeline | `system-tests-pipeline/**`, incidents, intelligence, automation modules |
| Queue usage | Registry cites BullMQ for system-test pipeline |

---

## Phase 2 — Completion classification matrix

**Classification glossary**

| Label | Meaning |
|-------|---------|
| **COMPLETE_VERIFIED** | Core paths exist **and** automated tests + CI substantially prove behavior. |
| **COMPLETE_UNVERIFIED** | Code appears complete; **production parity or edge coverage not evidenced** in repo. |
| **PRODUCTION_OPERATIONAL** | Would require **live** deploy + HTTP/Railway/Vercel checks—not asserted here. |
| **INTERNAL_ONLY** | Primarily admin/API/back-office; not an end-customer surface. |
| **PARTIAL** | Known missing UI, reporting, or operator flows documented in-repo. |
| **SCAFFOLDED** | Implementation exists but relies on env gates, shadow flags, or unfinished wiring. |
| **GOVERNED_BUT_DISABLED** | Cron/tick present; **default path skips work** unless env explicitly enables. |
| **EXPERIMENTAL** | Simulation/replay/shadow paths—notclaimed as primary production narrative. |
| **CONFLICTING_AUTHORITIES** | Overlapping primitives or docs/schema disagreement requiring correlation/replace per Phase 0. |
| **UNKNOWN** | Insufficient repo evidence (often external env/deploy state). |

### Matrix (subsystem → classification)

| Subsystem | Classification | Evidence | Missing proof / blockers |
|-----------|----------------|----------|---------------------------|
| Public booking API funnel | **COMPLETE_VERIFIED** (narrow: routes exist + CI stack) | Controller endpoints wired; PR CI runs migrated DB + Playwright `verify:local-*` | End-to-end **production** card-present Stripe behavior not validated in this audit |
| Web `/book` UX | **COMPLETE_VERIFIED** (CI gate) | Page exists; Playwright regression/smoke scripts in `apps/web/package.json` | Production UX parity vs preview requires deploy verification |
| Stripe webhook + booking PI routes | **COMPLETE_VERIFIED** (partial: routes + tests exist in repo) | Controllers located; extensive billing/test suite present | Webhook signing secrets & live event ordering = **UNKNOWN** (env) |
| Dispatch automation cron | **GOVERNED_BUT_DISABLED** | `ENABLE_DISPATCH_CRON` gate in `dispatch.worker.ts` | If false in prod: dispatch advancement may require manual/other triggers—**operational risk** |
| Operational outbox processor | **GOVERNED_BUT_DISABLED** | `ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON` | Notifications/delivery latency tied to batch processing path—verify env |
| Warehouse OA refresh cron | **GOVERNED_BUT_DISABLED** | `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` | Fresh analytics snapshots may rely on manual POST—policy decision |
| Workflow timer wake | **GOVERNED_BUT_DISABLED** | `ENABLE_WORKFLOW_TIMER_WAKE_CRON` | Timer progression without cron may stall unless alternate path |
| Integrity / refund / remaining-balance / lifecycle recon crons | **GOVERNED_BUT_DISABLED** or env-conditional | Various `ENABLE_*` patterns | Financial hygiene may be manual if disabled—severity depends on Nu Standard ops policy |
| Admin ops dashboard | **PARTIAL** | Prior audit `docs/system-audits/admin-ops-backend-reporting-audit-20260427.md` | Cron health + slot-hold summaries **not** surfaced; deposit lifecycle **partial** |
| Operational analytics manual refresh ledger (`OperationalAnalyticsRefreshRun`) | **MERGED on `main`** (PR **#144**, **`80cca00`**) | Registry + schema + services per **`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`** | **Remaining:** manual **`POST refresh-snapshots`** proof in target env before cron enable—not absent model |
| Architecture registry accuracy vs `main` schema | **ALIGNED for OA refresh primitive** (post-**#144**) | Registry cites `OperationalAnalyticsRefreshRun`; schema includes model on `origin/main` | Future primitives still require Phase 0 discipline |
| Deploy pipeline truth | **UNKNOWN** (repo docs warn) | `production-deployment-governance-v1.md` states auto-deploy may be unset | Until Railway auto-deploy + parity checks: **main green ≠ prod updated** |
| Production observability | **PARTIAL / UNKNOWN** | Health/readiness routes exist | Log/metrics/alert ownership not enumerated in this audit |

---

## Phase 3 — Real-world completion audit (engineering-intervention lens)

**Question:** What still prevents Nu Standard from operating as a fully autonomous real-world cleaning platform **without engineering intervention**?

**Evidence-backed stress points:**

1. **Deploy drift risk (CRITICAL operational category, repo-proven)** — `production-deployment-governance-v1.md` documents historical cases where `main` advanced while production lagged; parity requires explicit HTTP + Railway checks—not automatic from merge.

2. **Cron dependency ambiguity (HIGH)** — Core automation paths (dispatch, outbox, workflow timers, multiple billing reconciliations) are **explicitly env-disabled by default** in code. Without a single documented “production cron matrix” tied to **live env values**, operators cannot know whether the system self-heals or stalls.

3. **Admin operational independence (MEDIUM–HIGH)** — Prior audit (`admin-ops-backend-reporting-audit-20260427.md`) lists backend-only cron states (reconciliation, remaining-balance auth) with **no admin summary endpoints**, and slot-hold risk not summarized—operators may need DB/logs/engineering.

4. **Governance documentation vs schema truth (reconciled for OA refresh)** — **`OperationalAnalyticsRefreshRun`** merged **`origin/main`** via **PR #144** (`80cca00`). **Residual OA concern:** prove manual **`POST refresh-snapshots`** in target env before **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`**—not missing schema rows.

5. **Financial & booking correctness** — Substantial tests and controllers exist (**positive signal**), but **live** Stripe reconciliation, dispute flows, and payout timing remain **UNKNOWN** without production telemetry review.

---

## Phase 4 — Hard proof gap map (no roadmap fluff)

| ID | Subsystem | Current evidence | Missing evidence | Operational impact | Severity | Partially built? | Primitive conflict? |
|----|-----------|------------------|------------------|-------------------|----------|------------------|---------------------|
| G1 | Production deploy parity | Governance doc warns “merged ≠ deployed” | Railway/Vercel SHA parity vs `main`, automated verification log | Features silently absent in prod | **CRITICAL** | N/A | No |
| G2 | Cron enablement matrix | Code shows many `ENABLE_*` guards | Authoritative env snapshot for prod/staging | Automation off → manual backlog / stale state | **HIGH** | Yes (cron classes exist) | No |
| G3 | Admin cron health visibility | Some cron ledger models exist | Operator dashboards for ledger summaries across jobs | Blind ops during incidents | **HIGH** | Partial | Low risk duplicate if rebuilt without Phase 0 |
| G4 | OA refresh run primitive | Registry + merged implementation (**#144**) | Operator manual **`POST refresh-snapshots`** proof before cron enable | Mis-timed cron without proof | **MEDIUM** | Yes | Registry vs cron correlation discipline |
| G5 | Slot hold operational summary | Holds modeled & tested (per prior audit) | Admin endpoint + UI slice | Hold expiry risk opaque | **MEDIUM** | Backend partial | No |
| G6 | Customer comms reliability | Outbox module + gated cron | Confirm processor enabled or alternate worker | Delayed SMS/email | **MEDIUM–HIGH** | Yes | No |

---

## Phase 5 — Architectural risk audit

| Risk | Evidence | Mitigation direction (governance, not implementation here) |
|------|----------|------------------------------------------------------------|
| Duplicate authority narratives | Registry: `OperationalAnalyticsRefreshRun` vs `CronRunLedger` correlation rule | Phase 0 **CORRELATE_EXISTING_PRIMITIVES** before new ledgers |
| Doc/schema drift | Historical mismatch **closed** for **`OperationalAnalyticsRefreshRun`** post-**#144** | Maintain Phase 0 + registry updates on future primitives |
| Ungoverned cron perception | Many crons exist but skip silently via env | Treat env flags as **production configuration inventory** |
| Replay blind spots | Replay suite focuses on analytics read models per registry | Do not infer booking/financial replay completeness |
| Migration velocity vs deploy | 187 migration files; boot runs migrate deploy | Requires disciplined deploy verification (`=== MIGRATION COMPLETE ===`) |
| Admin dependence | Prior audit lists backend-only operational signals | Expand **read-only** admin reporting before new executors |

---

## Phase 6 — Executive truth

1. **Truly complete (repo + CI sense):** Monorepo builds a large Nest API + Next web with extensive migrations; PR CI enforces fresh DB migrate, API/web typecheck, Vitest, Jest volume, and Playwright verify scripts—**strong integration discipline**.

2. **Production-operational today:** **Not provable from repo alone.** Governance explicitly requires Railway/Vercel parity checks and warns merge/deploy skew.

3. **Governed but not operational:** Many scheduled ticks are **implemented yet default-skipped** pending explicit env enablement—**by design** but operationally sensitive.

4. **Blocks “Nu Standard complete” without engineering:** (a) provable deploy parity, (b) explicit production cron/outbox/dispatch enablement policy, (c) closing admin visibility gaps from `admin-ops-backend-reporting-audit-20260427.md`, (d) preventing **new** registry/schema drift (**OperationalAnalyticsRefreshRun** aligned post-**#144**).

5. **Highest-risk unfinished systems:** Production automation toggles (dispatch, outbox, workflow timers, billing sweeps) **if disabled without compensating manual process**.

6. **Most dangerous architectural ambiguity (historical OA note):** **`OperationalAnalyticsRefreshRun`** **was** a doc/schema mismatch risk **before PR #144**; **remaining OA ambiguity is env/proof posture**, not absent Prisma rows.

7. **Likely hidden operational failure points:** Silent cron skips + merge/deploy drift → “green CI” mask for stale prod.

8. **Recommended execution order (evidence-grounded, non-speculative):**

   1. Establish **deploy parity checklist** per existing prod governance (HTTP + Railway history).  
   2. Produce **authoritative env inventory** for all `ENABLE_*` cron gates actually set in prod/staging.  
   3. Capture **manual `POST refresh-snapshots`** proof + deploy parity for OA surfaces merged in **#144** (`80cca00`).  
   4. Close **admin-only reporting gaps** proven in `admin-ops-backend-reporting-audit-20260427.md` before adding parallel primitives.  
   5. Apply **Phase 0 classification** to any new ledger/cron/replay surface using `docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`.

---

## Appendix A — Classification rubric (quick reference)

```
COMPLETE_VERIFIED       → code + substantial automated proof in-repo
COMPLETE_UNVERIFIED     → code deep; prod parity or proofs thin
PRODUCTION_OPERATIONAL  → requires live checks (not claimed here)
INTERNAL_ONLY           → admin/API/back-office primary
PARTIAL                 → known gaps documented in-repo
SCAFFOLDED              → behind flags / incomplete wiring
GOVERNED_BUT_DISABLED   → cron exists; env skip path
EXPERIMENTAL            → replay/simulation/shadow
CONFLICTING_AUTHORITIES → overlapping truth or doc/schema mismatch
UNKNOWN                 → external/env/deploy unknowns
```

---

## Appendix B — Key file index (non-exhaustive)

| Area | Paths |
|------|-------|
| Public booking | `services/api/src/modules/public-booking-orchestrator/public-booking-orchestrator.controller.ts` |
| System health | `services/api/src/modules/system/system.controller.ts` |
| Stripe | `…/billing/stripe.webhook.controller.ts`, `billing.stripe.controller.ts` |
| Dispatch cron | `services/api/src/modules/dispatch/dispatch.worker.ts` |
| OA warehouse cron | `…/operational-analytics-warehouse-refresh.cron.ts` |
| Outbox cron | `…/operational-outbox/operational-outbox.processor.cron.ts` |
| CI | `.github/workflows/pr-ci.yml` |
| Governance | `docs/governance/*.md`, `scripts/check-architecture-governance-v1.sh` |
| Prior admin audit | `docs/system-audits/admin-ops-backend-reporting-audit-20260427.md` |

---

## Validation notes

- No helper scripts were added for this audit.  
- Spot checks: `git show origin/main:…` for schema/controller absence/presence; filesystem counts for tests/migrations/pages.  
- Re-run validation after merges: confirm `OperationalAnalyticsRefreshRun` schema presence matches registry claims.

**STOP** — audit artifact complete; no feature implementation performed.
