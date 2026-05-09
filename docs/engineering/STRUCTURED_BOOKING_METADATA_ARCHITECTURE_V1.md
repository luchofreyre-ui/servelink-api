# Structured booking metadata — architecture & roadmap

This document describes how Servelink moves from **`Booking.notes` string transport** (including pipe-delimited intake-bridge lines and embedded **`customerPrep=`**) toward **typed, visibility-aware operational metadata**.

---

## Target shape (logical)

- **Customer team prep** — free-text plus optional structured hints (access, parking, pets, etc.).
- **Provenance** — internal-only audit fields (e.g. intake source, capture time). Must never ship on customer DTOs.
- **Legacy notes** — remain until dual-write + read-cutover criteria are met.

---

## Storage options (summary)

| Approach | Tradeoff |
|---------|----------|
| JSON column on `Booking` | Simple additive migration; couples blob to core row; weaker row-level audit. |
| **1:1 sidecar table + JSON payload** | Clear boundary, versioned payload, fits phased migration — **chosen for V1**. |
| Typed note/event rows | Strong audit/query; higher implementation cost — candidate for later phases. |

---

## Implementation status — V1 storage drop

- **`BookingOperationalMetadata` sidecar** added (1:1 with `Booking`, `schemaVersion` + `payload` JSON).
- **Dual-write** from booking-direction intake bridge when `recurringInterest.note` produces team prep — **`Booking.notes` unchanged**, **`customerPrep=` transport retained**.
- **Read paths** for customer / admin / FO UIs **still use existing `Booking.notes` parsing**; structured read + cutover deferred.
- **`getCustomerTeamPrepFromBookingOperationalMetadataOrNotes`** helper prefers validated metadata then falls back to notes — **not wired into HTTP/UI responses** in this drop.
- **Production backfill** of historical rows is **explicitly deferred**.

---

## Rollout (remaining)

1. Optional admin/API reads using structured payload + notes fallback.
2. Metrics on dual-write parity.
3. Backfill job for eligible legacy bookings.
4. Stop emitting redundant transport fields only after coverage + monitoring thresholds.

---

## Related code

- Payload validators: `services/api/src/modules/bookings/booking-operational-metadata.ts`
- Intake dual-write: `services/api/src/modules/booking-direction-intake/intake-booking-bridge.service.ts`
- Persist hook: `services/api/src/modules/bookings/bookings.service.ts` (`createBooking`)
