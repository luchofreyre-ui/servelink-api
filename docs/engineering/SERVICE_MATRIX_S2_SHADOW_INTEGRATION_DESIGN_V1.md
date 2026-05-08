# Service matrix S2 — shadow integration design (V1)

**Status:** design + contract only. **No** production gating, no `AppModule` wiring for enforcement, no schema changes. This document defines *where* shadow evaluation will attach in a future build drop and *what* structured diff logging must carry.

**Depends on:** S1 façade (`evaluateServiceMatrixCandidate`, `JobContext`, `MatrixCandidateInput`) merged on `main`; implementation sequencing in `SERVICE_MATRIX_IMPLEMENTATION_PLAN_V1.md`.

---

## 1. Shadow integration map

Shadow mode means: run the matrix façade **alongside** the legacy path, **compare** eligibility sets and reason payloads, **emit structured logs/metrics**, and **never** change which FOs are returned, ranked, or offered until an explicit future gate (not part of S2).

### 1.1 Public booking — FO matching path

| Aspect | Detail |
|--------|--------|
| **Legacy source of truth** | `FoService.matchFOs` (`fo.service.ts`): loads eligible FOs via `getEligibleFOs()`, applies supply/execution/travel/sqft/labor/crew/service whitelist/daily-cap, scores and truncates to `limit`. |
| **Primary call sites (today)** | `PublicBookingOrchestratorService.resolveFoCandidateIds` (builds `JobMatchInput`, calls `this.fo.matchFOs`); `EstimatorService.executeEstimateCore` (estimate-time pool with `bookingMatchMode`). |
| **Where `JobContext` can be built** | Same fields as `JobMatchInput` + optional `riskFlags` from estimate snapshot when available: lat/lng from booking/site, `squareFootage` / `estimatedLaborMinutes` / `recommendedTeamSize` / `serviceType` / `serviceSegment` from `parseEstimateJobMatchFields` or orchestrator job match; `bookingMatchMode: "public_one_time"` (or authenticated modes when that path runs). |
| **Where `committedLaborMinutesToday` must come from** | Parity with `matchFOs`: for each **candidate FO**, sum of `round((estimatedHours ?? 0) * 60)` for that FO’s bookings with `scheduledStart` in **[startOfToday, endOfToday]** in the **server timezone / “today” definition** used by `matchFOs` (`fo.service.ts`). Shadow must use the **same calendar day window** and query shape as legacy to avoid false diffs. |
| **Where legacy vs matrix can be compared** | Immediately **after** `matchFOs` returns (or inside `matchFOs` as a trailing side effect in a later patch): legacy ordered IDs vs matrix `eligible === true` per candidate ID. **Do not** re-sort or filter the returned list. |
| **What must NOT change** | HTTP responses, ranked order, limits, `resolveFoCandidateIds` semantics, team option building, error codes to the client, transactional booking writes. |
| **Data for diff logging** | Booking id (if any), correlation/request id, list of legacy matched `foId`s, matrix-eligible `foId`s, per-FO `primaryFailureCode` when matrix says ineligible, boolean `committedLaborMinutesPresent`, hashes/coarse summaries of job context (see §2). |

---

### 1.2 Dispatch candidate path

