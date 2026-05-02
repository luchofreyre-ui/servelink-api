# Servelink System Truth V6

Post-stabilization baseline contract for the Servelink API.

This document is the authoritative system truth for future work. It is not a status note, retrospective, or implementation proposal. It is a contract: any future code, migration, script, deployment, or ops surface that conflicts with this document is wrong unless this document is intentionally updated in the same change.

## Scope

System Truth V6 locks the API baseline after stabilization of:

- production learning pipeline verification
- controlled completion audit migration alignment
- ops payment visibility deployment
- deposit mismatch prevention deployment
- historical deposit mismatch reconciliation execution
- durable cron run ledger deployment

This lock does not add features and does not authorize business behavior changes.

## Non-Negotiable Invariants

### 1. Booking + Payment Invariants

A booking MUST NOT exist with both:

- `paymentStatus = payment_pending`
- `publicDepositStatus = deposit_succeeded`

Deposit success MUST result in `paymentStatus = authorized` or another canonical secured state. The canonical secured states are:

- `authorized`
- `paid`
- `waived`

When public deposit state becomes `deposit_succeeded`, the booking payment state MUST be aligned immediately unless it is already in a canonical secured state.

Payment anomalies MUST be surfaced in the ops summary. Ops consumers MUST be able to see:

- payment/deposit state counts
- unresolved payment anomalies
- recent payment anomaly counts
- stale pending payment buckets
- flags that identify deposit/payment mismatch pressure

Historical deposit/payment mismatches have been reconciled. They MUST NOT reappear. Any reappearance of `payment_pending + deposit_succeeded` is a regression and must be treated as a system integrity issue, not as normal drift.

### 2. Learning Pipeline Invariants

Controlled completion MUST:

- create a learning result/event
- create a controlled completion audit event
- fail if either write fails

Controlled completion MUST NOT silently complete while omitting learning or audit writes.

Learning data MUST include:

- `predictedMinutes`
- `actualMinutes`
- `variance`

Learning data MUST be durable through `BookingEvent` records and visible through ops surfaces. The learning pipeline MUST remain queryable after API restart and deployment.

Learning pipeline visibility MUST include:

- learning result/event count
- latest learning records/events
- controlled completion audit event count
- latest controlled completion audit events
- completed booking gaps after the learning migration date

### 3. Reconciliation Invariants

The historical deposit mismatch reconciliation script:

- is idempotent
- only affects historical mismatches where `paymentStatus = payment_pending` and `publicDepositStatus = deposit_succeeded`
- does not touch Stripe
- does not mutate financial provider data
- does not create or complete bookings
- writes `PAYMENT_RECONCILIATION_APPLIED` booking events
- writes audit payload metadata with `reconciliationType = historical_deposit_mismatch_fix`

Reconciliation MUST NOT run automatically. It is manual only.

Any future reconciliation mechanism that mutates booking/payment data MUST be dry-run-first, explicitly approved before execution, and independently auditable.

### 4. Cron Invariants

Every cron job MUST record durable run history.

Each cron job MUST:

- record `started`
- record exactly one terminal outcome: `succeeded`, `failed`, or `skipped`
- write to `CronRunLedger`
- preserve its existing business behavior and existing error behavior

Cron ledger writes MUST NOT cause a successful business cron body to fail. If ledger recording fails, the cron must log the ledger failure and preserve the original business outcome.

`CronRunLedger` MUST:

- persist across API restarts
- persist across deployments
- expose latest run status per job
- expose recent run counts
- expose recent failure counts
- be visible in ops summary

In-memory cron health MAY remain as a fast local signal, but it MUST NOT be the only source of cron run truth.

### 5. Ops Visibility Invariants

Ops summary MUST expose `payment` with:

- `bookingStates`
- `anomalies`
- `staleBuckets`
- `flags`

Ops summary MUST expose `cronLedger` with:

- job summaries
- last run status
- last run start time
- last run finish time
- last run duration
- recent failures
- recent run counts

Ops surfaces MUST expose learning visibility, including:

- learning events
- controlled completion audit events

Ops summary MUST NOT:

- hide anomalies
- collapse real risk into a healthy state
- rely on in-memory-only signals for durable operational truth
- omit durable cron run visibility
- omit payment/deposit mismatch visibility

### 6. Slot + Hold Invariants

Expired holds MUST NOT be treated as active.

Slot selection MUST be deterministic for equivalent inputs.

Past slots MUST NOT be confirmable.

Hold confirmation MUST respect expiration. A booking MUST NOT be confirmed through an expired hold path.

Slot hold cleanup and integrity surfaces MUST preserve visibility into:

- active non-expired holds
- expired holds still present
- expired holds attached to operational bookings
- duplicate active holds for the same FO/start/end window

### 7. FO Matching Invariants

An FO must be match-ready before being matched.

Match-ready means the FO is:

- geo-valid
- schedule-valid
- capacity-valid
- provider-linked
- active and not blocked by safety/restriction state

Non-ready FOs MUST NOT be matched.

FO supply/readiness surfaces MUST make readiness gaps observable. Matching code MUST NOT bypass centralized readiness rules.

## Current System State Snapshot

This is the locked post-stabilization baseline:

- learning pipeline: VERIFIED
- payment system: CONSISTENT
- historical mismatches: RESOLVED
- cron ledger: ACTIVE
- ops visibility: COMPLETE
- active blockers: NONE

Operational follow-up may still improve dashboards, alerting, or UI presentation. Those follow-ups do not change the locked baseline unless they alter one of the invariants above.

## Prohibited Changes

Future work MUST NOT:

- reintroduce the `payment_pending + deposit_succeeded` mismatch
- bypass payment state alignment when public deposit succeeds
- bypass learning writes during controlled completion
- complete controlled completion without controlled completion audit
- create in-memory-only cron tracking
- remove or hide `CronRunLedger` from ops summary
- hide payment anomalies from ops summary
- hide learning pipeline gaps from ops surfaces
- mutate Stripe state during reconciliation
- run historical payment reconciliation automatically
- create bookings, complete bookings, or mutate booking state from observability-only scripts
- weaken FO readiness checks for matching
- treat expired slot holds as active

## Safe Extension Rules

Future changes MUST:

- preserve every invariant in this document
- update this document in the same change when intentionally changing system truth
- include focused tests when touching payment behavior
- include focused tests when touching learning behavior
- include focused tests when touching cron behavior
- include focused tests when touching booking lifecycle behavior
- keep reconciliation scripts dry-run-first unless a single execution is explicitly approved
- keep ops visibility additive unless a breaking contract change is explicitly documented
- prefer durable database-backed truth over process memory for operational history

Future changes MUST NOT modify system truth without updating this document.

## Regression Classification

The following conditions are regressions:

- any booking has `paymentStatus = payment_pending` and `publicDepositStatus = deposit_succeeded`
- public deposit success does not align booking payment state to a secured state
- controlled completion succeeds without both learning and audit events
- reconciliation applies without a `PAYMENT_RECONCILIATION_APPLIED` event
- reconciliation touches Stripe or external financial state
- cron executes without a durable `CronRunLedger` row
- ops summary omits payment visibility
- ops summary omits cron ledger visibility
- ops surfaces cannot report learning visibility
- expired slot holds are treated as active
- non-ready FOs are matched

Any regression above must be fixed before feature work continues.
