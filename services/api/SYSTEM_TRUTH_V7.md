# Servelink System Truth V7

Executable regression guard contract for the Servelink API and public booking surface.

This document is the authoritative system truth for future work. It is not a status note, retrospective, or implementation proposal. It is a contract: any future code, migration, script, deployment, ops surface, or public booking UX change that conflicts with this document is wrong unless this document is intentionally updated in the same change.

## Scope

System Truth V7 extends the V6 post-stabilization baseline with durable UI and decision-layer visibility for:

- ops summary payment and cron ledger visibility
- FO supply readiness visibility
- learning decision-layer visibility
- public booking conversion UX clarity

This lock does not add features and does not authorize business behavior changes.

## Non-Negotiable Invariants

### 1. BOOKING + PAYMENT INVARIANTS

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

Historical deposit/payment mismatches have been reconciled. They MUST NOT reappear. Any reappearance of `payment_pending + deposit_succeeded` is a regression and must be treated as a system integrity issue, not normal drift.

### 2. LEARNING PIPELINE INVARIANTS

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

### 3. RECONCILIATION INVARIANTS

The historical deposit mismatch reconciliation script:

- is idempotent
- only affects historical mismatches where `paymentStatus = payment_pending` and `publicDepositStatus = deposit_succeeded`
- does not touch Stripe
- does not mutate financial provider data
- does not create or complete bookings
- writes `PAYMENT_RECONCILIATION_APPLIED` booking events
- writes audit payload metadata with `reconciliationType = historical_deposit_mismatch_fix`
- requires `--execute`
- requires `--confirm=RECONCILE_HISTORICAL_DEPOSIT_MISMATCHES`

Reconciliation MUST NOT run automatically. It is manual only.

Any future reconciliation mechanism that mutates booking/payment data MUST be dry-run-first, explicitly approved before execution, and independently auditable.

### 4. CRON INVARIANTS

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

### 5. OPS VISIBILITY INVARIANTS

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

### 6. SLOT + HOLD INVARIANTS

Expired holds MUST NOT be treated as active.

Slot selection MUST be deterministic for equivalent inputs.

Past slots MUST NOT be confirmable.

Hold confirmation MUST respect expiration. A booking MUST NOT be confirmed through an expired hold path.

Slot hold cleanup and integrity surfaces MUST preserve visibility into:

- active non-expired holds
- expired holds still present
- expired holds attached to operational bookings
- duplicate active holds for the same FO/start/end window

### 7. FO MATCHING INVARIANTS

An FO must be match-ready before being matched.

Match-ready means the FO is:

- geo-valid
- schedule-valid
- capacity-valid
- provider-linked
- active and not blocked by safety/restriction state

Non-ready FOs MUST NOT be matched.

FO supply/readiness surfaces MUST make readiness gaps observable. Matching code MUST NOT bypass centralized readiness rules.

## EXPANSION LAYER

Expansion work MUST be additive and contract-preserving. New surfaces may improve visibility, alerts, or operator workflows, but MUST NOT weaken booking/payment, learning, reconciliation, cron, slot/hold, or FO matching invariants.

Expansion work MUST remain scoped to its declared boundary. Visibility-only drops MUST NOT mutate booking/payment state, retune estimator formulas, alter matching rules, or add automatic reconciliation.

## OPS SUMMARY UI SURFACE

The admin ops UI MUST expose the existing ops summary health signals for:

- payment health
- cron ledger health
- learning/controlled completion visibility
- anomaly and backlog pressure

The UI MUST tolerate partial payloads without hiding known risk signals. Missing optional fields may render as unavailable or unknown, but known anomalies, payment mismatch pressure, and cron ledger gaps MUST remain visible.

## FO SUPPLY VISIBILITY

The admin ops UI MUST expose franchise-owner supply readiness, including:

- dispatch-ready or match-ready supply
- blocked/not-ready supply
- readiness reasons
- provider linkage
- schedule presence
- geo validity
- capacity validity
- supply sufficiency

FO readiness UI MUST be observational. It MUST NOT change FO activation, matching, provider linkage, or schedule behavior.

## LEARNING DECISION LAYER

The learning decision layer MUST expose estimator decision intelligence without changing estimator formulas or automatically tuning models.

Learning decision visibility MUST include:

- `available`
- `totalRecords`
- `latestRecords`
- `aggregate`
- `byServiceType`
- `flags`
- `hasEnoughData`
- `hasHighVarianceOutliers`

The UI MUST make insufficient data, high variance, service type breakdowns, and recent learning records visible.

## BOOKING CONVERSION UX

The public booking flow MUST preserve conversion-oriented clarity without changing payment, estimator, booking mutation, or backend contracts.

The public booking UX MUST keep:

- optional home-detail inputs progressively disclosed behind `Add more details (optional)`
- persistent next-step guidance through `What happens next`
- trust reinforcement through `No surprises`
- selected schedule reassurance through `This time is available`
- final review CTA clarity through `Confirm Booking`

## Current System State Snapshot

This is the locked V7 baseline:

- learning pipeline: VERIFIED
- payment system: CONSISTENT
- historical mismatches: RESOLVED
- cron ledger: ACTIVE
- ops visibility: COMPLETE
- ops summary UI surface: ACTIVE
- FO supply visibility: ACTIVE
- learning decision layer: ACTIVE
- booking conversion UX clarity: ACTIVE
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
- hide FO supply readiness gaps from ops UI
- hide learning decision sufficiency or variance signals from ops UI
- remove public booking conversion clarity without a replacement that preserves the same user-facing guarantees

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
- FO supply readiness gaps are hidden from ops UI
- learning decision sufficiency or variance signals are hidden from ops UI
- public booking flow removes conversion clarity without preserving the contract above

Any regression above must be fixed before feature work continues.
