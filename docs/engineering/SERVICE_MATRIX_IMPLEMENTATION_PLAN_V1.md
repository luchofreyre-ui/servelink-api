# Service matrix V1 — implementation plan

**Scope:** sequencing for **additive** service-matrix work. **No** booking persistence, slot overlap, estimator math, or payment changes in early slices unless explicitly listed.

---

## 1. Migration sequencing (code + optional data)

| Phase | Deliverable | Schema impact |
|-------|-------------|---------------|
| **S0** | Docs only (system map, architecture, observability, this plan) | **None** |
| **S1** | `service-matrix` module: types (`JobContext`, `PolicyReasonCode`, `MatrixEvaluationResult`), façade that **delegates** to existing functions; **unit tests** mirroring `matchFOs` outcomes on fixtures | **None** |
| **S2** | **Shadow mode:** orchestrator and/or `matchFOs` calls façade, **logs structured diff** when `eligible` differs from legacy (should be zero initially); feature flag `SERVICE_MATRIX_SHADOW=false` default | **None** |
| **S3** | **Dispatch alignment:** `DispatchCandidateService` builds same `JobContext`, reuses reason codes for parity | **None** |
| **S4** | **Admin read API** (additive): `GET .../matrix-debug` or extend existing dispatch debug with **evaluation payload** (internal/admin only) | **None** or optional JSON column on staging only — prefer **none** |
| **S5** | **Canonical service registry** (code map + tests) — no DB | **None** |
| **S6+** | Optional DB-backed policy rows, zone tables — **only after** shadow stability | **Separate ADR** |

**S1 completion:** Pure façade `evaluateServiceMatrixCandidate` and `ServiceMatrixEvaluator` live under `services/api/src/modules/service-matrix/`, composing existing supply, execution, geography, crew, service-policy, and daily-cap logic with no database or HTTP calls; parity tests live in `test/service-matrix.evaluator.spec.ts`. The module is not registered in `AppModule` and is not wired into public booking or dispatch. **S2** remains shadow-only integration behind `SERVICE_MATRIX_SHADOW` per plan §3.

---

## 2. Rollout order

1. Land **S0** documentation + branch discipline.
2. **S1** pure library + tests — no production behavior change.
3. **S2** shadow logging behind flag — **off** in prod until validated in staging.
4. **S3** dispatch parity — reduces admin vs customer schizophrenia.
5. **S4** observability for ops — **no customer UX change**.
6. **S5** identifier normalization — unblock recurring vs estimate alignment.

---

## 3. Shadow-mode strategy

- **Default:** `SERVICE_MATRIX_SHADOW=0` — façade runs only in test/staging or is no-op in prod.
- **Staging:** enable shadow; **compare** legacy `matchFOs` filter outcome vs façade `eligible` for every evaluation; **alert** on mismatch.
- **Production:** enable shadow **read-only logging** (sampled) before any gate flip.

**Golden tests:** snapshot FO + job contexts from production-like fixtures (anonymized).

---

## 4. Backward compatibility

- Public booking responses **unchanged** until explicit **“explain”** opt-in for admins.
- **`matchFOs`** return type stable; internal refactor only.
- **Assignment recommendations** may later call façade; until then, document divergence (system map §3).

---

## 5. Feature flags

| Flag | Purpose |
|------|---------|
| `SERVICE_MATRIX_SHADOW` | Run façade alongside legacy; log diffs |
| `SERVICE_MATRIX_ADMIN_EXPLAIN` | Return structured reasons in admin-only endpoints |
| `SERVICE_MATRIX_GATE_MATCH` | **Future** — actually use façade to filter (off until parity proven) |

---

## 6. Observability requirements

- Structured log: `service_matrix.evaluation` with **bookingId** (if any), **foId**, **policy codes**, **durationMs**.
- Metrics (later): count of exclusions by **`PolicyReasonCode`**.
- **No PII** in logs beyond existing booking/FO ids.

---

## 7. Admin visibility requirements

See **`SERVICE_MATRIX_OBSERVABILITY_V1.md`**. Minimum V1:

- For a candidate FO + booking/job context: show **ordered list of pass/fail checks** with **codes** and **human labels**.

---

## 8. Failure rollback

- **S1–S3:** revert commits — no schema.
- **S2 shadow:** disable flag — zero user impact.
- **If gate flipped prematurely:** turn off `SERVICE_MATRIX_GATE_MATCH`; keep shadow logging for forensics.

---

## 9. Production verification checkpoints

| Checkpoint | Pass criteria |
|------------|---------------|
| After S1 | Unit parity tests green; CI full green |
| After S2 (staging) | Zero mismatch for shadow for **N** days / **M** evaluations |
| After S3 | Dispatch `reasons` align with façade codes for same fixtures |
| Before any gate | Ops sign-off + runbook for new reason codes |

---

## 10. Safe first introduction

**Highest safety / lowest risk:** **S1** library + tests (no runtime wiring).

**Shadow-only first in prod:** **S2** logging with **default off**.

**Highest operational risk:** Flipping **`SERVICE_MATRIX_GATE_MATCH`** before dispatch + public paths share identical **`JobContext`** construction — could **drop** valid FOs or **admit** invalid ones.

---

## 11. Explicit non-touches

- `booking-scheduled-window.ts`, `booking-window-mutation.ts`, `booking-window-reconciliation.ts`
- `confirmBookingFromHold` transactional window writes
- `EstimatorService` / `estimate-engine-v2` core math
- Stripe webhooks / deposit services
- `recurring.service` occurrence processor (**eligibility helper extraction** is read-only refactor at most)

---

## 12. Open decisions (product)

- Whether **daily capacity** should eventually use **wall-clock** vs **labor hours** (impacts ops fairness; **not decided** here).
- Whether **pet/condition** tiers become **hard eligibility** vs **risk-only** (V1 assumes **risk-only** until product says otherwise).
