# Booking Product Truth

This document is the human-readable contract for the public `/book` funnel and its API boundaries. Code constants live in `bookingProductContract.ts`. Wire types: `BookingDirectionOutboundPayload` / `SubmitBookingDirectionIntakePayload` in `bookingDirectionIntakeApi.ts`, `CreateBookingDirectionIntakeDto` in the API.

## Purpose

Deliver a guided booking experience that:

- Produces a server-backed estimate snapshot before plan decision.
- Keeps **preview** and **submit** bodies free of top-level `estimateFactors` (questionnaire stays funnel state; server maps defaults when omitted).
- Separates **one-time** booking direction intake from **recurring** plan creation (`POST /api/v1/recurring/plans`).
- Persists **schedule**, **cleaner preference**, and **recurring path metadata** as structured **`bookingHandoff`** on `BookingDirectionIntake` and forwards the same JSON into downstream **`Booking.notes`** for dispatch/ops (see intake bridge).

## Canonical step order

`service` → `home` → `factors` → `schedule` → `review` → `decision` → `recurring_setup` → `confirm`

(See `bookingSteps` in `bookingFlowData.ts`.)

## One-time path

- **Guest-capable** through confirm for intake submit.
- **Review** requires a successful estimate snapshot (`preview-estimate` + locked snapshot) before continue.
- **Decision** offers one-time; choosing it sets `recurringIntent: { type: "one_time" }` and jumps to **confirm**.
- **Confirm** requires valid estimate snapshot and contact fields; submit calls `POST /api/v1/booking-direction-intake/submit` with DTO-allowed fields including optional **`bookingHandoff`**.

## Recurring path

- **Decision** allows recurring cadence selection **without** forcing login at that moment.
- **recurring_setup** collects first-visit scheduling for plan creation (date, arrival preference, add-ons, notes).
- **Confirm** shows recurring summary; **customer JWT** is required only when executing **`POST /recurring/plans`** (final action). Guests who reach confirm see sign-in handoff; state is restored from `sessionStorage` after auth via existing `BOOKING_FLOW_SESSION_KEY` restore on `/book` mount.
- **bookingHandoff on intake** applies to **one-time intake submit** only. Recurring plan creation uses `CreateRecurringPlanRequest` / `intakeSnapshot` (separate contract); the funnel still mirrors recurring intent in UI summaries.

## Auth requirements by step

| Step | Guest | Customer |
|------|-------|----------|
| service → review | Yes | Yes |
| decision (recurring intent) | Yes | Yes |
| recurring_setup | Yes | Yes |
| confirm (view) | Yes | Yes |
| confirm (submit one-time intake) | Yes (contact on payload) | Yes |
| confirm (submit recurring plan) | **No** — redirect to `/customer/auth?redirect=/book` after persisting state | Yes |

Encoded rule: `BOOKING_PRODUCT_CONTRACT.recurringAuthPoint === "before_confirm"` (enforced at submit, not at cadence pick).

## Estimate pipeline contract

- **Preview** (`/booking-direction-intake/preview-estimate`): body matches `buildPreviewBookingDirectionPayload` — **no** top-level `estimateFactors`, **no** `bookingHandoff` from the public funnel (preview stays minimal).
- **Review** may not advance while preview is loading, in error, or without `estimateSnapshot` once the preview round completed.
- **Submit** (one-time): base fields as preview **plus** structured **`bookingHandoff`** from `buildBookingHandoffPayloadForIntakeSubmit` (public funnel always sends it; DTO keeps it optional for legacy callers); server applies estimate defaults when `estimateFactors` omitted on the row.

## API `bookingHandoff` shape (CreateBookingDirectionIntakeDto)

Optional nested object (all sub-fields optional at validation level; the web funnel sends a full object for observability):

```json
{
  "bookingHandoff": {
    "scheduling": {
      "mode": "preference_only" | "slot_selection",
      "preferredTime": "string | null",
      "preferredDayWindow": "string | null",
      "flexibilityNotes": "string | null",
      "selectedSlotId": "string | null",
      "selectedSlotLabel": "string | null"
    },
    "cleanerPreference": {
      "mode": "none" | "preferred_cleaner",
      "cleanerId": "string | null",
      "cleanerLabel": "string | null",
      "hardRequirement": "boolean",
      "notes": "string | null"
    },
    "recurring": {
      "pathKind": "one_time" | "recurring",
      "cadence": "string | null",
      "authRequiredAtConfirm": "boolean"
    }
  }
}
```

- **Persistence:** `BookingDirectionIntake.bookingHandoff` (`JSONB` / Prisma `Json`).
- **Bridge:** `IntakeBookingBridgeService` appends the same JSON under `--- SERVELINK_BOOKING_HANDOFF_JSON ---` on **`Booking.notes`** when a booking is created from intake.

