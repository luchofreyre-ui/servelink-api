# Service matrix + operational capacity — system map V1

**Status:** architecture audit only — no runtime changes implied.  
**Locked infrastructure (do not refactor from this lane):** canonical `scheduledStart` / `scheduledEnd`, hold→confirm propagation, booking window reconciliation, migration governance, Stripe deposit, confirmation orchestrator, estimator V2 pipeline, recurring engine core, payment anomaly flows.

---

## 1. Executive summary

Operational policy for **who can run which job under which labor/geographic constraints** is **distributed** across FO profile fields (`schema.prisma`), `FoService.matchFOs`, `DispatchCandidateService`, crew-capacity helpers, estimator output parsing, public-booking orchestration, assignment recommendations, team continuity, and recurring eligibility. There is **no single “service matrix” or policy registry**; instead, several modules re-encode overlapping rules (travel, sqft, labor caps, crew floors, service-type allow lists).

---

## 2. Source inventory (by concern)

### 2.1 FO data model (capability storage)

| Path | Responsibility |
|------|----------------|
| `services/api/prisma/schema.prisma` (`FranchiseOwner`) | `teamSize`, `minCrewSize` / `preferredCrewSize` / `maxCrewSize`, `maxSquareFootage`, `maxLaborMinutes`, `maxDailyLaborMinutes`, `homeLat`/`homeLng`, `maxTravelMinutes`, `reliabilityScore`, `matchableServiceTypes[]`, relations to schedules/blockouts/stats. |

### 2.2 FO matching (customer / estimator path)

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/fo/fo.service.ts` | **`matchFOs`**: loads eligible FOs, `evaluateFoSupplyReadiness`, `evaluateFoExecutionReadiness`, haversine travel vs `maxTravelMinutes`, sqft / per-job labor caps, **`matchableServiceTypes`** white-list (mode-dependent via `shouldServiceTypeActAsHardWhitelist`), `getWorkloadMinCrew` vs `resolveFranchiseOwnerCrewRange`, **`maxDailyLaborMinutes`** using **sum of `estimatedHours * 60`** for today’s bookings, scoring/ranking. **`getEligibility`** / **`eligibilityFromFranchiseOwnerRow`**: status/safety + supply readiness. |
| `services/api/src/modules/fo/fo-supply-readiness.ts` | Coordinates, travel param validity, schedule row count, capacity-field validity. |
| `services/api/src/modules/fo/fo-execution-readiness.ts` | Provider linkage consistency for matching. |
| `services/api/src/modules/fo/fo-activation-guard.ts` | Activation path; reuses supply readiness. |
| `services/api/src/modules/fo/service-matching-policy.ts` | **`shouldServiceTypeActAsHardWhitelist`**, **`isContinuityFirstService`**, **`shouldPreferPriorTeam`** — semantic coupling between **segment**, **service type**, and **booking match mode** (e.g. public deep clean vs commercial strict whitelist). |

### 2.3 Crew / labor governance (platform + assignment)

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/crew-capacity/workload-min-crew.ts` | **`getWorkloadMinCrew`**: labor-minute bands + sqft thresholds → minimum crew (explicitly **not** service-type-specific in v1). |
| `services/api/src/modules/crew-capacity/crew-capacity-policy.ts` | Global max crew, residential/commercial caps by **service type** (`maintenance`, `deep_clean`, `move_in`/`move_out`), **`clampCrewSizeForService`**. |
| `services/api/src/modules/crew-capacity/franchise-owner-crew-range.ts` | **`resolveFranchiseOwnerCrewRange`**: legacy `teamSize` vs explicit min/pref/max columns. |
| `services/api/src/modules/crew-capacity/assigned-crew-and-duration.ts` | **`computeAssignedCrewSize`**, elapsed minutes from labor (slot duration / ranking). |
| `services/api/src/modules/crew-capacity/parse-estimate-job-match-fields.ts` | **Bridge** from estimate snapshot → `squareFootage`, `estimatedLaborMinutes`, `recommendedTeamSize`, `serviceType`, `serviceSegment` for matching. |