| Aspect | Detail |
|--------|--------|
| **Legacy source of truth** | `DispatchCandidateService.getCandidates` (`dispatch-candidate.service.ts`): different `where` than public (`providerId` required, no `FoSchedule` count gate in the excerpt path), string `ineligibilityReasons[]`, `canReceiveDispatch`, travel/sqft/labor/workload rules partially overlapping `matchFOs`. **Dispatch is not identical to public booking** by design—the shadow layer must compare **per surface** against that surface’s legacy outcome, not assume parity across surfaces. |
| **Primary call sites** | Dispatch flows that build `DispatchCandidateInput` and consume `DispatchCandidate[]` (e.g. dispatch ranking / admin tooling that lists candidates). |
| **Where `JobContext` can be built** | Map `DispatchCandidateInput` → `JobContext` (lat, lng, squareFootage, estimatedLaborMinutes, recommendedTeamSize, serviceType, serviceSegment). `bookingMatchMode` for dispatch-style evaluation should be documented per caller (often admin/internal — may default to a mode that matches how `shouldServiceTypeActAsHardWhitelist` should behave for that flow). |
| **Where `committedLaborMinutesToday` must come from** | **Gap today:** `DispatchCandidateService` loop does not show `maxDailyLaborMinutes` booking aggregation. For shadow parity **on dispatch**, either (a) extend read path to mirror `matchFOs` cap inputs when comparing to matrix, or (b) document dispatch as “matrix shadow without daily cap until inputs wired” and exclude cap from diff for that surface until S2.1. **Design requirement:** before treating dispatch shadow as authoritative, **must** feed matrix the same committed minutes signal dispatch will use post-alignment. |
| **Where legacy vs matrix can be compared** | **Per candidate row:** legacy `canReceiveDispatch` + `ineligibilityReasons` vs matrix `eligible` + `checks` / `primaryFailureCode`. Set-level diff: legacy `canReceiveDispatch` IDs vs matrix-eligible IDs. |
| **What must NOT change** | Who receives dispatch, ranking scores, penalties, `filterCandidatesByRadius`, assignment outcomes, admin-visible candidate lists ordering **from legacy code paths** (logging only). |
| **Data for diff logging** | `providerId` / `foId`, dispatch booking id if applicable, legacy `ineligibilityReasons` strings, matrix reason codes, flag whether daily-cap input was available for that evaluation. |

---

### 1.3 Slot availability path

| Aspect | Detail |
|--------|--------|
| **Legacy source of truth** | `SlotAvailabilityService.listAvailableWindows` (`slot-availability.service.ts`): given a **single** `foId`, computes free windows from bookings + holds; **does not** run full `matchFOs`. Public flow: `PublicBookingOrchestratorService.availability` resolves `foId` against `candidateIds` (from `resolveFoCandidateIds` / team list), then loads windows. |
| **Shadow meaning on this path** | There is **no multi-FO pool** inside `listAvailableWindows`. Shadow here means: (1) **optional** re-validation that the **selected** `foId` still passes matrix for the **same** `JobContext` used to compute `durationMinutes` / crew / labor in `availability`; (2) or, when `availability` returns **team options** without a selected FO, shadow-compare matrix eligibility for each **displayed** candidate against legacy list construction **at team-build time** (closer to public matching path than slot engine). |
| **Where `JobContext` can be built** | Same as public: `parseEstimateJobMatchFields` + booking site lat/lng, `bookingMatchMode`, labor from `resolveRequiredLaborMinutes`. |
| **Where `committedLaborMinutesToday` must come from** | Required for matrix daily-cap checks when shadow re-evaluates eligibility; same aggregation as §1.1. **Not** required for pure geometric slot listing (interval math), but **is** required if matrix shadow runs on “would this FO still be eligible for this job.” |
| **Where legacy vs matrix can be compared** | Binary: “legacy allowed this `foId` to reach slot listing” vs “matrix strict eligibility.” For team options: compare ordered eligible ID sets at `buildRankedTeamOptions` / `matchFOs` boundary rather than inside `listAvailableWindows`. |
| **What must NOT change** | Canonical window duration, overlap rules, hold TTL behavior, slot ID encoding, customer-visible window list ordering **determined by today’s logic**. |
| **Data for diff logging** | `bookingId`, `foId`, `durationMinutes`, whether job match/labor source was present, matrix vs legacy eligibility boolean. |

---

### 1.4 Admin explain / debug path

| Aspect | Detail |
|--------|--------|
| **Legacy source of truth** | Today: dispatch candidates expose `reasons[]`; public path often silent. Admin/support may use internal dispatch views, logs, or future debug endpoints. |
| **Where `JobContext` can be built** | From admin request: `bookingId` → load booking + estimate snapshot → `parseEstimateJobMatchFields`; site coordinates from booking; mode inferred from booking type (recurring vs one-time) where applicable. |
| **Where `committedLaborMinutesToday` must come from** | Same day-bounded booking sum per FO as §1.1, with explicit `evaluationDay` in payload for support clarity (always **date only**, no timestamps that leak customer schedule detail beyond operational need). |
| **Where legacy vs matrix can be compared** | Side-by-side: legacy strings vs matrix `checks[]` ordered list; **read-only** in S2. |
| **What must NOT change** | Existing admin RBAC, production booking mutation routes, customer data exposure in APIs. |
| **Data for diff logging** | Operator id (internal), booking id, fo id, redacted summaries (§2); suitable for structured “support_matrix_debug” event. |

---

## 2. Shadow comparison payload (contract)