## Assignment & capacity execution (v1 first pass)

- **Contract (API):** `services/api/src/modules/dispatch/assignment-capacity.contract.ts` — `AssignmentConstraintSet`, `CapacityEvaluationResult`, `ASSIGNMENT_REASON_CODES`, statuses `assignable` | `needs_review` | `deferred` | `unassignable`.
- **Mapper:** `assignment-constraint.mapper.ts` — `mapBookingHandoffToAssignmentConstraints` (never throws; merges intake `preferredTime` when handoff omits it).
- **Roster reader:** `services/api/src/modules/dispatch/roster-availability.service.ts` — `RosterAvailabilityService` loads **active** `FranchiseOwner` rows with linked `ServiceProvider` (plus optional `FoSchedule` windows as informational context only). No fabricated availability or hardcoded cleaner lists.
- **Evaluator:** `assignment-capacity.evaluator.ts` — `evaluateAssignmentCapacity`. The intake bridge passes a **real roster array** (possibly empty). Legacy rows may still omit `liveInputs` / have been evaluated before this drop; when `availableCleaners` is **omitted** in callers, roster ID checks are skipped. **Empty roster** → `needs_review` + `capacity_unknown` + `manual_review_required`. **`slot_selection` + `selectedSlotId`** → `needs_review` + `slot_not_enforceable_yet` (slot IDs are not mapped to provider capacity in this pass — intentional, not a bug). **`preference_only`** with roster and no preferred cleaner → deterministic “first by `cleanerId` sort” recommendation with an ops note (not ranked best-match). Preferred cleaner IDs may match either franchise-owner id or `providerId` on a roster row. Recurring continuity uses `RecurringPlan.preferredFoId` when resolvable.
- **Persistence:** `BookingDirectionIntake.assignmentExecution` JSON (`{ constraints, evaluation, liveInputs }`). `liveInputs` holds a minimal roster snapshot and, for **recurring** path intakes, `recurringContinuityContext` when lookup succeeds. **`Booking.notes`** also receives `--- SERVELINK_ASSIGNMENT_EXECUTION_JSON ---` after the handoff block when a booking is created.
- **Dispatch control:** Non-`assignable` outcomes set `BookingDispatchControl.reviewRequired` with `reviewSource=intake_assignment_capacity_v1` and reason codes embedded in `reviewReason` for command-center visibility.
- **Honesty:** Public funnel scheduling mode remains **preference_only** unless handoff explicitly carries `slot_selection`; even then, exact slot enforcement is **not** automated here. Cleaner preference is evaluated against the **live roster** when the bridge runs; recurring continuity is **attempted** when customer + plan context exists — not promised on every path.

## Scheduling contract

- **Legacy wire columns:** `frequency` + `preferredTime` on the intake DTO (unchanged).
- **Funnel state:** `scheduleSelection` (`ScheduleSelection` in `bookingFlowTypes.ts`).
- **Runtime mode:** **`preference_only`** — day-window and flexibility notes when offered; **no** fake exact slot UI without a backed public slot API.
- **Roadmap:** `BOOKING_PRODUCT_CONTRACT.schedulingModeRoadmap` is **`slot_selection`** for when availability is wired customer-safe end-to-end.
- **Confirm** shows the human-readable schedule line from `buildBookingDispatchHandoffSummary` (same underlying state as `bookingHandoff.scheduling`).

## Cleaner selection / preferred cleaner contract

- **Wire:** `bookingHandoff.cleanerPreference` on intake submit (DTO `BookingHandoffCleanerPreferenceDto`). UI funnel field `preferenceNotes` maps to API **`notes`**.
- **Funnel state:** `cleanerPreference` with `mode: "none" | "preferred_cleaner"`, optional `hardRequirement`.
- **No fake provider cards** without a backed list API.

## Confirm-step requirements

- **One-time:** estimate snapshot + schedule complete (`frequency` + `preferredTime` + `scheduleSelection`) + contact valid.
- **Recurring:** above + `recurring_setup` complete + customer auth at submit for plan creation.

Exact copy:

- `Please complete your recurring setup before continuing.`
- `Please complete your scheduling details before continuing.`
- `Please sign in to continue with your recurring plan.` (recurring submit as guest)
- `Please complete your cleaner preference selection before continuing.` — **not used** while cleaner remains optional (not listed in `BOOKING_PRODUCT_CONTRACT.confirmRequirements`).

## Dispatch handoff contract

