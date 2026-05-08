# Service matrix V1 — observability & admin transparency

**Goal:** eliminate **black-box** FO matching for operators. Every exclusion or rank adjustment should be **explainable** with stable **machine codes** and **human-readable** summaries.

---

## 1. Problems today

| Path | Behavior |
|------|----------|
| `FoService.matchFOs` | Mostly **`continue`** without surfacing *which* constraint failed |
| `DispatchCandidateService.getCandidates` | **`reasons: string[]`** — closer to desired shape but **not shared** with public path |
| `FoService.getEligibility` | Supply reasons via **`FoEligibility.reasons`** — good pattern; **not job-specific** (no sqft/labor for a given job) |
| Public orchestrator | **`PUBLIC_BOOKING_FO_NOT_ELIGIBLE`** etc. — **coarse** |

---

## 2. Target explain payload (admin / internal)

For **(bookingId | job context) × foId**:

```json
{
  "foId": "…",
  "eligible": false,
  "checks": [
    { "code": "SUPPLY_COORDINATES_OK", "pass": true },
    { "code": "TRAVEL_WITHIN_MAX", "pass": false, "detail": { "travelMinutes": 72, "maxTravelMinutes": 60 } },
    { "code": "SERVICE_TYPE_ALLOWED", "pass": true },
    { "code": "SQFT_WITHIN_MAX", "pass": true },
    { "code": "PER_JOB_LABOR_WITHIN_MAX", "pass": true },
    { "code": "WORKLOAD_MIN_CREW_SATISFIED", "pass": true, "detail": { "workloadMinCrew": 2, "foMaxCrew": 4 } },
    { "code": "DAILY_LABOR_CAP", "pass": true, "detail": { "committedMinutes": 120, "cap": 480, "requestedMinutes": 180 } }
  ],
  "summary": "Excluded: travel exceeds franchise owner maximum."
}
```

**Rules:**

- **`code`** is stable (ENUM in code — not free-form strings).
- **`detail`** is optional JSON-safe primitives only.
- **Ordering:** supply → legal/safety → geography → service allow-list → size/labor → crew → capacity → risk.

---

## 3. Reason code taxonomy (initial draft)

### Supply / activation

| Code | Meaning |
|------|---------|
| `FO_NOT_ACTIVE` | Status not active |
| `FO_SAFETY_HOLD` | Safety hold |
| `FO_DELETED` / `FO_BANNED` | Account state |
| `SUPPLY_*` | Mirror `FoSupplyReadinessReason` |
| `EXECUTION_PROVIDER_MISMATCH` | Provider linkage |

### Geography

| Code | Meaning |
|------|---------|
| `TRAVEL_WITHIN_MAX` | Pass |
| `TRAVEL_EXCEEDS_MAX` | Fail |

### Service compatibility

| Code | Meaning |
|------|---------|
| `SERVICE_TYPE_ALLOWED` | Pass |
| `SERVICE_TYPE_NOT_IN_FO_ALLOWLIST` | Fail |
| `COMMERCIAL_SERVICE_WHITELIST_REQUIRED` | Context-specific |

### Job scale

| Code | Meaning |
|------|---------|
| `SQFT_WITHIN_MAX` | Pass |
| `SQFT_EXCEEDS_FO_MAX` | Fail |
| `PER_JOB_LABOR_WITHIN_MAX` | Pass |
| `PER_JOB_LABOR_EXCEEDS_FO_MAX` | Fail |

### Crew / workload

| Code | Meaning |
|------|---------|
| `WORKLOAD_MIN_CREW_SATISFIED` | Pass |
| `WORKLOAD_MIN_CREW_NOT_MET` | `fo.maxCrew < workloadMin` |

### Capacity

| Code | Meaning |
|------|---------|
| `DAILY_LABOR_UNDER_CAP` | Pass |
| `DAILY_LABOR_CAP_EXCEEDED` | Fail |

### Risk (advisory)

| Code | Meaning |
|------|---------|
| `RISK_FLAGS_PRESENT` | From estimate |
| `MANUAL_REVIEW_SUGGESTED` | Composite advisory |

---

## 4. UI / API surfaces

| Consumer | V1 recommendation |
|----------|-------------------|
| **Admin dispatch** | Extend existing candidate panel to show **expandable check list** per FO |
| **Support tooling** | Internal endpoint: `POST /api/v1/admin/.../service-matrix/evaluate` with FO id + booking id |
| **Customer** | **No** raw matrix in V1; continue generic errors |

---

## 5. Logging

- **Event:** `service_matrix.evaluation`
- **Fields:** `eligible`, `foId`, top-level **first failing code**, `checkCount`
- **Sampling:** 100% in staging; low sample in prod for shadow mode

---

## 6. Privacy & safety

- Do not log full address; lat/lng **rounded** or omitted in prod logs.
- **No** estimator raw JSON in logs — reference `estimateSnapshotId` only.

---

## 7. Relation to locked systems

- **Canonical `scheduledStart` / `scheduledEnd`** may appear in **job context** for overlap-related **future** checks — V1 **read-only** references; **no** mutation or reconciliation from observability layer.