This is the **target** JSON shape for `service_matrix.shadow_diff` (or equivalent) logs / traces. **Concrete TypeScript types** belong in a later **BUILD** drop (`SERVICE_MATRIX_S2_SHADOW_PAYLOAD_BUILDER`); this section is the **contract**.

### 2.1 Required fields

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | Correlates with request/trace (e.g. incoming HTTP id, or generated UUID at orchestrator entry). |
| `sourceSurface` | enum-like string | One of: `public_booking`, `dispatch`, `slots`, `admin_debug`, `estimator` (if shadow runs on estimate-time `matchFOs`). |
| `evaluatedAt` | string (ISO-8601) | Server clock when comparison finished. |
| `jobContextHash` | string (or omit with `jobContextSummary`) | Stable hash over **canonical serialized** `JobContext` (sorted keys, fixed types) **after** redaction (§2.3). **Alternatively** `jobContextSummary` object: `{ serviceType, serviceSegment, bookingMatchMode, sqftBand, laborMinutesBand, latBucket, lngBucket }` bucketing to reduce collision risk without storing precise coords. **At least one** of `jobContextHash` or `jobContextSummary` required. |
| `legacyCandidateIds` | string[] | FO ids legacy path treated as eligible / returned for that operation (definition per surface; see §1). |
| `matrixCandidateIds` | string[] | FO ids matrix marks `eligible === true` for same inputs. |
| `addedByMatrix` | string[] | `matrix − legacy` (set difference). |
| `removedByMatrix` | string[] | `legacy − matrix` (set difference). |
| `decisionDiffs` | object[] | Per `foId` where legacy binary eligible ≠ matrix `eligible`: `{ foId, legacyEligible, matrixEligible, matrixPrimaryCode? }`. |
| `reasonCodeDiffs` | object[] | Where both agree on boolean eligible but explainability differs (e.g. dispatch string reason vs matrix code): `{ foId, legacyReasons: string[], matrixCodes: string[] }`. |
| `durationInputSummary` | object | `{ laborMinutes, recommendedTeamSize, durationMinutesForSlots?, source: "estimate_snapshot" \| "booking_derived" \| "missing" }` — **no** raw snapshot JSON. |
| `capacityInputSummary` | object | `{ maxDailyLaborMinutes: number \| null, committedLaborMinutesToday: number \| null, committedInputStatus: "present" \| "absent" \| "not_applicable" }` per evaluated FO or rolled up: **must** flag `absent` when matrix cap check skipped vs legacy. |
| `geographyInputSummary` | object | `{ siteLatPresent: boolean, siteLngPresent: boolean, foHomeLatLngPresent: boolean, maxTravelMinutes: number \| null }`. |
| `safeRedactions` | string[] | List of keys or patterns redacted from nested detail (e.g. `street`, `email`, `phone`, `fullEstimateOutput`). |

### 2.2 Privacy and safety rules

- **No PII** in structured logs: no customer names, emails, phones, free-form addresses, unit numbers, or payment identifiers.
- **No raw addresses**; if needed, use **geohash / coarse bucket** (e.g. 3-decimal lat/lng) or omit.
- **No payment** fields (Stripe ids, card metadata, deposit amounts beyond coarse enums if ever needed).
- **No full estimate payload dumps**; only bands, versions, and field *presence* flags.

---

## 3. Feature flag / environment design (documentation only)

