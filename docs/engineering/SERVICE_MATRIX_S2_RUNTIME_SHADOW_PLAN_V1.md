# Service matrix S2 — runtime shadow integration plan (V1)

**Status:** analysis / planning only. **This document introduces no runtime code, wiring, schema, or behavior changes.**

**Base assumptions:** S1 façade (`evaluateServiceMatrixCandidate`), S2 design (`SERVICE_MATRIX_S2_SHADOW_INTEGRATION_DESIGN_V1.md`), and S2 payload builder (`buildServiceMatrixShadowPayload`) are on `main` (e.g. post `db38d18`).

---

## 1. Inspected surfaces (read-only)

### 1.1 Public booking — FO matching

| Element | Location | Notes |
|--------|----------|--------|
| Legacy matcher | `services/api/src/modules/fo/fo.service.ts` — `matchFOs` | Loads rows via `getEligibleFOs()`, runs supply, execution, travel, sqft, per-job labor, crew vs workload, `shouldServiceTypeActAsHardWhitelist` + `matchableServiceTypes`, then **per-FO** `booking.findMany` for today’s committed minutes vs `maxDailyLaborMinutes`, scores survivors, returns top `limit`. |
| Job match input shape | `JobMatchInput` in same file | `lat`, `lng`, `squareFootage`, `estimatedLaborMinutes`, `recommendedTeamSize`, optional `serviceType`, `serviceSegment`, `limit`, `bookingMatchMode`. |
| Orchestrator candidate resolution | `services/api/src/modules/public-booking-orchestrator/public-booking-orchestrator.service.ts` — `resolveFoCandidateIds` | If `booking.foId` set → single-id path. Else parses `parseEstimateJobMatchFields` from `estimateSnapshot`; builds `JobMatchInput` with `bookingMatchMode: "public_one_time"`, `limit: MAX_FO_CANDIDATES`; calls `this.fo.matchFOs(input)`; maps to IDs; **`preferNonFixtureFoIds`** reorders; returns slice. Fallback: `extractFoIdsFromEstimateOutput` snapshot IDs without live match. |
| Team options | `buildRankedTeamOptions` | Walks `candidateIds` in order, `getEligibility` per id, builds `PublicBookingTeamOption[]` with crew/labor from booking + `jobMatch`. |
| Customer-visible outcome | IDs + team list / availability | Same IDs drive team pick and slot path; changing ranking or membership without parity is high-risk. |

**Observability:** orchestrator uses Nest `Logger` via `logLifecycle`, emitting objects shaped as `{ kind: "public_booking_lifecycle", ...event }`. Suitable pattern for **additional** `service_matrix.shadow_diff`-style structured keys if redacted **(no PII)**.

### 1.2 Dispatch — candidates

| Element | Location | Notes |
|--------|----------|--------|
| Service | `services/api/src/modules/dispatch/dispatch-candidate.service.ts` — `getCandidates` | Different `findMany` filter (`providerId` required; no `FoSchedule` count via include in snippet). |
| Reasons | `ineligibilityReasons: string[]`, `canReceiveDispatch: reasons.length === 0` | Strings like `TRAVEL_LIMIT_EXCEEDED`, `DAILY_CAPACITY_EXCEEDED`. |
| Daily cap | Same day window + `booking.findMany` + `estimatedHours` → minutes | **Aligned with `matchFOs`** pattern (good for future matrix parity on cap). |
| Input | `DispatchCandidateInput` | Overlaps `JobMatchInput` for geo/job scale; **no** `bookingMatchMode` today. |

**Gap vs public path:** eligibility universe and reason taxonomy differ; shadow here compares **dispatch legacy** to matrix, not to public `matchFOs` directly.

### 1.3 Slots / team validation

| Element | Location | Notes |
|--------|----------|--------|
| Window listing | `services/api/src/modules/slot-holds/slot-availability.service.ts` — `listAvailableWindows` | Single `foId`; blocks from bookings + holds; **no** `matchFOs`. |
| Public availability | `PublicBookingOrchestratorService.availability` | Validates `foId` ∈ `candidateIds`; `getEligibility(foId)`; then duration + `slotAvailability.listAvailableWindows`. |

Shadow on “slots” alone is **secondary**: pool comparison belongs at **`matchFOs` / `resolveFoCandidateIds`**; slot path validates one FO.

### 1.4 Logging / ops conventions (sample)

