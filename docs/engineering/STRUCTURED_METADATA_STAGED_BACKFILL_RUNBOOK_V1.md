# Structured metadata staged backfill — operator runbook (v1)

## Quick operator checklist

- [ ] Verify **branch / `main`** at required commit (see §1).
- [ ] Verify **`DATABASE_URL`** points to the **intended environment** (never assume).
- [ ] Verify **migrate status**: `BookingOperationalMetadata` table exists and matches expectations for this env.
- [ ] Run **dry-run** (canonical commands in §3); capture JSON output.
- [ ] Inspect JSON for **§6 Required observations** (no raw notes/prep/PII).
- [ ] Run **pilot write** on **local/dev or staging only** (§4); never production without §5 approval gate.
- [ ] **Re-run dry-run** after write slices; compare **`created`** / **`alreadyExists`** / bucket histograms.
- [ ] **Record counts**, cursor positions, operator id (`--executed-by`), and any stop-condition notes.

---

## 1. Preconditions

- **`main` commit:** Runbook assumes **`main` @ `7165b67` or newer** (guarded write mode for `BookingOperationalMetadata` backfill CLI). Confirm with `git rev-parse HEAD` in the repo used for scripts.
- **Database:** Schema must include the **`BookingOperationalMetadata`** migration (sidecar table, unique `bookingId`). Do not run write mode against a DB that lacks this table.
- **CLI — dry-run:** `npm run --silent backfill:booking-operational-metadata:dry-run` performs **no writes** by default and remains the primary classification tool.
- **CLI — write mode:** Available only with **`--write`** and exact **`--confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA`** (dual confirmation). See `STRUCTURED_METADATA_WRITE_MODE_SAFETY_REVIEW_V1.md`.
- **`DATABASE_URL`:** Must explicitly target **local/dev**, **staging**, or **production**. Misconfigured URLs are a primary incident class — verify env vars and shell context before every run.
- **Production:** Any production write requires **explicit written approval** (owner/on-call + data/ops), a defined slice or cursor strategy, and monitoring windows. **This runbook does not authorize production execution by itself.**

**Invariant reminders (non-negotiable for this program):**

- No **read-path flip** as part of backfill execution.
- Do **not** remove **`Booking.notes`** fallback or **`customerPrep=`** transport from product behavior; backfill only adds missing sidecar rows where eligible.
- No estimator, pricing, Stripe, slot, recurring, or service-matrix changes as part of backfill runs.

---

## 2. Environment order

Execute in order:

1. **Local / dev** — Prove commands, JSON shape, and pilot writes against disposable or dev databases.
2. **Staging** — Full rehearsal: dry-run at scale, bounded write pilots, idempotency checks, shadow/parity checks where applicable.
3. **Production** — Only after staging success, approval gate (§5), and explicit run plan. **Planning-only drops must not execute production backfill.**

---

## 3. Dry-run commands

Dry-run is **default** (omit `--write`). Use **`npm run --silent`** so lifecycle noise does not corrupt piped JSON.

**Sample slice with booking IDs only (no raw notes):**

```bash
cd services/api

npm run --silent backfill:booking-operational-metadata:dry-run -- --limit 25 --include-samples
```

**Larger scan with default-style paging:**

```bash
cd services/api

npm run --silent backfill:booking-operational-metadata:dry-run -- --batch-size 100
```

Optional: resume with paired **`--cursor-created-at`** / **`--cursor-id`** from prior JSON **`nextCursor`** (document cursors per environment).

---

## 4. Write-mode pilot commands (staging / local only)

Use **only** on **local/disposable** or **staging** databases approved for test writes. Replace `<operator>` with a stable operator label (e.g. `alice@company` or ticket id).

```bash
cd services/api

npm run --silent backfill:booking-operational-metadata:dry-run -- \
  --write \
  --confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA \
  --limit 25 \
  --include-samples \
  --executed-by=<operator>
```

**Behavior recap:** Inserts **only** bookings classified **`B_would_create_from_notes`** with no existing sidecar row; **`P2002`** treated as **`alreadyExists`**; no **`Booking.notes`** mutation; no overwrite/delete of existing metadata rows.

