# Structured metadata — production backfill & parity instrumentation plan (V1)

**Status:** Analysis / design only — **no runtime**, schema changes, migrations, production writes, or read-path changes implied here.

**Base context:**

- Storage & dual-write: `docs/engineering/STRUCTURED_BOOKING_METADATA_ARCHITECTURE_V1.md`
- Shadow read-path parity (logs): `docs/engineering/STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md` §9
- Payload contract & parsers: `services/api/src/modules/bookings/booking-operational-metadata.ts`
- Dual-write creation: `IntakeBookingBridgeService.submitIntakeAndCreateBooking` → `BookingsService.createBooking` (persists sidecar when `hasCustomerTeamPrep(parsed)`)

---

## 1. Inventory — data sources & classifications

### 1.1 `Booking.notes` historical formats (observed / inferred)

| Pattern | Description |
|---------|-------------|
| **Intake bridge line** | Pipe-delimited single-line segment containing tokens such as `Booking direction intake <intakeId>`, `serviceId=`, `frequency=`, `preferredTime=`, optional `customerName=`, optional **`customerPrep=`**. Produced by `intake-booking-bridge.service.ts` (`noteParts.join(" \| ")`). Pipe characters inside prep are sanitized to ` — ` before persistence (matching structured dual-write). |
| **Multi-line notes** | Newline-separated lines after the bridge line often carry **free-form ops/customer text** (e.g. call logs). Web helpers strip intake-bridge lines from customer/ops timelines but raw `Booking.notes` remains a concatenated blob. |
| **`customerPrep=` transport** | One or more `customerPrep=` **segments** per line, separated by ` \| `. Parser (**API**: `extractCustomerPrepFromBookingNotes`; **web**: same algorithm in `bookingDisplay.ts`) collects every segment across lines and joins multiple hits with `\n`. |
| **Legacy / manual / imports** | Notes may omit bridge semantics entirely; `customerPrep=` could theoretically appear without a bridge line (manual edits, tooling). |

Any future **canonical detector** for “this booking participated in intake bridge semantics” should treat **`Booking direction intake`** prefix + structured tokens as **strong signal**, not the only path.

### 1.2 Parity primitives (reuse — do not fork logic)

| Capability | Location |
|------------|----------|
| Notes-side prep extraction | `extractCustomerPrepFromBookingNotes` |
| Structured validation | `parseBookingOperationalMetadataPayloadV1`, `hasCustomerTeamPrep` |
| Build persisted payload (dual-write shape) | `buildBookingOperationalMetadataPayloadV1` |
| Shadow parity classification | `compareBookingOperationalMetadataShadow` |

Backfill and instrumentation MUST reuse **`extractCustomerPrepFromBookingNotes`** (same semantics as web display helpers).

### 1.3 `BookingOperationalMetadata` storage (current)

- Prisma model `BookingOperationalMetadata`: **`bookingId` `@unique`**, `schemaVersion`, `payload` **JSON**, timestamps (`services/api/prisma/schema.prisma`).
- Create path is **idempotent by uniqueness**: second insert per `bookingId` must fail unless guarded.

### 1.4 Dual-write creation path (today)

- When intake submits prep (`dto.recurringInterest?.note`), bridge builds **`Booking.notes`** with **`customerPrep=`** AND **`buildBookingOperationalMetadataPayloadV1`** runs with **`booking_direction_intake`** provenance; **`BookingsService.createBooking`** validates payload and **`bookingOperationalMetadata.create`** inside transaction **only if** parsed payload has customer prep (`hasCustomerTeamPrep`).
- **`Booking.notes` is not removed or rewired**; **`customerPrep=`** remains authoritative for legacy reads.

### 1.5 Shadow / admin instrumentation (today)

- **Env:** `ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW` → **`isStructuredBookingMetadataShadowEnabled()`**
- **Path:** `AdminBookingsService.getBookingOperationalDetail` — loads `{ payload, schemaVersion }` in separate query when enabled; logs **`structured_booking_metadata_shadow`** or **`structured_booking_metadata_shadow_failure`** without raw notes/prep/provenance on success path.

### 1.6 Existing script / ops patterns (for consistency)

- **`services/api/scripts/reconcile-historical-deposit-mismatches.ts`** — explicit **dry-run vs `--execute`**, confirmation phrase, structured summary (`wouldUpdate`, `skipped`, booking IDs in audit buckets — acceptable patterns for internal tooling).
- **`services/api/src/scripts/backfill-system-test-intelligence.ts`** — batched loop via env-configurable batch size; summaries printed — simpler precedent.

