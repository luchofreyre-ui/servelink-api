# Structured metadata write-mode safety review (v1)

## Implementation note (BookingOperationalMetadata backfill CLI)

Write mode was added to `services/api/scripts/backfill-booking-operational-metadata-dry-run.ts` (library: `backfill-booking-operational-metadata-dry-run.lib.ts`) under **dual confirmation**:

1. `--write`
2. Exact `--confirm=BACKFILL_BOOKING_OPERATIONAL_METADATA`

**Dry-run remains the default** when `--write` is omitted.

Behavior guarantees for this drop:

- Inserts **only** bookings classified as **`B_would_create_from_notes`** (missing sidecar row).
- **No** overwrite, update, or delete of existing `BookingOperationalMetadata` rows.
- **No** `Booking.notes` mutation.
- Unique conflicts (`P2002`) are treated as **already exists** (skipped, run continues).
- JSON output avoids raw notes/prep; failure entries are **`bookingId` + machine `code`** only.

Recommended ops posture: run extended dry-runs on representative slices, capture metrics, then execute write mode against a disposable or freshly restored database before touching production.
