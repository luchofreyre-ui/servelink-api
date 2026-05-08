# Service matrix V1 — target architecture

**Principles:** additive-only interfaces; **no rewrite** of locked booking window, estimator core, payments, or recurring state machine; preserve existing public/admin APIs in V1; **defer schema normalization** until policy stabilizes.

---

## 1. Problem statement

Operational rules for **service ↔ FO ↔ labor ↔ geography** live in multiple modules with **partially duplicated** enforcement and **asymmetric explainability** (dispatch `reasons[]` vs `matchFOs` silent skips). V1 introduces a **central governance façade** that **evaluates** and **explains** policy decisions without initially replacing every caller.

---

## 2. Logical architecture (layers)

### 2.1 Service capability model (read model + inputs)

**Purpose:** Describe what the platform believes an FO **can** do before scoring.

**Sources (existing — not replaced day one):**

- `FranchiseOwner` capacity columns (`schema.prisma`).
- `matchableServiceTypes` allow list.
- `FoSchedule` / `FoBlockout` (via existing supply/availability systems).

**V1 addition (conceptual):**

- **`ServiceMatrixProfile`** (in-memory or thin read model): normalized view of an FO for matrix evaluation — crew range, caps, coordinates, allow-listed **canonical** service IDs, optional **tags** (e.g. `accepts_pets_heavy`, `deep_clean_certified`) as **additive** flags when introduced — **optional in first slice**.

### 2.2 Eligibility policy layer

**Purpose:** Binary or graded **service ↔ job ↔ FO compatibility**.

**Policy dimensions (target coverage — phased):**

| Dimension | Today (approx.) | V1 direction |
|-----------|-------------------|--------------|
| Service type / segment | `matchableServiceTypes`, `shouldServiceTypeActAsHardWhitelist` | Central **eligibility decision** returning structured **`EligibilityCode[]`** |
| Sqft | `maxSquareFootage` vs job sqft | Same rule, one evaluator |
| Per-job labor | `maxLaborMinutes` vs `estimatedLaborMinutes` | Same |
| Bedrooms / bathrooms / pets / condition | Mostly in **estimator**; not centrally capped vs FO today | **Shadow evaluation** first: compute **risk/eligibility signals** without blocking |
| Recurring | `RECURRING_ELIGIBLE_SERVICE_TYPES`, move-in/out block | Map **canonical service** → recurring eligibility in one function |
| Deep clean / move-out **program** | Intake DTO + estimate tuning | Eligibility module **reads** existing intake/estimate outputs only |

**Rule:** V1 **does not** change estimator formulas; it may **consume** outputs.

### 2.3 Capacity policy layer

**Purpose:** Labor-minute and crew governance independent of “who is closer.”

**Consolidate (conceptually):**

- `getWorkloadMinCrew`, `resolveFranchiseOwnerCrewRange`, `computeAssignedCrewSize`, `getServiceMaxCrewSize` chain — **invoke from one `CapacityEvaluation`** façade that returns **required min crew**, **assigned crew** (for display), and **labor budget** checks.

- **Daily caps:** continue to use committed **labor minutes** model already in `matchFOs` / dispatch until ops defines wall-clock-based caps — **explicit non-goal** for V1 unless product specifies.

### 2.4 Geographic policy layer

**Purpose:** Travel-time feasibility and future **zones**.

**Today:** haversine + `maxTravelMinutes`.

**V1:** Wrap in **`GeographicEvaluation`** with hooks for:

- **Zone membership** (future: polygon/region IDs — **shadow-only** until data exists).
- **Blackout regions** (future — **no new geometry engine** in V1).

### 2.5 Operational risk layer

**Purpose:** Surface **high-risk jobs** (from estimate `riskFlags`, condition scores, size) for **manual review** or **dispatch escalation** — **advisory** in early slices.

**Inputs:** `estimate-engine-v2` / snapshot `riskFlags`, **`parseEstimateJobMatchFields`** labor/sqft.

**Outputs:** `RiskTier`, `requiresManualReview` booleans — **does not** auto-reject FOs in V1 unless product explicitly enables.

---

## 3. Integration pattern (additive façade)

Introduce a dedicated module namespace, e.g. `src/modules/service-matrix/`:

| Component | Role |
|-----------|------|
| `evaluateFoForJobContext()` | Single entry: FO row + **JobContext** (lat/lng, sqft, labor minutes, service type/segment, match mode, optional snapshot IDs) → **`MatrixEvaluationResult`**. |
| `JobContext` | DTO built by **`public-booking-orchestrator`**, **`FoService.matchFOs`** (internal), or **`DispatchCandidateService`** without changing their external contracts initially. |
| `MatrixEvaluationResult` | `{ eligible: boolean; excludeReasons: PolicyReasonCode[]; capacity: CapacitySlice; geography: GeoSlice; risk: RiskSlice }` |

**Callers (later slices):** may **dual-run**: legacy branch vs façade in **shadow mode** (log-only) before switching gates.

---

## 4. Backward compatibility

- Existing HTTP routes and DTOs **unchanged** in V1.
- **`matchFOs`** continues to return the same shape until a flag flips.
- **No** removal of `evaluateFoSupplyReadiness` / crew modules — façade **composes** them.

---

## 5. Non-goals (V1 architecture)

- Replacing Prisma `FranchiseOwner` columns with normalized `fo_capabilities` tables (optional **later**).
- Changing **estimator V2** equations or Stripe flows.
- Rewriting **slot overlap** or **canonical window** math.
- Unified **commercial** product rules beyond existing `ServiceSegment` handling.

---

## 6. Mapping: current files → façade (migration targets)

| Current | Eventually invoked by façade |
|---------|------------------------------|
| `fo-supply-readiness.ts` | Supply pre-check |
| `fo-execution-readiness.ts` | Execution pre-check |
| `service-matching-policy.ts` | Whitelist / mode rules |
| `workload-min-crew.ts` | Capacity slice |
| `crew-capacity-policy.ts` | Crew clamp inputs |
| `franchise-owner-crew-range.ts` | Crew range |
| `assigned-crew-and-duration.ts` | Assigned crew + duration for explain payload |
| Travel math in `fo.service.ts` | Geographic slice |

---

## 7. Canonical identifiers

**V1 must plan** for a **single internal service enum / slug registry** that maps:

- Estimator `service_type` (`maintenance`, `deep_clean`, …).
- Intake / catalog `serviceId` strings.
- Recurring plan `serviceType` slugs (`recurring-home-cleaning`, …).

**Implementation:** document-only in first PR; code mapping in **Implementation plan** slice 2+.
