# Structured metadata read-path shadow / parity plan — V1

**Status:** Analysis / design only — no runtime, schema, API contract, or UI changes implied here.  
**Context:** `BookingOperationalMetadata` dual-writes from intake when team prep exists (`main` ≥ `2256324`). Customer/admin/FO surfaces still **read only** `Booking.notes` via `apps/web/src/lib/bookings/bookingDisplay.ts`. Server helper `getCustomerTeamPrepFromBookingOperationalMetadataOrNotes` exists but is **not** wired to HTTP responses.

---

## 1. Read-path inventory (repo-grounded)

### 1.1 Web helpers (`bookingDisplay.ts`)

| Symbol | Role |
|--------|------|
| `extractCustomerTeamPrepFromBookingNotes` | Parses `customerPrep=` from pipe-delimited bridge lines + newline splits. |
| `extractTeamPrepFromBookingNotes` | Alias → same parser. |
| `displayCustomerSafeBookingNotesLines` | Timeline lines for **customers** — hides intake-bridge rows; does not expand prep into timeline. |
| `displayOpsBookingNotesLines` | Same filtering as customer-safe — **admin/FO** human timelines. |
| `displayBookingNotesLines` | **Raw** newline-split lines including bridge (**legacy/debug**); **no production UI usage** in current `apps/web` sources (only unit test + stale infra inventories). |

### 1.2 Web consumers (classification)

| Location | Helpers used | Classification |
|----------|--------------|----------------|
| `CustomerBookingDetailPageClient.tsx` | `displayCustomerSafeBookingNotesLines`, `extractCustomerTeamPrepFromBookingNotes` | **Customer-facing** |
| `CustomerBookingDetail.tsx` | `extractCustomerTeamPrepFromBookingNotes` | **Customer-facing** |
| `admin/bookings/[id]/page.tsx` | `extractTeamPrepFromBookingNotes`, `displayOpsBookingNotesLines` | **Admin-facing** |
| `fo/bookings/[id]/page.tsx` | `extractTeamPrepFromBookingNotes`, `displayOpsBookingNotesLines` | **FO-facing** |
| `bookingDisplay.customerNotes.test.ts` | All of the above + `displayBookingNotesLines` | **Tests only** |

### 1.3 Server helper

| Symbol | Where | Classification |
|--------|-------|----------------|
| `getCustomerTeamPrepFromBookingOperationalMetadataOrNotes` | `booking-operational-metadata.ts` + unit tests | **Internal (unused in controllers)** — tests only today |

### 1.4 Other `Booking.notes` consumers (not yet using structured metadata)

These matter for **future projection** and **backfill impact**, but **do not** currently call the web display helpers:

| Area | Usage | Classification |
|------|-------|----------------|
| `booking-screen.service.ts` | Passes `booking.notes` into booking screen payloads | **Internal / multi-role** (depends on caller) |
| `booking-intelligence.service.ts`, authority recompute/export/mismatch | Uses notes text for tagging / learning | **Internal** |
| `admin-bookings.service.ts` | Surfaces `booking.notes` in admin list/detail plumbing | **Admin-facing** |
| `bookings.service.ts` PATCH | Can mutate `notes` | **Write path** (out of scope for read shadow) |
| Intake bridge | Writes bridge + `customerPrep=` | **Write path** (already dual-writing metadata) |

---

## 2. Shadow read strategy

### 2.1 Goal

Compare **structured** team prep vs **notes-parser** team prep **without changing** any JSON/HTML the client receives.

### 2.2 Recommended placement

Run shadow logic **only on the server**, immediately after loading `Booking` (+ optional `operationalMetadata` via `include`), **before** mapping to DTOs:

- **First surface (lowest customer blast radius):** an **admin-authenticated** or **internal-only** code path that already loads a single booking by id (e.g. admin booking detail API stack or booking screen assembly used from admin).
- **Second surface:** `GET /api/v1/bookings/:id` for **authenticated customer** (same comparison, still **no response change**).
- **Avoid:** running shadow reads inside browser bundles; avoid logging from CDN edge.

Gate with explicit config, e.g. `BOOKING_OPERATIONAL_METADATA_SHADOW_READ_V1` (or feature flag row), default **off** in production until ready.

### 2.3 Parity definition (phase 1 — team prep only)