### 2.4 Dispatch / admin candidate path (parallel rules)

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/dispatch/dispatch-candidate.service.ts` | **`getCandidates`**: separate loop — provider checks, travel, sqft, per-job labor, **`getWorkloadMinCrew`**, daily cap from **`estimatedHours`**, builds **`reasons[]`** per FO (more explicit than `matchFOs` silent `continue`). |
| `services/api/src/modules/dispatch/dispatch.service.ts` | Uses `clampCrewSizeForService` and broader dispatch workflow (large file — booking/offers/manual ops). |

### 2.5 Public booking & availability

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/public-booking-orchestrator/public-booking-orchestrator.service.ts` | **`resolveFoCandidateIds`**: geocoded site + snapshot → **`parseEstimateJobMatchFields`** → **`fo.matchFOs`**. **`availability`**: eligibility per FO, **`getWorkloadMinCrew`**, **`buildRankedTeamOptions`**, slot duration via **`computeSlotDurationMinutesForFo`**, rank options. Strong coupling: **booking-centric** + **snapshot-derived job match**. |
| `services/api/src/modules/slot-holds/slot-availability.service.ts` | Availability / overlap using canonical window resolution (**locked** — treat as consumer of labor duration inputs only). |
| `services/api/src/modules/slot-holds/slot-holds.service.ts` | Hold creation; uses booking/FO overlap rules (**locked** contract). |

### 2.6 Estimator → labor truth

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/estimate/estimator.service.ts` | Labor outputs, `clampCrewSizeForService`, **`matchFOs`** for dispatch-style pools (e.g. candidate lists). **Do not modify estimator math from service-matrix lane.** |
| `services/api/src/modules/estimate/estimate-engine-v2.service.ts` | **`estimateV2`**: sqft/bed/bath/service/condition/pet/recency → minutes, caps, **`riskFlags`**. Policy encoded in formulas, not in a separate eligibility table. |
| `services/api/src/modules/bookings/deep-clean-estimator-tuning.apply.ts` | Deep-clean–specific tuning hooks (coupling deep clean to estimate path). |

### 2.7 Intake / funnel

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto.ts` | home size, bedrooms, bathrooms, pets, `estimateFactors`, recurring interest, deep clean program enum. |
| `services/api/src/modules/booking-direction-intake/intake-to-estimate.mapper.ts` | Maps intake → estimate input; geocoding note for `matchFOs`. |
| `services/api/src/modules/booking-direction-intake/intake-booking-bridge.service.ts` | Bridges intake → booking + `siteLat`/`siteLng` for estimates. |