- **Intake submit** sends `CreateBookingDirectionIntakeDto` including optional **`bookingHandoff`** (structured).
- **UI summaries** use `buildBookingDispatchHandoffSummary`; **API submit** uses `buildBookingHandoffPayloadForIntakeSubmit` — same booking state, parallel shapes (scheduling / cleaner / recurring).

## Admin / operator visibility surfaces

- **`/admin/ops/recurring`:** recurring ops summary, route manifest, funnel vs intake note, and a static **Continuity, cleaners, and execution** section (truthful scope statement).
- **`/admin/booking-direction-intakes`:** **Handoff** summary plus **Assignment**, **Reason codes**, **Continuity / pref**, and **Live execution** (recommended cleaner, preferred-match / continuity flags, roster count from `liveInputs`) when the bridge has run; API returns full JSON per row.
- **Booking record:** operators can read **`SERVELINK_BOOKING_HANDOFF_JSON`** and **`SERVELINK_ASSIGNMENT_EXECUTION_JSON`** blocks on `Booking.notes` when a booking is created from intake.

## Customer lifecycle surfaces

- **`/customer/recurring`:** authenticated customer plans (`GET /recurring/plans/me`, etc.).
- **`/customer/auth`:** customer login; used for recurring final-submit handoff with `redirect=/book`.

## Regression matrix

| Flow | Coverage |
|------|-----------|
| Review preview loading guard | `booking-review-loading-race.spec.ts` |
| One-time → confirm + submit `bookingHandoff`, no `estimateFactors` on wire | `booking-one-time-happy-path.spec.ts` |
| Assignment mapper + evaluator (API unit) | `assignment-capacity.mapper-evaluator.spec.ts` |
| Recurring guest through setup → confirm auth handoff | `booking-recurring-auth-gate.spec.ts` |
| Recurring + one-time smoke | `booking-recurring-path.spec.ts` |
| Confirm without snapshot blocked | `booking-confirm-without-snapshot.spec.ts` |
| Admin recurring page | `admin-recurring-ops-page.spec.ts` |

## Recovered roster / availability sources

| Backend path | What it provides |
|--------------|------------------|
| `services/api/src/modules/dispatch/dispatch-candidate.service.ts` | Active `FranchiseOwner` + `ServiceProvider` roster with geo/capacity **filters** for dispatch candidate ranking (booking-shaped input). |
| `services/api/src/modules/dispatch/roster-availability.service.ts` | Canonical **unfiltered** active FO + provider list for assignment evaluation; optional `FoSchedule` windows per FO (informational weekly windows, same table as `FoScheduleService`). |
| `services/api/prisma/schema.prisma` — `FranchiseOwner`, `ServiceProvider`, `FoSchedule`, `FoBlockout` | Active roster eligibility (`status`, `safetyHold`, `providerId`); linked provider display names; per-FO weekly schedule rows; blockouts (not yet driving intake evaluator rules). |
| `services/api/prisma/schema.prisma` — `BookingSlotHold` | Slot holds tied to `bookingId` + `foId` — real slot/capacity signals for **existing** bookings; **not** wired into intake assignment v1 (no invented mapping from funnel slot ids). |
| `services/api/prisma/schema.prisma` — `RecurringPlan.preferredFoId` | Continuity anchor for recurring customers when email resolves to a user with an active plan. |
| `services/api/src/modules/dispatch/provider-dispatch-resolver.service.ts` | `providerId` ↔ `foId` resolution for active franchise owners. |

## Recovered existing system surfaces

| Path | Role |
|------|------|
| `apps/web/.../bookingDirectionIntakeApi.ts` + `bookingIntakePayload.ts` | Preview (minimal) / submit payloads; submit includes **`bookingHandoff`**. |
| `apps/web/.../bookingDispatchHandoff.ts` | Confirm summaries + **`buildBookingHandoffPayloadForIntakeSubmit`**. |
| `apps/web/.../BookingFlowClient.tsx` | Step machine, preview guard, recurring vs one-time submit. |
| `apps/web/.../BookingStepSchedule.tsx` | Frequency, preferred time, day-window / notes, `BookingStepCleanerPreference`. |
| `apps/web/.../bookingRecurringApi.ts` | Customer recurring HTTP client + documented routes. |
| `services/api/.../booking-direction-intake/*` | Intake DTO (incl. `bookingHandoff`), persistence, bridge to `Booking`. |
| `services/api/.../slot-holds/*` | Slot availability engine for bookings module (not yet wired to public funnel). |
| `services/api/.../recurring/*` | Recurring plan CRUD, ops summary, `preferredFoId` on plan DTOs. |
| `apps/web/.../admin/ops/recurring/page.tsx` | Operator recurring dashboard shell. |

---

_Last updated: dispatch live roster + continuity inputs for assignment engine (v1)._