Future operational-metadata backfill script SHOULD mirror **explicit `--write` / default dry-run**, **cursor**, and **safe aggregate stdout**.

### 1.7 Source row taxonomy (classification for eligibility)

Definitions assume **`notes`** = `Booking.notes`, **`prep_notes`** = `extractCustomerPrepFromBookingNotes(notes)`, **`has_row`** = `BookingOperationalMetadata` exists for `bookingId`.

| Class | Condition (conceptual) | Backfill stance |
|-------|----------------------|-----------------|
| **A — Structured metadata present** | `has_row` | **Skip** (never overwrite in V1 write-mode without explicit future flag). |
| **B — Prep in notes, eligible legacy** | `!has_row` ∧ `prep_notes` non-null ∧ eligibility gates OK | **Candidate would-insert**. |
| **C — No prep** | `prep_notes` null ∧ structured blob absent | **Skip** — category **`no_prep`** / **`no_data`** for parity stats. |
| **D — Ambiguous notes** | Multiple distinct **`customerPrep=`** segments whose normalization yields conflicting interpretations OR explicit policy flags duplicate segments | **Skip dry-run counter `ambiguous`**; optional manual queue (booking IDs only). |
| **E — Bridge artifact only** | Notes contain **`Booking direction intake`** bridge semantics ∧ **`prep_notes` null** ∧ remaining visible lines empty / whitespace-only | **Skip** — not backfill-eligible; useful **`bridge_only_no_prep`** metric. |
| **F — Free-form notes without bridge token** | `prep_notes` null ∧ substantive non-bridge lines exist | **Skip** for prep backfill — not **`customerPrep=`** sourced; **`free_form_notes_only`**. |
| **G — Invalid extraction edge cases** | Parser yields oversize / clamp-empty after trim | **`invalid_notes_prep`** bucket — skip insert. |

**Ambiguity hint:** Today’s extractor **concatenates** multiple `customerPrep=` segments with `\n`. A conservative rule counts **`chunks.length > 1`** as **`ambiguous`** for **write-mode**, while dry-run may record **`would_create_multi_segment`** as informational unless product decides concatenated inserts are acceptable.

---

## 2. Dry-run backfill script — design (future BUILD DROP)

**Goal:** Enumerate bookings that **would** receive `BookingOperationalMetadata` rows **without mutating** `Booking.notes`, Stripe, estimates, or any unrelated tables.

### 2.1 Entrypoints / ergonomics

- CLI living alongside existing ops scripts (e.g. `services/api/scripts/operational-metadata-backfill-dry-run.ts`) invoked via **`tsx`/`node`** + `dotenv` (matches sibling scripts).
- **Default mode:** **`dry-run`** only — exit non-zero optional only if fatal infra errors (connection), not business skips.

### 2.2 Batch scanning & cursor

- **`WHERE`** clause scans **`Booking`** (tenant filters optional flags **`--tenantId=`**).
- **Ordering:** **`ORDER BY createdAt ASC, id ASC`** for deterministic replay.
- **Cursor resume:** persisted **`--cursor=`** `(createdAtIso,id)` **OR** env **`LAST_CURSOR`** — script prints **`next_cursor`** line each checkpoint.

### 2.3 Join strategy per booking (logical steps)

1. Load **`booking.id`, `booking.notes`, `booking.createdAt`** (minimal projection — **no customer/email joins** for privacy-by-default).
2. **`LEFT JOIN`** or secondary query: **`BookingOperationalMetadata`** keyed by **`bookingId`** (existence only).
3. If row exists → increment **`skip_already_has_metadata`** (optionally sub-tag **`structured_dual_written`** vs **`unknown_origin`** if combining telemetry later).

### 2.4 Extraction & validation pipeline

1. **`prep = extractCustomerPrepFromBookingNotes(notes)`**.
2. If **`prep === null`** → **`skip_no_prep`** (+ subclass **`bridge_only`** if bridge heuristic matches — heuristic MUST mirror intake prefix **`Booking direction intake`** tokens — configurable regex documented in script header).
3. **Ambiguity policy:** if multiple **`customerPrep=`** chunks detected (**implementation detail:** mirror extractor internals or count segments inline — MUST stay aligned), classify **`ambiguous`** and skip would-insert.
4. Build candidate **`BookingOperationalMetadataPayloadV1`**:
   - **Minimal compliant payload:** **`{ customerTeamPrep: { freeText: normalizedPrep } }`** — **`parseBookingOperationalMetadataPayloadV1`** accepts provenance absence (**today’s validator**).
   - Optionally **`hasCustomerTeamPrep`** assertion matches **`would_insert`** eligibility.