### 2.8 Assignment & continuity (authenticated / admin)

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/bookings/assignment/assignment.service.ts` | **`buildRecommendations`**: broad FO list filtered by **`fo.getEligibility`**, day-bounded overlap heuristic vs **calendar day**, distance/time preference — **not** a full replay of `matchFOs` job constraints. |
| `services/api/src/modules/bookings/assignment/assignment.types.ts` | Recommendation shapes. |
| `services/api/src/modules/bookings/bookings.service.ts` | **`assignBooking`**, transitions, (**locked** window helpers). |
| `services/api/src/modules/bookings/dispatch-ops.service.ts` | Manual assign; state guards; uses `bookingsService.applyAssignmentTransitionInTx`. |
| `services/api/src/modules/bookings/booking-team-continuity.service.ts` | **`matchFOs`** with `bookingMatchMode: "authenticated_recurring"`, plan snapshot parsing, prior-team preference. |

### 2.9 Recurring eligibility (service-type dimension)

| Path | Responsibility |
|------|----------------|
| `services/api/src/modules/recurring/recurring.service.ts` | **`assertServiceEligibleForRecurring`**: **`RECURRING_ELIGIBLE_SERVICE_TYPES`** (`recurring-home-cleaning`, `deep-cleaning`), blocks **`move-in-move-out`**. Slug vocabulary **differs** from estimator `service_type` strings (`maintenance`, `deep_clean`, etc.) — **mapping hazard**. |

### 2.10 Geography / scheduling artifacts

| Path | Responsibility |
|------|----------------|
| `services/api/prisma/schema.prisma` (`FoSchedule`, `FoBlockout`) | Weekly schedules, blockouts — consumed indirectly via schedule row counts and slot generation (**not** fully duplicated in `matchFOs` travel math). |
| `services/api/src/dev/dispatchTestFoProfiles.ts` | Dev comment: ZIP coverage not first-class; `matchFOs` uses home lat/lng. |

### 2.11 Stats / reputation (soft signals)

| Path | Responsibility |
|------|----------------|
| `services/api/prisma/schema.prisma` (`FranchiseOwnerDispatchStats`, `FranchiseOwnerReliabilityStats`, `FranchiseOwnerReputation`, `FranchiseOwnerJobTypeStats`) | Acceptance/completion signals; **`FranchiseOwnerJobTypeStats`** keyed by `serviceType` + `jobSizeBand` — underused vs centralized eligibility. |

---

## 3. Duplicated / divergent logic

| Topic | Locations | Risk |
|-------|-----------|------|
| Travel + sqft + max labor | `FoService.matchFOs` (silent skip) vs `DispatchCandidateService.getCandidates` (explicit `reasons`) | **Admin/debuggability** vs **customer path** inconsistency. |
| Daily labor cap | `matchFOs` and `dispatch-candidate.service` both sum **`estimatedHours * 60`** | Aligns with **labor-hour** accounting, not wall-clock; may diverge from **canonical window** duration for ops truth (by design elsewhere — do not “fix” from this lane without a dedicated spec). |
| Workload min crew | `matchFOs`, `dispatch-candidate`, `public-booking-orchestrator` | Same function **`getWorkloadMinCrew`** — good; callers must stay in sync on **inputs** (labor minutes / sqft source). |
| Service-type allow list | `matchableServiceTypes` + `shouldServiceTypeActAsHardWhitelist` | Mode-dependent **exceptions** (e.g. public residential deep clean) are **implicit code**, not data-driven. |
| Recurring service slugs vs estimator types | `recurring.service` sets vs intake/estimate `service_type` | **Dual vocabulary** → integration bugs if matrix does not normalize. |

---

## 4. Hidden coupling zones (dangerous)

1. **`parseEstimateJobMatchFields`** — single choke point from snapshot → matching; any estimate output shape drift breaks FO pools and slot duration everywhere downstream.
2. **`matchFOs`** — central for customer matching but **opaque** (continue without structured reason); dispatch path has richer **`reasons`**.
3. **`AssignmentService.buildRecommendations`** — **eligibility ≠ matchFOs job fit**; admins can see “eligible” FOs that would never appear in public `matchFOs` for the same job shape.
4. **`service-matching-policy.ts`** — small file, **high semantic leverage**; easy to break public vs commercial vs recurring behavior with a one-line change.
5. **Recurring vs one-time service identifiers** — matrix design must introduce a **canonical service dimension** without rewriting recurring engine internals in v1.

---

## 5. Current operational weaknesses

- **No first-class “why excluded”** on the `matchFOs` / public path for each constraint (travel vs sqft vs service vs crew vs daily cap).
- **Policy scattered** across Prisma columns, static TS policy modules, and estimator formulas.
- **Scaling**: adding dimensions (e.g. **pet severity tiers**, **condition caps**, **zone IDs**) forces touching multiple call sites (`matchFOs`, dispatch, possibly orchestrator, possibly intake DTOs).
- **Operational risk**: **black-box** ranking/scoring inside `matchFOs` for customer trust and FO disputes.

---

## 6. Invariants already enforced (respect as contracts)

- `evaluateFoSupplyReadiness` / execution readiness gates before scoring.
- `clampCrewSizeForService` / `getServiceMaxCrewSize` residential vs commercial ceilings.
- `getWorkloadMinCrew` floor for crew vs labor/sqft.
- `shouldServiceTypeActAsHardWhitelist` — intentional business rules for segment × mode × type.
- Recurring: **`assertServiceEligibleForRecurring`** — hard block move-in/out and non-whitelist slugs.
- Canonical booking wall-clock persistence (**locked** — service matrix must **consume** scheduled windows, not redefine them).

---

## 7. Scaling bottlenecks

- **Adding a new orthogonal policy axis** (e.g. **geo zones**, **severity caps**) without a registry → N× edits across `matchFOs`, dispatch, tests, and possibly web.
- **Reason codes** not normalized across paths → observability and automation (auto-dispatch, admin UX) stall.
- **Estimator output** as implicit “policy input” → version coupling between estimate schema and FO matrix.

---

## 8. Out of scope for V1 map (locked systems)

- Stripe deposit / payment lifecycle.
- `BookingsService.confirmBookingFromHold` window mutation / reconciliation modules.
- Prisma migration governance scripts.
- Recurring occurrence state machine internals (except eligibility entry points listed above).