| Pattern | Example | Relevance |
|---------|---------|-----------|
| Public booking lifecycle | `PublicBookingOrchestratorService.logLifecycle` → `Logger.log({ kind: "public_booking_lifecycle", ... })` | Pattern for **non-ledger** structured logs; keep matrix shadow fields namespaced (`event: "service_matrix_shadow_diff"` or nested under `kind`). |
| Booking ledger | `BookingEventType` in Prisma (`OFFER_CREATED`, `DISPATCH_*`, `NOTE`, …) | **Do not** write shadow diffs to booking ledger in S2; avoid customer-visible coupling. |
| Ops anomalies | `OpsAnomalyType`, `integrity.sweep.cron`, `ops-visibility` summaries | **Out of scope** for first slice; shadow is diagnostic, not billing/dispatch anomaly. |

**PII:** orchestration logs already include `bookingId` in lifecycle events — acceptable; **do not** add customer name, email, phone, street address, payment ids, or raw `estimateSnapshot` blobs to shadow payloads or log fields.

---

## 2. First-surface scoring

| Criterion (0–2 each) | `public_booking` | `dispatch` | `slots` | `admin_explain` |
|----------------------|------------------|------------|---------|-----------------|
| Input completeness for `JobContext` | 2 — `resolveFoCandidateIds` already builds full `JobMatchInput` when snapshot + geo exist | 1 — strong geo/labor; **no** `bookingMatchMode` on input | 0–1 — often single `foId`; pool diff N/A at slot layer | 2 — can load booking + snapshot |
| `committedLaborMinutesToday` availability | 2 — same query pattern as `matchFOs` (per FO, day bounds) | 2 — **already** in `DispatchCandidateService` | 1 — only if re-run matrix for that FO | 2 — can query when implementing |
| Geo availability | 2 — `siteLat`/`siteLng` on booking | 2 | 2 — from booking | 2 |
| Behavior drift risk if shadow buggy | 1 — must be strictly post-result / try-catch | 1 | 2 — narrow path | 2 |
| Log / PII risk | 1 — booking id + fo ids; strict redaction needed | 1 — dispatch context | 2 | 1 — admin tooling |
| Parity comparison ease vs S1 façade | 2 — façade models `matchFOs` gates | 1 — partial overlap + different filters | 0 — not a pool compare | 2 — manual |
| Testability (unit + e2e) | 2 | 1 | 1 | 1 |
| **Total (higher = better first)** | **14** | **11** | **8–10** | **12** |

**Override check:** `admin_explain` is safer for blast radius but lower traffic and not the customer path. **`public_booking` remains the selected first surface** — highest alignment with S1 unit tests and `JobMatchInput`.

---

## 3. Selected first surface

**`public_booking`** (live `matchFOs` used from `PublicBookingOrchestratorService.resolveFoCandidateIds` when estimate snapshot + site coordinates exist).

**Why:** Full `JobContext` is already assembled; committed labor and geo match the façade’s design; shadow compares the same eligibility surface customers depend on; staging traffic exercises the integration meaningfully.

---

## 4. Implementation boundary (future build — not done here)

### 4.1 Preferred file and insertion point

**Primary recommendation (efficiency + correctness):**  
`services/api/src/modules/fo/fo.service.ts` — inside **`matchFOs`**, within the existing `for (const fo of fos)` loop **after** a candidate has passed all gates that the façade mirrors **and** you have **committed minutes** for daily cap (reuse values already computed for the `maxDailyLaborMinutes` check), **or** immediately after the loop using the same in-memory `fo` rows and a cached `committedMinutesByFoId` map built in-loop to avoid double DB.

- **Rationale:** Full union of legacy-considered FOs is only available here without a second `getEligibleFOs` + duplicate queries. This keeps **`removedByMatrix` / `addedByMatrix`** meaningful vs “only re-check top-N matches.”

**Alternative (higher duplication, lower touch to loop structure):**  
`public-booking-orchestrator.service.ts` — `resolveFoCandidateIds`, **after** `await this.fo.matchFOs(input)` (~line 414), call a **new** `FoService` package method that re-enters eligibility enumeration (second `getEligibleFOs` + matrix loop). Acceptable for a first spike **only if** perf budget approved; otherwise prefer in-`matchFOs` hook.

### 4.2 Data available at insertion (in-loop design)

