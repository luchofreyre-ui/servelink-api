# Maintenance subject identity governance (V1)

## 1. Purpose

This note governs subject identity for `MaintenanceStateCheckpoint` V1.

## 2. Core principle

A maintenance timeline must represent a real-world maintenance subject, not merely a convenient account id.

## 3. V1 subject rules

- **For quote-time / one-time / pre-plan replay:**  
  `subjectType` = `"booking"`  
  `subjectId` = `Booking.id`

- **For active recurring maintenance program replay/checkpoints:**  
  `subjectType` = `"recurring_plan"`  
  `subjectId` = `RecurringPlan.id`

- **For customer-level diagnostics:**  
  `subjectType` = `"customer"`  
  `subjectId` = `User.id`  

  Use this **only** for aggregate/admin diagnostics.  
  **Never** treat customer-scoped checkpoints as physical-home calibration truth.

## 4. Explicitly forbidden interpretations

- Do not default property-level timelines to `customerId`.
- Do not treat `customerId` as a home identity.
- Do not use `"service_location"` `subjectType` until a real `ServiceLocation` / `CustomerServiceSite` entity exists.
- Do not use raw address strings as `subjectId`.
- Do not use address hashes as canonical `subjectId` in V1.
- Do not merge timelines across bookings/plans by customer alone.
- Do not backfill historical service-location timelines without a ServiceLocation design.

## 5. Provenance guidance

Address/location context may be recorded **only as provenance**, such as:

- `bookingId`
- `recurringPlanId`
- `recurringOccurrenceId`
- `intakeId` if available later
- canonical service address hash if explicitly versioned later
- `siteLat` / `siteLng`-derived context if rounded and labeled as non-canonical

**Location fingerprints are advisory provenance only in V1.**  
They are **not** primary identity.

## 6. V2 direction

Future V2 should introduce a first-class **ServiceLocation** / **CustomerServiceSite** model before customer-facing or automated maintenance intelligence.

V2 should include:

- stable id
- `customerId` / `tenantId`
- normalized address fields
- geocode metadata
- `canonicalAddressHash`
- `createdFromBookingId` / `createdFromIntakeId` lineage
- optional `Booking.serviceLocationId`
- optional `RecurringPlan.serviceLocationId`
- migration compatibility for V1 checkpoints

## 7. Replay correctness warning

Wrong subject identity causes:

- merged unrelated home histories
- split same-home history
- corrupted calibration
- unsafe recurring automation
- invalid degradation curves
- untrustworthy future pricing guidance

## 8. Current V1 safe usage

`MaintenanceStateCheckpoint` V1 is safe **only** for:

- admin replay
- sparse append-only checkpoints
- deterministic reconstruction
- future calibration preparation
- non-customer-facing diagnostics

It is **not** safe yet for:

- automated pricing
- customer-visible home scores
- automatic recurring reset decisions
- address-level linking
- ML training without identity review
