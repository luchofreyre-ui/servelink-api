# Structured metadata — write-mode backfill safety review (V1)

**Status:** Analysis / design only — **no** write-mode implementation, production execution, schema changes, migrations, read-path flip, or UI/API/runtime behavior changes implied here.

**Base:** Dry-run CLI & classifier on `main` ≥ `b88600b`; parity architecture in `docs/engineering/STRUCTURED_METADATA_BACKFILL_PARITY_PLAN_V1.md`.

---

## 1. Review — current dry-run (reuse for write mode)

### 1.1 Components (repo-grounded)

| Piece | Location | Safe reuse for write mode |
|-------|----------|---------------------------|
| **CLI ergonomics** | `services/api/scripts/backfill-booking-operational-metadata-dry-run.ts`, `.lib.ts` (`parseOperationalMetadataDryRunArgv`, cursors, `--silent` docs) | **Reuse** parser patterns for shared **`limit` / `batch-size` / cursor / sample-limit** semantics; extend with **`--write`** + **`--confirm`** only on a **future** script entrypoint or guarded branch — **same classification path**, separate stdout schema for execute vs dry-run. |
| **Bucket classifier** | `classifyBookingForOperationalMetadataBackfillBucket` / `classifyBookingForOperationalMetadataBackfill` | **Reuse verbatim** — write eligibility must **equal** bucket **`B_would_create_from_notes`** only. **Do not fork** parsing logic. |
| **Notes → prep extraction** | `analyzeCustomerPrepFieldsInBookingNotes`, `extractCustomerPrepFromBookingNotes` (`booking-operational-metadata.ts`) | **Reuse** — single source of truth with web-aligned semantics. |
| **Payload validation** | `buildBookingOperationalMetadataPayloadV1`, `parseBookingOperationalMetadataPayloadV1`, `hasCustomerTeamPrep` | **Reuse** — inserts must persist **only** payloads that pass the same validation stack already used to classify **B** (today synthetic provenance is used in classifier for build validation; persisted row may omit provenance until a separate provenance-enum BUILD DROP — see parity plan). |
| **Safe report shaping** | `buildSafeOperationalMetadataBackfillReport`, bucket enums | **Reuse concepts** (counts, cursor, bookingId-only samples); write-mode JSON adds **`created`**, **`skipped*`**, **`failed`**, **`alreadyExists`** — still **no** raw notes/prep. |
| **Shadow parity (observability)** | `compareBookingOperationalMetadataShadow`, admin path `getBookingOperationalDetail`, env `ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW` | **Reuse post-write** for soak — not part of the write transaction; **no** response shape change. |

### 1.2 Historical reconciliation precedent

| Pattern | Source | Application |
|---------|--------|-------------|
| **`--execute`** + **`--confirm=PHRASE`** gate | `services/api/scripts/reconcile-historical-deposit-mismatches.ts` | Mirror for **`--write`** + **`--confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA`** (exact string TBD at implementation — **must match** code constant). |
| **Dry vs execute report** | Same script (`dry_run` vs `execute` in report type) | Write-mode should emit **`mode: "dry_run" \| "write"`** (or equivalent) in machine-readable summary. |
| **`executedBy`** audit string | Reconciliation script | **Recommended** optional **`--executedBy=`** for operator / automation identity in summary JSON (no PII — service account name only). |

### 1.3 Parser assumptions (carry forward)

- Numeric flags: strict base-10 digit integers (already hardened on dry-run).
- **`npm run --silent`** canonical for pipeable JSON (documented in dry-run help).
- Unknown flags **reject** — write-mode must **not** introduce silent backwards-compat hazards.

---

## 2. Write eligibility — bucket contract

**Single rule:** persist **`BookingOperationalMetadata`** **only** when classification bucket is **`B_would_create_from_notes`**.