---

## 5. Production command template (approval-required)

**Do not run without explicit production approval and verified `DATABASE_URL`.**

```bash
cd services/api

npm run --silent backfill:booking-operational-metadata:dry-run -- \
  --write \
  --confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA \
  --batch-size 100 \
  --executed-by=<operator>
```

Production runs should also define **`--limit`** or **cursor-based** slices, change windows, and rollback expectations (§9) before execution.

---

## 6. Required observations (every JSON output)

Confirm the emitted JSON includes and is internally consistent for:

| Field / concept | Note |
|-----------------|------|
| **`mode`** | `"dry_run"` or `"write"` |
| **`scanned`** / **`summary.totalScanned`** | Total rows processed in the slice |
| **`created`** (write mode) | Successful **`BookingOperationalMetadata`** inserts |
| **`alreadyExists`** (write mode) | Existing row or **`P2002`** conflict |
| **`failed`** (write mode) | Non-conflict insert failures |
| **`skippedByBucket`** (write mode) | Skips for ineligible buckets (**C–G** pattern); align with **`buckets`** |
| **`buckets`** | Full classification histogram |
| **`nextCursor`** | For resuming scans |
| **Samples** | If **`--include-samples`**: **booking IDs only** |

**Safety:** Output must **not** contain raw **`Booking.notes`**, embedded intake prep lines, names, emails, phones, addresses, or payment fields. Write-mode **`failures`** must be **`bookingId` + `code`** only.

---

## 7. Stop conditions

**Stop immediately** and escalate if any of the following occur:

- **`failed` > 0** in write mode (investigate codes before continuing).
- **Unexpected spike** in **`D_ambiguous_notes`** or **`G_invalid_or_empty_prep`** versus recent dry-run baselines (data drift or classifier mismatch).
- **Raw data leakage** in stdout/stderr (notes, prep text, PII).
- **Mismatch** between dry-run bucket expectations and write-mode **`created`** / **`skippedByBucket`** for the same slice.
- **Database performance** issues (locking, replication lag, elevated errors).
- **Operator uncertainty** about **`DATABASE_URL`** or environment identity.

---

## 8. Post-run verification

After each write slice or pilot:

1. **Re-run dry-run** over the same range (or full env per policy) and confirm **`B_would_create_from_notes`** counts move toward zero where intended.
2. Compare **`created`** / **`alreadyExists`** against expectations; **repeat pilot** should show **idempotency** (**`created`** → 0, **`alreadyExists`** increases where rows exist).
3. **Shadow / read-path parity:** Where the stack supports it, use shadow comparison or internal tooling (see `STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md` / admin workflows) — **do not** flip customer read paths as part of backfill.
4. **Spot-check:** Confirm **`Booking.notes`** unchanged for sampled bookings (read-only queries).
5. **Product:** Confirm **no customer-facing behavior change** from backfill alone (sidecar is additive).

---

## 9. Rollback reality

- There is **no** bundled **broad rollback script** for this backfill.
- **Revert** of mistaken inserts is **manual**: delete **`BookingOperationalMetadata`** rows **only** by an **explicit, approved bookingId list**, with auditing and dual control where required.
- **`Booking.notes`** and **`customerPrep=`** transport remain the **fallback** for operational prep; removing sidecar rows restores reliance on notes — coordinate with ops before deletes.

---

## 10. Exit criteria

A staged backfill program may be considered complete (or consciously deferred) when:

- **Backfill scope** is complete **or** remaining rows are documented and deferred with rationale.
- **Shadow parity** (where used) is **stable** — no unexplained regressions.
- **Fallback usage** is **measured** or estimated (how often prep still comes only from notes vs metadata).
- **Read-path flip** (if ever desired) is **planned separately** — not bundled into backfill execution.

---

## References

- `docs/engineering/STRUCTURED_METADATA_WRITE_MODE_SAFETY_REVIEW_V1.md`
- `docs/engineering/STRUCTURED_METADATA_READ_PATH_SHADOW_PLAN_V1.md`
- `docs/engineering/STRUCTURED_METADATA_BACKFILL_PARITY_PLAN_V1.md`
