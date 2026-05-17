# Controlled activation playbook (v1)

Phased discipline for turning **`ENABLE_*`** gates / cron ticks **on intentionally** after deploy parity exists — **no RBAC invention**, **no org chart**.

Companion artifacts:

- [`ENABLE_RUNTIME_MATRIX_V2.md`](./ENABLE_RUNTIME_MATRIX_V2.md)
- [`LAUNCH_RUNTIME_PROOF_CHECKLIST_V1.md`](./LAUNCH_RUNTIME_PROOF_CHECKLIST_V1.md)
- [`DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md`](./DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md)
- [`production-deployment-governance-v1.md`](./production-deployment-governance-v1.md)
- [`warehouse-refresh-scheduling-governance-v1.md`](./warehouse-refresh-scheduling-governance-v1.md)

---

## Who may enable systems

- **Authorized operators / release owners** acknowledged per **`production-deployment-governance-v1.md` Ownership** (merge/on-call pairing — literal governance baseline).
- **Engineering MAY propose**, operators **own prod toggles** — absent contrary enterprise policy this repo **documents UNKNOWN**.

*(Do **not** interpret this section as creating new IAM — logistics mirror existing merge/deploy ownership conventions.)*

---

## Evidence doctrine

| Requirement | Meaning |
|-------------|---------|
| **Evidence artifact** | Timestamp + actor + env snapshot excerpt referencing Railway/Vercel variables touched |
| **Rollback rehearsal awareness** | Operator acknowledges inversion semantics (`ENABLE_PAYMENT_*` patterns vs **`!== "true"`** cron gates) |

---

## Phase 0 — Merged but disabled

**Goal:** Code shipped — automation intentionally idle.

| Checkpoint | Action |
|------------|--------|
| Merge SHA documented | Tag merge PR / squash merge hash |
| Deploy parity incomplete assumption | Treat cron/automation **UNKNOWN inactive** until Phase 1 |
| Matrix reconciled | Cross-read [`ENABLE_RUNTIME_MATRIX_V2.md`](./ENABLE_RUNTIME_MATRIX_V2.md) |

---

## Phase 1 — Manual runtime verification

**Goal:** Prove HTTP/runtime posture — **still no cron assumptions.**

| Checkpoint | Action |
|------------|--------|
| Base parity | Follow [`DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md`](./DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md) mandatory probes |
| Warehouse OA lane | Authenticated **`POST refresh-snapshots`** proof BEFORE flipping OA cron env (**warehouse governance automation gate**) |
| OA observability | Snapshot **`GET refresh-runs`** structure baseline |

Stop gate — escalate if readiness failures unresolved (`rollback-and-recovery-governance-v1.md`).

---

## Phase 2 — Controlled low-frequency enablement

**Goal:** Single subsystem toggle experiment — narrow blast radius.

| Checkpoint | Action |
|------------|--------|
| Pick ONE subsystem row | Example only after Phase 1 proof:** OA cron OR dispatch OR outbox — never wholesale simultaneous flip |
| Document rationale | Reference CP lanes / MUST_HAVE ordering [`NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md`](../governance/NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md) |
| Apply env change | Railway/Vercel variable mutation outside repo scope — capture screenshot/export |

Rollback readiness — rehearse removal path (`ENABLE_RUNTIME_MATRIX_V2.md` Rollback column).

---

## Phase 3 — Operational observation period

**Goal:** Ledger-backed observation window — **no silent optimism.**

| Checkpoint | Action |
|------------|--------|
| **`CronRunLedger`** sampling | Compare **`started`/`succeeded`/`skipped`** ratios vs baseline |
| Anomalies backlog discipline | Finance/comms surfaces monitored (`critical path` finance lanes) |
| Dashboard staleness literacy | Warehouse panels interpreted per staleness table — avoid false incident escalation |

Stop gate — disable subsystem if anomaly storms exceed documented tolerance (**conditions force disablement** §).

---

## Phase 4 — Trusted production activation

**Goal:** Sustainability window closes — automation treated **operationally owned**.

| Checkpoint | Action |
|------------|--------|
| Evidence bundle archived | Phase 1–3 artifacts consolidated |
| Env matrix snapshot updated | Annotate timestamp + verifying actor (**UNKNOWN acceptable gaps flagged**) |
| Scaling cadence guard | Avoid tightening cron intervals without renewed observation |

---

## Phase 5 — Rollback / re-disable procedure

| Trigger | Response |
|---------|----------|
| Health regressions | Railway rollback target prior SUCCESS deployment (`rollback-and-recovery-governance-v1.md`) |
| Ledger sustained **`failed`** bursts | Disable offending **`ENABLE_*`** per matrix rollback semantics |
| Misinterpreted staleness ops incident | Prefer informational refresh / communications — avoid destructive toggles unless playbook mandates |

**Forced disablement conditions (examples — non-exhaustive):**

- Unbounded **`failed`** **`CronRunLedger`** streak without mitigation window exhausted.
- Dispatch backlog uncontrollable post-enable absent compensating manual SOP live-tested.
- Finance anomalies spike beyond ops-agreed threshold (**UNKNOWN numeric thresholds until declared**).

---

## Related docs

- [`SYSTEM_OPERATIONS_PROTOCOL_V1.md`](../governance/SYSTEM_OPERATIONS_PROTOCOL_V1.md)
- [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](../audits/NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md)

**STOP** — playbook skeleton — operators specialize thresholds.