| Bucket | Write? | Rationale |
|--------|--------|-----------|
| **A_structured_present** | **No** | Sidecar row already exists — **idempotent universe**. Skip (`already_exists`); never overwrite in V1 (separate future flag if ever justified). |
| **B_would_create_from_notes** | **Yes** | Exactly one valid `customerPrep=` field, payload builds & validates — **only safe automated insert class**. |
| **C_no_prep** | **No** | Nothing to backfill from prep transport; inserting empty metadata would be meaningless / misleading. |
| **D_ambiguous_notes** | **No** | Multiple `customerPrep=` fields and/or malformed bridge heuristic — **manual review** candidate; wrong insert risk. |
| **E_bridge_only_no_prep** | **No** | Intake bridge without prep — **no** structured prep blob to mirror; optional ops metric only. |
| **F_free_form_notes_no_prep** | **No** | Free-form notes without `customerPrep=` — **not** eligible for this **prep-only** backfill; different product/policy if ever addressed. |
| **G_invalid_or_empty_prep** | **No** | Empty token or validator failure — **do not** persist junk JSON. |

### 2.1 Manual review backlog (non-blocking for V1 automation)

- **D** — highest priority human queue (**bookingId** lists only, internal tooling).
- **G** — investigate dual-write bugs vs historical corruption (**bookingId** + **`safeReason`** codes from dry-run parity if correlated).

---

## 3. Execution safety — future flags & rules

### 3.1 Required CLI flags (future BUILD DROP)

| Flag | Role |
|------|------|
| *(default)* | **Dry-run only** — identical semantics to today’s classifier scan + aggregate JSON (**no** inserts). |
| **`--write`** | Enables mutation path; **invalid without** matching **`--confirm`**. |
| **`--confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA`** | **Exact** phrase match (implementation constant **must** equal operator input — character-accurate; document any suffix like `_V1` if added in code). |
| **`--limit`** | Cap bookings processed (same forms as dry-run: `--limit=` / `--limit`). |
| **`--batch-size`** | Read/query batch + suggested transaction grouping ceiling (same as dry-run). |
| **`--cursor-created-at`**, **`--cursor-id`** | Resume cursor (**paired**), same rules as dry-run. |
| **`--include-samples`** | Emit **bookingId-only** samples in buckets / failures as today. |
| **`--sample-limit`** | Cap sample array lengths. |
| **`--executedBy=`** *(recommended)* | Non-PII actor label in JSON summary. |

### 3.2 Hard rules

| Rule | Detail |
|------|--------|
| **No overwrite** | **`INSERT`** only; **`bookingId` `@unique`** → **`ON CONFLICT DO NOTHING`** or catch **`P2002`** → count **`already_exists`**. |
| **No delete** | Never delete metadata rows in V1 script. |
| **No `Booking.notes` mutation** | Notes remain authoritative legacy transport. |
| **Transactional boundary** | **Prefer one transaction per booking insert** (minimal blast radius). Optional micro-batch **`BEGIN…COMMIT`** for throughput **only** after staging proof — cap batch **N** small (e.g. ≤ 25). |
| **Failure records** | **`{ bookingId, code }`** only — **`code`** from stable enum (e.g. `INSERT_REJECTED`, `CLASSIFICATION_DRIFT`, `TX_ABORT`) — **no** raw exception strings containing note bodies (sanitize / map driver errors). |
| **Stdout/stderr** | Same PII policy as dry-run: **aggregates + bookingIds + codes** only. |

---

## 4. Operational runbook (staging → production)

### 4.1 Recommended sequence

1. **Dry-run limited:** `npm run --silent backfill:booking-operational-metadata:dry-run -- --limit <n>` — sanity + JSON piping.
2. **Dry-run full (staging):** full scan; archive JSON artifact (**internal**, access-controlled).
3. **Review counts:** **`B`** vs **`D`/`G`** thresholds per tenant policy; sign-off owner recorded.
4. **Write pilot:** future script **`--write --confirm=… --limit <small>`** on **staging** DB clone / staging env only.
5. **Verify rows:** SQL / Prisma count **`BookingOperationalMetadata`** joins vs **`B`** expectation (+ **`already_exists`** skips).
6. **Dry-run again:** confirm **`B`** decay toward noise (legacy backlog shrinking).
7. **Shadow soak:** enable **`ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW`** on admin ops traffic (or sampling BUILD DROP); watch **`match` / `mismatch` / `notes_only`** rates — **no** customer-visible change.
8. **Scale batch:** increase concurrency / micro-batch **only** after stable **`failed`** rate + parity dashboards.