### 2.5 Provenance strategy (design decision)

- Current **`BookingOperationalMetadataProvenance.source`** union **only** includes **`booking_direction_intake`**; injecting **`backfill_…`** would require a **future BUILD DROP** (parser/types extension — **out of scope** for this plan doc).
- **Recommendation:** V1 **backfill inserts omit provenance** OR omit dedicated BUILD DROP until provenance enum extended — parity instrumentation treats **`structured_only`** vs **`notes_only`** as observability categories regardless.

### 2.6 Outputs — aggregates only (no raw customer text)

Emit periodic summaries (`stderr` or structured JSON lines) containing ONLY:

- **counts:** **`would_create`**, **`would_skip_has_row`**, **`would_skip_no_prep`**, **`would_skip_ambiguous`**, **`would_skip_invalid_payload`**, **`errors`**
- **rates:** rolling percentages optional
- **samples:** **`bookingId` list capped** (e.g. max **50** per category per batch) — **no notes substring**, no hashes of raw prep unless approved security review

Optional **`--emit-id-list=file`** gated behind **`--internal`** env + confirmation for ops forensics.

### 2.7 Safety & environment

- Read-only DB role preferred for dry-run in locked-down environments.
- **Rate limiting:** configurable **`--batch-size`**, **`sleep-ms`** between batches.
- **Kill switch:** **`SIGINT`** flushes summary.

---

## 3. Write-mode backfill — design (future BUILD DROP after dry-run sign-off)

### 3.1 Invocation gate

- **`--write`** explicitly required (boolean flag).
- **`--confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA_V1`** (phrase TBD at implementation — mirror deposit reconciliation pattern).
- Optional **`--executedBy=`** for audit trail entry.

### 3.2 Idempotency & mutation constraints

- **`INSERT`** only — **`bookingId` unique** prevents duplicates.
- **`ON CONFLICT DO NOTHING`** OR catch **`P2002`** — classify **`skipped_exists`**.
- **Never** **`UPDATE Booking.notes`** — **never** **`DELETE`** metadata rows in V1 script.

### 3.3 Overwrite policy

- **No overwrite** when row exists unless a **separate future `--allow-overwrite`** flag exists AND payload hash comparison passes — **explicitly excluded** from first write-mode drop.

### 3.4 Transaction boundaries

- **Preferred:** **one transaction per booking insert** (small blast radius) OR micro-batch **`BEGIN … COMMIT`** per **N ≤ 25** inserts if throughput needed — trade latency vs lock duration.
- Failed booking logged → **`errors[]`** with **`bookingId`** + machine-safe **`code`** only.

### 3.5 Logging & evidence

- Structured summary matching dry-run counters plus **`inserted`**, **`skipped_conflict`**.
- Attach **`scriptVersion`** constant string (semver internal).

---

## 4. Parity instrumentation plan

### 4.1 Signals already defined

`compareBookingOperationalMetadataShadow` emits statuses aligned with measurement:

| Status | Meaning for instrumentation |
|--------|---------------------------|
| **`match`** | Normalized structured prep equals normalized notes-derived prep. |
| **`notes_only`** | Metadata absent / empty prep; notes carry prep — legacy or missed dual-write. |
| **`structured_only`** | Metadata prep present; notes extraction empty — investigate drift / manual edits. |
| **`mismatch`** | Both sides non-empty but differ post-normalization. |
| **`invalid_structured`** | Stored JSON fails **`parseBookingOperationalMetadataPayloadV1`**. |
| **`no_data`** | Neither side carries prep. |

### 4.2 Where metrics should land first

| Tier | Recommendation |
|------|----------------|
| **Phase A — logs-first** | Aggregate **`structured_booking_metadata_shadow`** JSON logs from **`getBookingOperationalDetail`** behind **`ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW`** — lowest lift; sufficient for early mismatch rates **if** admin hits approximate representative slice OR sampling widened per §4.5. |
| **Phase B — metrics backend** | Push counters (`Datadog`, Prometheus sidecar, etc.) keyed **`booking_operational_metadata_shadow.{status}`** — avoids log-scan costs; **no dimensions containing notes**. |
| **Phase C — admin ops summary** | Optional dashboard tile (**counts only**, optional **`bookingId` drill-down behind elevated role**) — useful once stable; **not required** for first gate if logs/metrics suffice. |

### 4.3 Logs vs metrics

