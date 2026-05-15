# NU STANDARD — Master Execution Plan (v1)  
### Anti-Drift System Truth Edition

**Status:** **AUTHORITATIVE EXECUTION CONSTITUTION** for the remainder of the Nu Standard + ServeLink build until **explicitly superseded** by a newer approved master plan (same tier or successor document).

**This is not:** an audit, a speculative roadmap, brainstorming, or roadmap theater.

**This is:** unified execution governance—anti-drift authority, sequencing authority, launch-completion authority, mandatory rehydration baseline for future work.

---

## System authority hierarchy (MANDATORY)

**Lower sources MUST NOT override higher sources.** Conversational momentum is **NOT** execution authority.

| Rank | Source | Path / reference |
|------|--------|------------------|
| **1** | **NU_STANDARD_MASTER_EXECUTION_PLAN_V1** | *This document* (`docs/governance/NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md`) |
| **2** | Critical Path Extraction Audit | [`docs/audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md) |
| **3** | Completion Census Audit | [`docs/audits/NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`](../audits/NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md) |
| **4** | Experience Launch Completion Blueprint | [`docs/audits/NU_STANDARD_EXPERIENCE_LAUNCH_COMPLETION_BLUEPRINT_V1.md`](../audits/NU_STANDARD_EXPERIENCE_LAUNCH_COMPLETION_BLUEPRINT_V1.md) |
| **5** | Experience + Portal Readiness Audit | [`docs/audits/NU_STANDARD_EXPERIENCE_PORTAL_READINESS_AUDIT_V1.md`](../audits/NU_STANDARD_EXPERIENCE_PORTAL_READINESS_AUDIT_V1.md) |
| **6** | Architecture Primitive Registry | [`ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](./ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md) |
| **7** | Phase 0 Primitive Governance Protocol | [`PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](./PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md) |
| **8** | OA Refresh Governance Merge Proof | [`docs/audits/OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`](../audits/OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md) *(expected on `main` after OA governance merge; if absent locally, `git fetch` / reconcile)* |
| **9** | Merge / Deploy Governance Docs | e.g. [`production-deployment-governance-v1.md`](../operations/production-deployment-governance-v1.md), [`ci-and-merge-governance-v1.md`](../operations/ci-and-merge-governance-v1.md), [`warehouse-refresh-scheduling-governance-v1.md`](../operations/warehouse-refresh-scheduling-governance-v1.md), [`railway-deploy-hygiene-v1.md`](../operations/railway-deploy-hygiene-v1.md) |
| **10** | Older ad-hoc chats / informal suggestions | **Non-authoritative** unless elevated via PR + governance tier |

**Rules:**

- New priorities require **evidence-backed justification** and must **not** silently redefine completion (see §Phase 1).
- Future chats **must NOT** reinterpret completion definitions casually.

---

## Phase 0 — Full source reconciliation

### Truth layers (do not conflate)

| Layer | Meaning |
|-------|---------|
| **`origin/main` merged truth** | Integration branch content after merges—verify with `git fetch` + `git log origin/main`. |
| **Deployed truth** | What Railway/Vercel/production HTTP actually serves—**NOT** implied by green CI or merge (**merged ≠ deployed**, deploy governance). |
| **Runtime-proven** | Verified in target environment (health, routes, migrations succeed, env flags documented)—operator-owned evidence. |
| **Governed-but-disabled** | Code paths exist; **`ENABLE_*`** or policy keeps automation off (census / critical path). |
| **Local / WIP only** | Unmerged branches or dirty trees—non-canonical until merged. |
| **Post-launch** | Explicitly deferred by this plan or prior audits—**not** reopen without formal scope change. |

### Authoritative inputs reconciled (file existence)

The following **must exist** in repo at referenced paths (local clones may need `git pull` after merges):

- Completion Census → `docs/audits/NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`
- Critical Path → `docs/audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`
- Experience Readiness → `docs/audits/NU_STANDARD_EXPERIENCE_PORTAL_READINESS_AUDIT_V1.md`
- Experience Blueprint → `docs/audits/NU_STANDARD_EXPERIENCE_LAUNCH_COMPLETION_BLUEPRINT_V1.md`
- Registry + Phase 0 → `docs/governance/ARCHITECTURE_*`, `PHASE_0_*`
- OA proof → `docs/audits/OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md` *(merge-context for OA refresh governance lane)*

**No fabricated production claims:** This plan does **not** assert live deploy SHA, Stripe posture, or env values—those are **deploy/runtime truth**, external to Git.

---

## Phase 1 — Immutable completion definition

### What “operationally and experientially complete” means

Completion requires **both**:

**A. Operational / runtime completion (non-exhaustive thresholds)**

| Threshold | Required state |
|-----------|----------------|
| **Booking reliability** | Public booking API + web funnel exercised under CI; production parity verified when claiming live readiness (census). |
| **Payment reliability** | Stripe webhook + intent paths exist; anomalies surfaced to ops; reconciliation posture **known** (cron may be opt-in—critical path). |
| **Scheduling reliability** | Holds/slots/recurring modules landed; dispatch progression either **cron-enabled per policy** or **explicit manual SOP**. |
| **Admin independence** | Operators can run routine backlog without engineering—**gaps** in cron visibility / slot summaries acknowledged (census / admin audit). |
| **Deployment / runtime safety** | Deploy parity discipline: merge, explicit deploy, HTTP verification (**Critical Path CP-1**). |
| **`ENABLE_*` truth** | Authoritative env matrix documented—no silent automation stalls (**CP-2**). |
| **Replay / auditability** | Analytics replay bounded to read models per registry; financial replay **not** conflated. |
| **Escalation / recovery** | Customer escalation path documented minimum per experience blueprint; support dead-ends avoided. |
| **Observability** | Health/readiness routes; ops dashboards interpreted with staleness semantics (warehouse governance). |

**B. Experiential / trust completion (launch-facing)**

| Threshold | Required state |
|-----------|----------------|
| **Customer trust** | Coherent customer-facing naming/metadata (**Blueprint X1**); no internal-ID-first portal (**X2**). |
| **Operator usability** | FO transitions without blocking **`alert()`** patterns (**X4**); sensible error surfaces. |
| **Portal completeness (minimum)** | Human-readable booking summary + payment continuation + explicit support path (blueprint Phase 5). |
| **Branding consistency** | Shell + confirmation + marketing aligned for customer-visible surfaces (**Experience audit**). |
| **Mobile quality** | Core funnel + portals validated on small viewports—**UNKNOWN until proven** is **not** launch-complete (**Blueprint X7**). |

### What is **explicitly NOT** required before launch

- **Warehouse analytics cron** automation (`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON`)—**post-launch candidate** after manual proof (warehouse governance + critical path **CP-10**).
- **Full customer self-service** (reschedule/cancel/settings)—**stretch** unless API inventory proves trivial wiring—otherwise **post-launch** or explicit scoped lane (**Blueprint X3**).
- **Speculative AI / platform expansion**—**forbidden** pre-launch (§Phase 4).
- **Perfect admin IA**—iterative; **must not block** if CP operational gates + trust blockers satisfied—but overload remains **risk** (blueprint X5).

**Goalpost rule:** Moving definitions above requires updating **this master plan** or issuing a **new numbered master plan** with rationale—not chat inference.

---

## Phase 2 — Current system truth (classification vocabulary)

Future chats **must** use these labels precisely:

| Label | Meaning |
|-------|---------|
| **Implemented** | Code exists in repo. |
| **Merged** | On `origin/main` (or integration branch). |
| **Deployed** | Running in target environment per Railway/Vercel parity checks. |
| **Runtime-proven** | Verified with env-specific checks (logs, HTTP, migrations). |
| **Operationally-proven** | Operators succeeded without engineering babysitting. |
| **Scaffolded** | Thin UI / partial surface (experience audits—customer portal). |
| **Disabled** | Env gate skips work (`ENABLE_* !== "true"` patterns). |

### Consolidated snapshot (audit-derived, not live-proven)

- **Strengths:** Deep booking funnel engineering; broad API/admin surfaces; CI + migration boot discipline; primitive registry + Phase 0; OA refresh run ledger **merged** with governance proof artifact (**rank #8**).
- **Weaknesses:** Deploy drift risk; invisible cron posture without env matrix; customer portal thin + ID-heavy; branding leakage Servelink vs Nu Standard; FO alert UX; admin cognitive load.
- **Architectural risks:** Duplicate authority if new ledgers bypass Phase 0; correlating **manual refresh runs** vs **CronRunLedger** when both active (registry §12).

---

## Phase 3 — Authoritative execution phases

### Current active phase (anti-drift)

**Phase L — Launch consolidation:**

1. **Operational governance stabilization:** CP-1 deploy parity process + CP-2 env matrix + staleness literacy for ops surfaces.  
2. **Experience consolidation + trust hardening:** Blueprint sequencing **T1–T4**, **E-I2**, **E-I3**, **X9** gating, mobile proof **M1**.  
3. **No new orchestration primitives** without Phase 0 + registry alignment.

### Allowed next lanes (must map to ranks #2–#9)

- Deploy parity verification playbook execution (**rank #9**).
- Authoritative **`ENABLE_*`** inventory + runbook (**CP-2**).
- Brand/metadata/shell coherence (**rank #4–#5**).
- Portal humanization + FO error UX (**rank #4–#5**).
- Admin IA tightening **without** new backend authorities (**rank #5**).
- Read-only observability gaps from admin ops audit (**rank #3 census**) **without** inventing new execution planes.

### Forbidden premature lanes

- **Cron enablement** wholesale before CP-2 + manual proofs per subsystem (**§Phase 8**).
- **New ledgers / run tables** without Phase 0 classification (**rank #7**).
- **Platform / AI / speculative orchestration** expansion.
- **Heavy analytics sophistication** while trust blockers **X1/X2/X7** remain open.

### Sequencing axioms (non-optional)

1. **Governance before automation** — Phase 0 + env truth before cron.  
2. **Trust before sophistication** — branding + portal credibility before funnel embellishment.  
3. **Usability before orchestration expansion** — FO/admin friction before new coordinators.  
4. **Runtime proof before autonomous cadence** — manual POST proof (warehouse doc) before OA cron.  
5. **Portal baseline before platform expansion** — blueprint ordering.

### Must happen before launch / automation / scaling

| Gate | Requirement |
|------|----------------|
| **Before launch** | CP-1, CP-2 operational clarity; trust blockers **X1, X2**; mobile proof **X7** resolved or explicitly waived with signed risk acceptance |
| **Before automation** | Per-subsystem manual proof + CronRunLedger visibility story + correlation strategy where dual planes exist |
| **Before scaling** | Stable deploy cadence; anomaly rates bounded; no duplicate-authority ambiguity |

---

## Phase 4 — Execution locks + forbidden drift

### Forbidden behaviors (examples—non-exhaustive)

1. **No new orchestration systems** without Phase 0 audit + registry row update (**rank #6–#7**).  
2. **No duplicate authority creation** (parallel ledgers for same narrative).  
3. **No cron enablement** before runtime proof + governance alignment (**§Phase 8**).  
4. **No speculative AI / enterprise platform expansion** pre-launch (**§Phase 6**).  
5. **No backend overbuilding** while **X1/X2/X7** trust blockers remain untreated without explicit waiver.  
6. **No major subsystem invention** outside critical path without superseding this plan.  
7. **No replacing primitives** without `REPLACE_CONFLICTING_PRIMITIVES` discipline (**rank #7**).  
8. **No nice-to-have polish** on non-trust surfaces ahead of **X1–X2** without waiver.  

### Drift definitions

| Drift type | Definition |
|------------|------------|
| **Execution drift** | Doing work out of allowed-next-lanes without updating master plan or evidence. |
| **Governance drift** | Skipping Phase 0 / env documentation / deploy verification. |
| **Architectural drift** | New authority overlapping registry primitives without `CORRELATE` / `EXTEND` justification. |
| **Launch-sequence violation** | Automation or scaling before operational + trust gates. |

---

## Phase 5 — Current critical path (definitive remainder)

**Source of record:** Critical Path audit **CP-1…CP-10**, fused with experience blueprint **X1–X9** where launch-facing.

### MUST_HAVE_PRE_LAUNCH (operational + experiential)

| Lane | Objective | Dependency | Proof |
|------|-----------|------------|-------|
| **CP-1** | Deploy parity | Merge discipline | HTTP + Railway/Vercel verification artifacts |
| **CP-2** | Env **`ENABLE_*`** matrix | CP-1 awareness | Signed runbook |
| **X1** | Branding coherence | None | Customer-visible audit of titles/shell/meta |
| **X2** | Portal humanization | None | UI acceptance checklist |
| **X7** | Mobile baseline | — | Device evidence or CI mobile scope |

### SHOULD_HAVE_PRE_LAUNCH

| Lane | Notes |
|------|-------|
| **CP-5 / admin visibility gaps** | Read-only surfaces—reduce engineering dependence |
| **X4** | FO inline errors |
| **X5** | Admin IA pass |
| **X8** | Stale vs live labeling |

### SAFE_POST_LAUNCH

| Lane | Notes |
|------|-------|
| **CP-10** | OA warehouse cron cadence |
| Select optional crons | Per finance/dispatch policy |
| Deep portal expansion | Settings/recurring if APIs absent |

### GOVERNED_BUT_DISABLED

- Dispatch, outbox, workflow timers, billing sweeps, OA warehouse cron—**implemented**, **env-off** until proof (**Census / Critical Path**).

---

## Phase 6 — Post-launch boundary (explicit deferrals)

**Do not reopen casually:**

- Advanced automation beyond documented proofs.
- Scaling orchestration / multi-tenant platformization.
- Speculative AI systems.
- Deep analytics sophistication ahead of operator literacy artifacts.
- Non-critical portal expansion before baseline trust thresholds met.
- New primitives without registry + Phase 0.

Formal reopen requires **new master plan revision** or annex with evidence.

---

## Phase 7 — Mandatory chat rehydration protocol

Every future chat **MUST**:

1. **Read this Master Execution Plan first** (**rank #1**).  
2. **Read** [`SYSTEM_OPERATIONS_PROTOCOL_V1.md`](./SYSTEM_OPERATIONS_PROTOCOL_V1.md) — procedural constitution (**HOW**: drops, merge/deploy, reporting, safety boundaries).  
3. **Reconcile:** current `origin/main` SHA; deployed truth if task touches prod; active branches; open blockers from ranks **#2–#5**.  
4. **Identify** active execution phase (**§Phase 3**).  
5. **Justify** why the requested lane is **allowed** (maps to allowed-next-lanes).  
6. **Verify** no **critical-path violation** (§Phase 5 ordering).  
7. **Verify** no **duplicate authority** risk (**rank #6–#7**).  
8. **Verify** no **forbidden drift** (**§Phase 4**).

### HARD STOP conditions for chats

Stop and escalate design review if:

- Requested work **conflicts** with sequencing axioms.  
- **Runtime truth ambiguous** (unknown deploy/env).  
- Duplicate authorities **may emerge**.  
- Launch-sequence / automation gates **would be skipped**.

---

## Phase 8 — Definition of “safe automation”

**Automation** includes: cron ticks, autonomous batch processors, scaling schedules, orchestration expansion that removes human gates.

**Safe automation requires ALL:**

1. **Runtime proof** — subsystem proven in target env with acceptance checklist.  
2. **Replay / correlation proof** where dual planes exist (**OperationalAnalyticsRefreshRun** vs **CronRunLedger**—**CORRELATE**, not third ledger).  
3. **Operational visibility** — ledger rows or dashboards operators can interpret (**CronRunLedger**, OA panels, anomaly surfaces).  
4. **Lineage / staleness literacy** — operators trained that stale warehouse ≠ live ops failure (warehouse governance).  
5. **Governance alignment** — Phase 0 classification documented; registry updated if new primitive justified.  
6. **No duplicate authority ambiguity** — single narrative per plane.

**Until satisfied:** automation remains **GOVERNED_BUT_DISABLED** by default.

---

## Phase 9 — Final execution truth (practical)

1. **Highest-leverage lane:** **CP-1 + CP-2** paired with **X1 + X2** (deploy/env truth + customer-visible trust).  
2. **Biggest launch risk:** **Deploy drift** (merged ≠ deployed).  
3. **Biggest trust risk:** **Branding/credibility fracture + internal-ID portal**.  
4. **Biggest operational risk:** **Unknown cron/env posture** causing silent stalls.  
5. **Biggest governance risk:** **Phase 0 skipped** → duplicate ledgers.  
6. **Most overbuilt (relative to launch):** Deep booking/engine complexity vs thin portals—**avoid adding** until portals trustworthy.  
7. **Most underbuilt:** Customer lifecycle self-service + operator-friendly error surfaces.  
8. **Fastest path to operational launch completion:** Deploy parity + env matrix + minimal admin observability closes (**Critical Path**).  
9. **Fastest path to experiential trust completion:** Branding coherence + portal humanization + mobile proof (**Blueprint**).  
10. **Exact point automation becomes safe:** After **Phase 8** checklist is **signed per subsystem**—first candidates remain **non-customer-mutation** batch ticks (e.g. warehouse refresh) **after** manual POST proof per warehouse governance.

---

## Governance folder cross-link

| Doc | Role |
|-----|------|
| [`README.md`](./README.md) | Index to registry + Phase 0 |

---

## Validation checklist

- [x] Audits referenced exist under `docs/audits/` (four NU_STANDARD_* files verified in repo layout).  
- [x] OA proof path documented; local workspace may need sync after merge.  
- [x] Governance + operations docs cited under `docs/governance/` and `docs/operations/`.  
- [x] No contradictory sequencing vs Critical Path / Blueprint—integrated explicitly.  
- [x] No fabricated production SHAs or env values.

---

**Supersession:** Only a **`NU_STANDARD_MASTER_EXECUTION_PLAN_V2+`** (or formally titled successor) approved through the same governance tier may replace this document as **rank #1**.

**STOP** — document-only; no implementation, merge, deploy, or cron enablement performed in this drop.