Focus shadow **only** on **customer team prep free-text**, not full timeline line arrays.

Let:

- `S` = `getCustomerTeamPrepFromBookingOperationalMetadataOrNotes({ operationalMetadataPayload: row.payload, bookingNotes: row.notes })?.freeText` after parsing payload from DB.
- `N` = same helper’s conceptual **notes-only** branch — equivalently `extractCustomerPrepFromBookingNotes(row.notes)` (must stay algorithm-aligned with web).

**Normalize** before compare:

- Trim ASCII/Unicode whitespace.
- Optional: Unicode NFC normalization (document decision).

**Parity:** `normalize(S) === normalize(N)` when **both** sides non-empty.

**Expected non-parity (informational, not alert-fatigue):**

| Case | Interpretation |
|------|----------------|
| `S` empty, `N` non-empty | Legacy booking **without** metadata row — OK until backfill. |
| `S` non-empty, `N` empty | Should be **rare** post–dual-write; possible manual DB edits or corrupted notes — investigate. |
| Both non-empty and differ | **Drift** — highest signal; triage (dual-write bug, manual note edit, parser divergence). |

Timeline line parity (`displayOpsBookingNotesLines` vs structured) is **deferred** — structured storage does not yet model free-form non-bridge lines separately.

### 2.4 Metrics / logs

**Emit (aggregated):**

- Counters by outcome: `shadow_prep_both_match`, `shadow_prep_structured_only`, `shadow_prep_notes_only`, `shadow_prep_mismatch`.
- Optional histogram of edit distance bucket on mismatch (bucketed, not raw strings).

**Never emit to general logs/metrics:**

- Full `Booking.notes` body.
- Raw `BookingOperationalMetadata.payload` JSON (contains **provenance**).
- Customer email, phone, address, payment identifiers.

**Safe breadcrumb:** `bookingId`, mismatch **category**, optional **hash** of both sides (e.g. SHA-256 of normalized strings) for deduping incidents without exposing text.

---

## 3. DTO / serializer strategy (future read flip)

### 3.1 Layers

1. **Persistence layer:** `Booking` + optional `operationalMetadata` (`payload` JSON, `schemaVersion`).
2. **Domain projection:** internal struct `{ customerTeamPrepFreeText, operationalTimelineLines, debugNotes?, provenanceInternal? }`.
3. **Role DTOs:** strip fields per audience.

### 3.2 Projections

| Projection | Team prep | Timeline / ops notes | Provenance | Raw bridge / `customerPrep=` token |
|------------|-----------|----------------------|------------|-------------------------------------|
| **Customer-safe** | Structured first → notes fallback; display under existing team-prep copy | Customer-safe filtered lines only | **Never** | **Never** |
| **Admin/ops** | Same resolution; optional admin-only label “source: structured \|\| notes” | Ops-filtered lines; optional link to raw notes in **restricted** tool | **Allowed** in admin JSON **only** if needed for audit (prefer separate internal endpoint) | Hide by default; raw blob **debug endpoint** only |
| **FO/crew** | Same as admin for prep (product decision); align copy with ops | Ops-filtered lines | **Optional** minimal (no raw bridge) | **Never** on default FO UI |
| **Internal/debug** | Full payload | `displayBookingNotesLines`-equivalent | Full payload | Allowed in secured contexts |

Rules:

- **Structured first, notes fallback** until exit criteria met.
- **Provenance** never ships on customer DTOs.
- **Raw notes** only on explicit debug/internal surfaces.

---

## 4. Backfill plan (production-safe, future execution)

This section **designs** the job; it does **not** authorize running it.

1. **Dry-run mode:** scan bookings with `Booking.notes` matching intake-bridge detector **and** missing `operationalMetadata` row; output counts + sample `bookingId` hashes only.
2. **Parse:** reuse the same `customerPrep=` extraction rules as `extractCustomerPrepFromBookingNotes` (keep single shared implementation on API or shared package to avoid drift).
3. **Write:** `INSERT` metadata row with `schemaVersion: 1`, payload `{ customerTeamPrep: { freeText }, provenance?: { source: "backfill_booking_notes_v1", capturedAt, legacyNotesTransport: "booking.notes" } }` — provenance schema may need a **small** allowed enum extension in parser (future build).
4. **Skip ambiguous:** multiple conflicting `customerPrep` segments, unreadable blobs, or validation failures → skip + report **skip reason code**.
5. **Idempotent:** `bookingId` unique — upsert policy **skip if row exists** unless verified identical payload hash.
6. **Non-destructive:** never delete or rewrite `Booking.notes` in backfill phase.
7. **Resumable:** checkpoint by last processed `(createdAt, id)` cursor.