- **Logs:** adequate for **shadow soak** on limited paths if aggregation tooling exists.
- **Metrics:** recommended before **write-mode backfill at scale** to baseline **`notes_only`** decay post-insert.

### 4.4 Alert thresholds (starting hypotheses — tune with real volumes)

| Signal | Starting heuristic |
|--------|-------------------|
| **`mismatch` rate** | Alert if **> 0.5–1.0%** rolling **7d** among bookings with **both** sides present (`hasStructured` ∧ `hasNotes`). |
| **`invalid_structured` spike** | Absolute rate threshold OR **3× baseline** week-over-week. |
| **`structured_only`** sustained | Investigation queue — not necessarily paging alert unless correlated with ticket spike. |
| **Dry-run `ambiguous`** | Report-only until classification refined — alert if **> 5%** of eligible cohort in tenant slice. |

### 4.5 Sampling strategy

- Shadow logging follows **admin operational-detail traffic** — biased toward human-reviewed bookings.
- Add optional **`BOOKING_OPERATIONAL_METADATA_SHADOW_SAMPLE_RATE`** (future BUILD DROP) for **`BookingsService.createBooking`** **success-path-only** compare (`microseconds`) — **still env-default-off**.
- Avoid sampling customer-facing cold reads until privacy review.

### 4.6 PII leakage avoidance

- Never log raw **`Booking.notes`** / **`customerPrep`** / **`payload`** JSON on hot paths.
- Prefer **`bookingId`**, **`status`**, **`safeReason`**, **`schemaVersion`** only — hashes optional behind restricted tooling (document hash algorithm **SHA-256** over normalized prep **only** if incident dedupe demanded).

---

## 5. Exit gates — before any read-path flip

All gates **compound** — single flip flag discouraged.

| Gate | Acceptance sketch |
|------|-------------------|
| **Dual-write coverage** | Near-complete **`structured`** presence on **new** bookings that emit **`customerPrep=`** (track creation-side counters — optional BUILD DROP). |
| **Dry-run clean rate** | **`ambiguous + invalid`** below tenant-agreed threshold on historical slice **before** `--write`. |
| **Write-mode completion** | Backfill job completes OR bounded backlog explicitly exempt with rationale — **`notes_only`** rate trending toward baseline noise. |
| **Shadow mismatch threshold** | Rolling **`mismatch`** rate among populated pairs **below agreed threshold** (see §4.4). |
| **Soak** | Minimum **N** releases / calendar window with shadow enabled without regression incidents. |
| **Rollback plan** | Read-path flip remains **feature-flagged** per surface; immediate revert = **notes-only projection** (`Booking.notes` parsers unchanged). |
| **Fallback preserved** | **`Booking.notes`** + **`customerPrep=`** remains writable transport until explicit retirement program — **do not remove** per product gates in architecture doc. |

---

## 6. Main risks

| Risk | Mitigation |
|------|------------|
| **Extractor drift** web vs API | Shared package / contract tests already partially mirrored — backfill MUST import API **`extractCustomerPrepFromBookingNotes`** only. |
| **Ambiguous multi-segment `customerPrep=`** | Conservative skip + manual review queue. |
| **Backfill without provenance** | Audit weaker until provenance enum extended — document decision; optional follow-up BUILD DROP extends **`source`** union + parser. |
| **Shadow biased sampling** | Mitigate with creation-path sampling flag later. |
| **Operational load** | Batch sizing + read replicas for dry-run; write-mode off-peak windows. |
| **Failure logs exposing internals** | Shadow failure path includes **`errorMessage`** — restrict log routing / scrub patterns if DB errors leak constraints. |

---

## 7. Recommended next build drop

**BUILD DROP — STRUCTURED METADATA BACKFILL DRY-RUN SCRIPT V1**

Deliverables:

- Read-only CLI **default dry-run** implementing §2 (cursor, aggregates, **no writes**, **no raw prep logging**).
- Contract tests: extractor parity fixtures shared / reused from **`booking-operational-metadata.spec.ts`** where feasible.

---

## 8. References

- `services/api/src/modules/bookings/booking-operational-metadata.ts`
- `services/api/src/modules/bookings/booking-operational-metadata-shadow.ts`
- `services/api/src/modules/admin/bookings/admin-bookings.service.ts` (`getBookingOperationalDetail`)
- `services/api/src/modules/bookings/bookings.service.ts` (`createBooking` dual-write block)
- `services/api/src/modules/booking-direction-intake/intake-booking-bridge.service.ts`
- `apps/web/src/lib/bookings/bookingDisplay.ts`
- `docs/engineering/STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md`