### 4.2 Production gate

- Written approval (ticket / change record): scope (**tenant** subset vs global), window, rollback owner, **`limit`** for first prod slice.
- **No production** until staging **`failed == 0`** (or documented acceptable residual codes).

### 4.3 Rollback reality

- **There is no automatic “undo”** without destructive SQL — **not** in scope for V1 script.
- **Emergency mitigation:** manually **`DELETE`** sidecar rows **by explicit bookingId list** — **separate** approval, **never** part of default script; **never** touch **`Booking.notes`**.
- Product rollback remains **`Booking.notes`** / **`customerPrep=`** read paths (**unchanged**).

---

## 5. Output / audit report (write mode)

Machine-readable JSON (stdout when **`npm run --silent`**), **no raw customer text**:

| Field group | Content |
|-------------|---------|
| **`mode`** | `"dry_run"` \| `"write"` |
| **`scriptVersion`** | Immutable string constant per BUILD DROP |
| **`executedBy`** | Optional operator/service id |
| **`scanned`** | Total booking rows evaluated |
| **`created`** | Successful **`INSERT`** count |
| **`skippedByBucket`** | Counts keyed **`A`…`G`** (subset zero in write mode except **`B`** processed vs skipped-after-recheck) |
| **`alreadyExists`** | **`A`** path skips |
| **`failed`** | Count + **`failures: { bookingId, code }[]`** capped |
| **`cursor`** | Start/end **`createdAt`/`id`** + **`nextCursor`** recommendation |
| **`samples`** | Optional **`bookingId`** arrays only (same buckets as dry-run policy) |

---

## 6. Future test plan (implementation BUILD DROP)

| # | Requirement |
|---|-------------|
| 1 | **`--write`** without **`--confirm`** → refuse (exit ≠ 0, safe JSON error). |
| 2 | Wrong **`--confirm`** substring → refuse. |
| 3 | Write path **only** invokes **`INSERT`** when classifier returns **`B`** (table-driven fixtures). |
| 4 | **A** → skip **`already_exists`**, **zero** `UPDATE` calls on metadata row. |
| 5 | **D**, **G** → **never** insert (property test across fixtures). |
| 6 | Default / missing **`--write`** → **zero** Prisma **`create`** calls (mock client spy). |
| 7 | Stdout JSON contains **no** `"notes"` key, **no** `customerPrep=` substring, **no** email-shaped tokens in fixtures output. |
| 8 | Failure paths emit **`code`** enum only — **no** raw **`Error.message`** from DB driver leakage (map or strip). |

Integration tests may use **transaction rollback harness** or **mock Prisma** — **no** requirement for production DB.

---

## 7. Main risks

| Risk | Mitigation |
|------|------------|
| **Classifier drift** vs runtime inserts | Single **`classifyBookingForOperationalMetadataBackfillBucket`** import — contract tests **B-only insert**. |
| **Race:** row appears between dry-run and insert | **`UNIQUE`** + treat conflict as **`already_exists`** — safe. |
| **Partial micro-batch failure** | Small batches + per-booking transactions default — bounded rework via cursor. |
| **Log/metrics leakage** | Map exceptions to **`code`**; forbid printing **`booking.notes`** in script layers. |
| **Operator bypass** | Dual gate **`--write`** + exact **`--confirm`** + staging soak **before** prod slices. |

---

## 8. Recommended next build drop

**BUILD DROP — STRUCTURED METADATA WRITE-MODE V1**

Deliverables: new script (or guarded extension behind **`--write`**), Prisma **`create`** with **`skipDuplicates` / conflict handling**, tests per §6, staging runbook checklist in PR description.

---

## 9. References

- `services/api/scripts/backfill-booking-operational-metadata-dry-run.lib.ts`
- `services/api/scripts/backfill-booking-operational-metadata-dry-run.ts`
- `services/api/src/modules/bookings/booking-operational-metadata.ts`
- `docs/engineering/STRUCTURED_METADATA_BACKFILL_PARITY_PLAN_V1.md`
- `docs/engineering/STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md`
- `services/api/scripts/reconcile-historical-deposit-mismatches.ts`
