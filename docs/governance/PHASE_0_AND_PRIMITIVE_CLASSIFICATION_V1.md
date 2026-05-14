# Phase 0 protocol & primitive classification (v1)

**Audience:** Implementers of major lanes (“drops”), reviewers, and on-call when touching execution or governance primitives.

**Companion:** [`ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](./ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md)

---

## Why Phase 0 exists

ServeLink has overlapping surfaces for **scheduled work**, **explicit operator/API triggers**, **workflow**, **replay**, **locks**, and **analytics**. Without a short mandatory inspection, new code tends to introduce **duplicate authority** (two sources of truth for “did this run succeed?”). Phase 0 forces evidence before implementation.

---

## Mandatory Phase 0 checklist (every major lane)

Before writing implementation code:

1. **Inspect** `schema.prisma` for existing models in the same concern (run ledger, lock, audit, workflow).
2. **Inspect** `services/api/src/modules/**` for services named `*ledger*`, `*refresh*`, `*replay*`, `*cron*`, `*workflow*`, `*lock*`, `*pipeline*`.
3. **Search tests** under `services/api/**/*.spec.ts` (and relevant `apps/web`) for the behavior label you think is new.
4. **Classify** the change using **exactly one** primary verdict below (secondary correlation allowed if documented).
5. **Duplicate-authority check:** If your change introduces a new **run identifier**, **lease**, or **ledger row type**, prove why existing primitives cannot be extended—or escalate **STOP_CONFLICTING_AUTHORITIES**.
6. **STOP conditions:** If two systems both claim **exclusive** authority for the same outcome (e.g. “refresh succeeded”) without a documented correlation strategy, **stop** and resolve design first.

Document answers in the PR description (see repo PR template).

---

## Primitive classifications

Each classification defines **meaning**, **allowed**, **forbidden**, and **escalation**.

### REUSE_EXISTING_PRIMITIVE

| | |
|--|--|
| **Meaning** | The behavior fits an existing table/service/API without semantic drift. |
| **Allowed** | Call existing services; add **narrow** columns or metadata JSON **only** when backward-compatible. |
| **Forbidden** | Parallel module that re-implements the same lifecycle (“shadow ledger”). |
| **Escalation** | If reuse forces wrong semantics (wrong plane or authority), re-classify to CORRELATE or REPLACE—not silent duplication. |

### EXTEND_EXISTING_PRIMITIVE

| | |
|--|--|
| **Meaning** | Same primitive is correct but needs new fields, indexes, or phases. |
| **Allowed** | Migrations, guarded code paths, backward-compatible defaults. |
| **Forbidden** | Forking a copy-paste service with a second Prisma model for the same narrative. |
| **Escalation** | If extension breaks isolation boundaries (e.g. workflow vs warehouse), split **planes** explicitly and CORRELATE. |

### CORRELATE_EXISTING_PRIMITIVES

| | |
|--|--|
| **Meaning** | Two **different** authorities legitimately exist (e.g. cron plane vs explicit HTTP plane); they must **reference each other** when both participate in one user-visible outcome. |
| **Allowed** | Shared correlation id (opaque string), dual-write of pointers into **existing** tables’ `metadata`, documented ordering rules. |
| **Forbidden** | New third ledger “because correlating is hard.” |
| **Escalation** | If correlation cannot be defined clearly, **STOP_CONFLICTING_AUTHORITIES**. |

### REPLACE_CONFLICTING_PRIMITIVES

| | |
|--|--|
| **Meaning** | Two primitives claim the same authority and cannot coexist safely; one must be retired behind a migration plan. |
| **Allowed** | Deprecation path, data backfill, single switch-over milestone, tests proving one source of truth. |
| **Forbidden** | Partial migration leaving dual writes indefinitely without acceptance criteria. |
| **Escalation** | Requires explicit stakeholder/reviewer sign-off on booking/financial impact if touching payment/dispatch domains (**out of scope for casual drops**). |

### NEW_PRIMITIVE_JUSTIFIED

| | |
|--|--|
| **Meaning** | No existing primitive covers the **authority** or **plane** (e.g. new subsystem like system-test pipeline). |
| **Allowed** | New model/service with registry entry and Phase 0 checklist completed. |
| **Forbidden** | “Greenfield” duplication adjacent to an existing ledger because naming differs. |
| **Escalation** | If justification is weak, default to REUSE or EXTEND. |

### STOP_CONFLICTING_AUTHORITIES

| | |
|--|--|
| **Meaning** | Inspection shows incompatible ownership or unresolved dual authority in a critical path. |
| **Allowed** | **Design-only** PR: docs, registry updates, ADR, spike branch—not production behavior change. |
| **Forbidden** | Shipping another implementation layer on top of ambiguity. |
| **Escalation** | Stop implementation; report conflicting primitives and required merge/replace decision. |

---

## Duplicate authority: concrete repo examples

### Example A: `OperationalAnalyticsRefreshRun` vs `CronRunLedger`

| Aspect | Detail |
|--------|--------|
| **Overlap** | Both can relate to **warehouse recomputation**: cron may trigger refresh paths; explicit **POST** creates refresh-run rows. |
| **Why it happened** | Different **planes**: scheduled ticks need lightweight cron ledger + skip semantics; explicit refresh needs **request fingerprint**, single-flight, stale reconciliation, and replay classification hooks. |
| **Danger** | A third “refresh ledger” or per-path mutex duplicates **truth** for “refresh succeeded” and splits ops dashboards. |
| **Resolution before coding** | Declare **CORRELATE_EXISTING_PRIMITIVES** when both planes participate in one operator story (shared correlation id in `metadata` / refresh-run columns); extend metadata—not add parallel tables. |

### Example B: Workflow execution vs analytics refresh

| Aspect | Detail |
|--------|--------|
| **Overlap** | Both sound like “orchestration.” |
| **Danger** | Storing OA refresh phases in `WorkflowExecution` couples unrelated domains and makes replay semantics ambiguous. |
| **Resolution** | **REUSE_EXISTING_PRIMITIVE** (`WorkflowExecution`) only for workflow lifecycle; **EXTEND** OA refresh run only for warehouse batches. |

---

## Operational analytics alignment (anchor doc)

| Plane | Source of truth | Role |
|-------|-----------------|------|
| **Manual / explicit refresh** | **`OperationalAnalyticsRefreshRun`** | Governance anchor for HTTP-triggered warehouse refresh: fingerprint, status, stale reconciliation, replay classification inputs. |
| **Cron plane** | **`CronRunLedger`** | Truth for scheduled ticks (started/succeeded/failed/skipped, timings). |

**Future work:** **CORRELATE**, not duplicate—do **not** build a separate lease system per path; extend correlation fields and reuse existing ledgers.

---

## Classification declaration (required)

Every major implementation PR must state:

```text
Primitive classification: <ONE_PRIMARY_CLASSIFICATION>
Registry rows consulted: <links or section names>
Duplicate-authority check: <pass | STOP — reason>
```

---

## References

- Registry: [`ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](./ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md)
- CI/docs check: `npm run check:governance-docs`