Suggested variables for the **S2 implementation** drop:

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_SERVICE_MATRIX_SHADOW` | `false` | Master switch: when `false`, no shadow eval or diff logs. |
| `SERVICE_MATRIX_SHADOW_SAMPLE_RATE` | `0` | `0–1` or `0–1000` ppm — interpret in code consistently; `0` means “off unless overridden in staging.” |
| `SERVICE_MATRIX_SHADOW_SURFACES` | `public_booking,dispatch,slots` | Comma-separated allowlist of `sourceSurface` values evaluated when shadow enabled. |

**Policy:**

- **Production default:** shadow **off** (`ENABLE_SERVICE_MATRIX_SHADOW=false`, sample rate `0`).
- **Staging:** enable full sample (or 100%) on all surfaces for soak.
- **Production sampling:** only after staging soak and explicit ops sign-off; start with very low `SERVICE_MATRIX_SHADOW_SAMPLE_RATE`.
- **Enforcement:** no `SERVICE_MATRIX_GATE_MATCH` or equivalent in S2; matrix must not filter production traffic.
- **Hard stop:** if automated analysis shows **unexpected** `removedByMatrix` (see §4) or diff rate above threshold, **disable** shadow via flag and treat as incident (do not gate customers).

**Note:** Older docs may reference `SERVICE_MATRIX_SHADOW`; align naming in the **payload builder** drop so operators see one canonical master flag (`ENABLE_SERVICE_MATRIX_SHADOW`).

---

## 4. Diff threshold policy (S2 exit criteria)

Measurable criteria before declaring S2 “stable” and planning S3 (dispatch alignment) **implementation**:

1. **No silent loss of legacy-eligible FOs**  
   - **Metric:** `removedByMatrix` count on `public_booking` and `slots` surfaces.  
   - **Threshold:** `0` unexpected removals over rolling window **N** evaluations **after** excluding known intentional divergences (documented exclusions only). Any removal must map to a **matrix `primaryFailureCode`** and matching **legacy skip cause** once alignment tickets are filed.

2. **Reason-code coverage**  
   - **Metric:** share of `decisionDiffs` where `matrixPrimaryCode` is non-null when `matrixEligible === false`.  
   - **Threshold:** ≥ **99%** (tunable) of matrix ineligibilities carry a non-null primary code (no `undefined` / internal error).

3. **Diff rate by surface**  
   - **Metric:** `|symmetric diff|` / `|legacy ∪ matrix|` per `sourceSurface` per day.  
   - **Threshold:** e.g. **< 0.1%** on `public_booking` after warm-up; **dispatch** tracked separately with a higher interim threshold until daily-cap inputs aligned (documented in §1.2).

4. **Committed labor input completeness**  
   - **Metric:** `capacityInputSummary.committedInputStatus === "absent"` rate during shadow on surfaces where legacy applies daily cap.  
   - **Threshold:** **0%** on `public_booking` before any prod sampling; dispatch until wired.

5. **Geography input completeness**  
   - **Metric:** `geographyInputSummary` falsy rates (`siteLatPresent=false`).  
   - **Threshold:** **0%** for evaluations where shadow is enabled (skip shadow early if inputs missing and log `shadow_skipped_missing_geo` one-off counter).

6. **Duration / labor consistency**  
   - **Metric:** compare `durationInputSummary.laborMinutes` to `parseEstimateJobMatchFields` output on same snapshot where admin replay exists.  
   - **Threshold:** **0** mismatches in replay suite (golden fixtures).

**Process:** CI holds existing tests; shadow adds **fixture tests** for payload construction (future drop). On-call runbook: flip `ENABLE_SERVICE_MATRIX_SHADOW=false` first response if alerts fire.

---

## 5. S3 readiness gate

Before starting **S3** (`DispatchCandidateService` / shared `JobContext` with matrix reason codes per implementation plan), the following must be **proven**:

| Gate | Evidence |
|------|----------|
| All targeted surfaces can build `JobContext` | Staging shadow logs show non-null `jobContextHash` or `jobContextSummary` for each enabled surface. |
| Candidate labor input available | `capacityInputSummary` absent-rate zero where required (§4.4). |
| Geography inputs available | §4.5 holds. |
| Legacy/matrix diffs logged safely | Sample audits: no PII, redaction list populated, security review sign-off. |
| No production behavior changed | Before/after metrics: match rate, conversion, dispatch acceptance — **flat** within noise; no code path uses matrix for gating. |
| Test coverage for shadow payload | Unit tests build payload from fixtures; snapshot or contract tests on field presence. |
| Admin/ops can inspect sampled diffs | Dashboard or log explorer query documented; on-call trained. |

---

## 6. Related documents

- `SERVICE_MATRIX_IMPLEMENTATION_PLAN_V1.md` — S2 shadow sequencing.  
- `SERVICE_MATRIX_ARCHITECTURE_V1.md` — façade role and non-goals.  
- `SERVICE_MATRIX_OBSERVABILITY_V1.md` — reason codes and explain ordering.

---

## 7. Implementation alignment (not performed in this drop)

- No `AppModule` import.  
- No changes to `FoService`, orchestrator, dispatch, slot math, estimator, payments, or recurring modules in this **design** PR.  
- **Travel-time helper** remains duplicated in S1 façade until a dedicated refactor; shadow design does not require extraction in S2 first patch.