| Need | Source |
|------|--------|
| `JobContext` | Map from existing `JobMatchInput` + optional `riskFlags` from snapshot parsing (future tiny helper; **no** raw snapshot in logs). |
| `MatrixCandidateInput` | From current `fo` row: ids, userId, provider linkage, coords, caps, schedule count, crew fields, `matchableServiceTypes`; `committedLaborMinutesToday` from the same reduction already used for daily cap in that iteration. |
| `legacyCandidateIds` | Ordered or unordered set of `fo.id` that **survive** legacy gates **before** `limit` slice — compare **full survivor set pre-limit** for parity, then optionally note **top-N slice** in payload detail; **exact choice must be frozen in build PR** (recommend: survivors before sort/limit vs final returned IDs — document in code comment). |
| `matrixCandidateIds` | `fo.id` where `evaluateServiceMatrixCandidate(...).eligible === true` for same enumeration. |
| Shadow payload | `buildServiceMatrixShadowPayload` with **caller-computed** `jobContextHash` from redacted canonical fields only; summaries per `SERVICE_MATRIX_S2_SHADOW_INTEGRATION_DESIGN_V1.md`. |

### 4.3 Log sink (initial)

- **Structured log only** (e.g. `Logger.log` / `Logger.debug` with fixed `event` key and payload JSON-serializable object).
- **No** new DB table, **no** admin UI, **no** HTTP endpoint in S2 first runtime drop.

---

## 5. Flag / safety contract (exact behavior)

| Variable | Default | Rule |
|----------|---------|------|
| `ENABLE_SERVICE_MATRIX_SHADOW` | `false` | If not truthy, **do not** call `evaluateServiceMatrixCandidate` or `buildServiceMatrixShadowPayload` for shadow. |
| `SERVICE_MATRIX_SHADOW_SAMPLE_RATE` | `0` | If ≤ 0 or interpretation yields “skip,” **no** evaluator execution. If ∈ (0,1], RNG vs request/booking id hash — **document unit** in build PR. |
| `SERVICE_MATRIX_SHADOW_SURFACES` | `public_booking` (suggested) | Comma list; if current surface not included, **no** execution. |

**Failure isolation:**  
Any exception in shadow path → catch, log **one** `service_matrix.shadow_failure` (or equivalent) with `bookingId` / `requestId` and error class **only** — **never** throw, **never** alter return value of `matchFOs` / orchestrator.

**No enforce flag** in this slice; matrix must not filter or reorder results.

---

## 6. Logging / redaction contract

- Emit only: `bookingId`, `requestId`, `foId`s, reason **codes**, boolean flags, hashed/bucketed context, `safeRedactions` list echo.
- **Never** emit: customer name, email, phone, street address, payment data, full estimate JSON, provider PII.
- **`jobContextHash`:** precomputed outside builder; no raw lat/lng in logs unless using **coarse buckets** agreed with security.

---

## 7. Test plan (future build drop)

| Test | Expectation |
|------|-------------|
| Flag off | No calls to shadow evaluator / payload builder (mock or spy). |
| Sample rate 0 | No evaluator calls. |
| Surface excluded | No evaluator calls when surface not in allowlist. |
| Evaluator throws | Legacy `matchFOs` / orchestrator return **unchanged**; shadow failure log path hit once. |
| Payload builder input | Only redacted summaries + ids; snapshot tests on shape. |
| PII guard | Serialized log object tree contains **no** forbidden keys (mirror `service-matrix-shadow-payload.spec` patterns). |
| Parity fields | `addedByMatrix`, `removedByMatrix`, `decisionDiffs`, `reasonCodeDiffs` populated on controlled fixtures. |
| Legacy unchanged | `matchFOs` return value deep-equal with shadow off vs on (same inputs). |

---

## 8. Stop conditions (operational)

- Any **unexpected** systematic `removedByMatrix` on `public_booking` in staging (per design §4 thresholds).
- PII regression in log review → disable flag immediately.
- Sample-induced latency SLO breach → reduce rate or disable.
- **Do not** proceed to production shadow sampling until staging soak passes design criteria.

---

## 9. Confirmation — this analysis drop

**No application source files, schema, or migrations were modified as part of producing this plan.** Only this markdown document is added when committed.

---

## 10. Related documents

- `SERVICE_MATRIX_S2_SHADOW_INTEGRATION_DESIGN_V1.md`
- `SERVICE_MATRIX_IMPLEMENTATION_PLAN_V1.md`
- `SERVICE_MATRIX_OBSERVABILITY_V1.md`

**Recommended next build drop:** **BUILD DROP — SERVICE MATRIX S2 PUBLIC BOOKING SHADOW RUNTIME V1**