---

## 5. Exit criteria (when notes fallback can shrink)

All are **gates**, not a single flag:

| Gate | Suggestion |
|------|------------|
| **Dual-write coverage** | ≥ **99%+** of new bookings with prep have metadata rows (metrics from create path). |
| **Backfill coverage** | Agreed % of **eligible** legacy bookings processed OR explicitly excluded with reason. |
| **Parity** | Mismatch rate below threshold (e.g. **&lt; 0.1%** of shadow comparisons over rolling 7d) **after** normalization. |
| **Soak** | Minimum **N** release trains (e.g. 2) with shadow enabled in production without incident. |
| **Monitoring** | Dashboards for mismatch categories + alerts on spike in `shadow_prep_mismatch`. |
| **Read flip** | Feature-flagged customer/admin/FO read from structured first **per surface**, with instant rollback to notes-only mapping. |

Retiring **`customerPrep=`** string transport is **out of band** — only after emissions stopped **and** parsers unused in prod metrics.

---

## 6. Recommended first shadow surface

**Admin-scoped server path** that loads `Booking` + `operationalMetadata` by id (e.g. internal serializer used by admin booking detail), behind **off-by-default** env/flag, measuring **team prep free-text parity only**.

Rationale: smallest exposure to customers, aligns with ops stakeholders who benefit from metadata readiness signals.

---

## 7. Recommended next build drop

**BUILD DROP — STRUCTURED METADATA READ-PATH SHADOW V1**

Scope:

- Add server-side **optional** `include: { operationalMetadata: true }` on selected booking fetch used **only** by shadow path (no response shape change).
- Implement comparison + metric emission per §2.
- No web bundle changes; no customer-visible output change; no fallback removal.

---

## 8. References

- Storage & dual-write: `docs/engineering/STRUCTURED_BOOKING_METADATA_ARCHITECTURE_V1.md`
- Helpers: `apps/web/src/lib/bookings/bookingDisplay.ts`
- Server merge helper: `services/api/src/modules/bookings/booking-operational-metadata.ts`

---

## 9. Implementation note — shadow V1 (server-only, landed)

This section records what shipped for the first shadow slice; it does **not** change the analysis sections above.

| Item | Detail |
|------|--------|
| **Path** | `AdminBookingsService.getBookingOperationalDetail` — admin/internal single-booking load. |
| **Read-path flip** | None — response remains `{ ...booking, authority }`; operational metadata is **not** attached to the returned object. |
| **Fetch** | When shadow is enabled, a **separate** `bookingOperationalMetadata.findUnique` loads `{ payload, schemaVersion }` only for comparison. |
| **Env gate** | `ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW` — default **off**; only `"true"` or `"1"` (trimmed, case-insensitive) enables shadow; malformed values treated as off. |
| **Compare helper** | `services/api/src/modules/bookings/booking-operational-metadata-shadow.ts` — `compareBookingOperationalMetadataShadow` (pure; statuses: match, structured_only, notes_only, mismatch, no_data, invalid_structured). |
| **Logs** | Success: JSON line with `event: "structured_booking_metadata_shadow"`, `bookingId`, `status`, `safeReason`, `hasStructured`, `hasNotes`, `schemaVersion`. Failure (wrapped in try/catch): `event: "structured_booking_metadata_shadow_failure"`, `bookingId`, `errorName`, `errorMessage`. **Raw** `Booking.notes`, customer prep text, provenance, and PII are **not** logged by design. |
| **Tests** | `booking-operational-metadata-shadow.spec.ts`, `admin-bookings.service.shadow.spec.ts`. |

**Recommended next drop:** validation-focused PR (“VALIDATION DROP — STRUCTURED METADATA READ-PATH SHADOW”) — production soak metrics, dashboards, and optional normalized-string hashing per §2.4 without logging raw text.
