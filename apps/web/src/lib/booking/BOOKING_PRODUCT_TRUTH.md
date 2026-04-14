# Booking Product Truth

This document is the human-readable contract for the public `/book` funnel and its API boundaries. Code constants live in `bookingProductContract.ts`. Payload wire shape is `BookingDirectionOutboundPayload` in `bookingDirectionIntakeApi.ts` and `CreateBookingDirectionIntakeDto` in the API.

## Purpose

Deliver a guided booking experience that:

- Produces a server-backed estimate snapshot before plan decision.
- Keeps **preview** and **submit** bodies free of top-level `estimateFactors` (questionnaire stays funnel state; server maps defaults when omitted).
- Separates **one-time** booking direction intake from **recurring** plan creation (`POST /api/v1/recurring/plans`).
- Captures honest **schedule** and **cleaner preference** intent for confirm/ops even when not yet first-class on the intake DTO.

## Canonical step order

`service` → `home` → `factors` → `schedule` → `review` → `decision` → `recurring_setup` → `confirm`

(See `bookingSteps` in `bookingFlowData.ts`.)

## One-time path

- **Guest-capable** through confirm for intake submit.
- **Review** requires a successful estimate snapshot (`preview-estimate` + locked snapshot) before continue.
- **Decision** offers one-time; choosing it sets `recurringIntent: { type: "one_time" }` and jumps to **confirm**.
- **Confirm** requires valid estimate snapshot and contact fields; submit calls `booking-direction-intake` submit path with **only** DTO-allowed fields.

## Recurring path

- **Decision** allows recurring cadence selection **without** forcing login at that moment.
- **recurring_setup** collects first-visit scheduling for plan creation (date, arrival preference, add-ons, notes).
- **Confirm** shows recurring summary; **customer JWT** is required only when executing **`POST /recurring/plans`** (final action). Guests who reach confirm see sign-in handoff; state is restored from `sessionStorage` after auth via existing `BOOKING_FLOW_SESSION_KEY` restore on `/book` mount.

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

- **Preview** (`/booking-direction-intake/preview-estimate`): body matches `buildPreviewBookingDirectionPayload` — **no** top-level `estimateFactors`.
- **Review** may not advance while preview is loading, in error, or without `estimateSnapshot` once the preview round completed.
- **Submit** (one-time): same wire fields as preview; server applies estimate defaults when `estimateFactors` omitted.

## Scheduling contract

- **Wire today:** `frequency` + `preferredTime` strings on `BookingDirectionOutboundPayload` (API `CreateBookingDirectionIntakeDto`).
- **Funnel state:** `scheduleSelection` (`ScheduleSelection` in `bookingFlowTypes.ts`) holds richer intent:
  - **Current implementation:** `mode: "preference_only"` only. No public funnel route yet lists concrete slots; do not render fake slot cards.
  - **Product direction (`BOOKING_PRODUCT_CONTRACT.schedulingMode`):** `slot_selection` — upgrade path is to call real availability when a customer-safe API is wired into this funnel.
- **Confirm** must show the human-readable schedule line from `buildBookingDispatchHandoffSummary`.

## Cleaner selection / preferred cleaner contract

- **Wire today:** booking-direction intake DTO has **no** generic “preferred cleaner” field for the public submit path.
- **Funnel state:** `cleanerPreference` (`CleanerPreference`) with `mode: "none" | "preferred_cleaner"`, optional notes, optional `hardRequirement` (soft default).
- **No fake provider cards** without a backed list API.
- **Confirm** shows captured preference text from the handoff helper only.

## Confirm-step requirements

- **One-time:** estimate snapshot + schedule complete (`frequency` + `preferredTime` + `scheduleSelection`) + contact valid.
- **Recurring:** above + `recurring_setup` complete + customer auth at submit for plan creation.

Exact copy:

- `Please complete your recurring setup before continuing.`
- `Please complete your scheduling details before continuing.`
- `Please sign in to continue with your recurring plan.` (recurring submit as guest)
- `Please complete your cleaner preference selection before continuing.` — **not used** while cleaner remains optional (not listed in `BOOKING_PRODUCT_CONTRACT.confirmRequirements`).

## Dispatch handoff contract

- **Intake submit** sends only fields allowed by `CreateBookingDirectionIntakeDto`.
- **UI / ops narrative** uses `buildBookingDispatchHandoffSummary` in `bookingDispatchHandoff.ts` (does not mutate API payloads).

## Admin / operator visibility surfaces

- **`/admin/ops/recurring`:** recurring ops summary, exhausted queue, route manifest, live probes (`AdminRecurringOperationsPanel`, `RecurringOpsDashboard`).
- **Booking direction intakes (admin):** lists captured intake rows (`/admin/booking-direction-intakes`) — schedule/cleaner funnel fields are not yet guaranteed columns; operators rely on intake detail views as implemented server-side.

## Customer lifecycle surfaces

- **`/customer/recurring`:** authenticated customer plans (`GET /recurring/plans/me`, etc.).
- **`/customer/auth`:** customer login; used for recurring final-submit handoff with `redirect=/book`.

## Regression matrix

| Flow | Coverage |
|------|-----------|
| Review preview loading guard | `booking-review-loading-race.spec.ts` |
| One-time → confirm | `booking-one-time-happy-path.spec.ts` |
| Recurring guest through setup → confirm auth handoff | `booking-recurring-auth-gate.spec.ts` |
| Recurring + one-time smoke | `booking-recurring-path.spec.ts` |
| Confirm without snapshot blocked | `booking-confirm-without-snapshot.spec.ts` |
| Admin recurring page | `admin-recurring-ops-page.spec.ts` |

## Recovered existing system surfaces

From repo history and code search (not exhaustive):

| Path | Role |
|------|------|
| `apps/web/.../bookingDirectionIntakeApi.ts` + `bookingIntakePayload.ts` | Preview/submit payload builders; no top-level `estimateFactors`. |
| `apps/web/.../BookingFlowClient.tsx` | Step machine, preview guard, recurring vs one-time submit. |
| `apps/web/.../BookingStepSchedule.tsx` | Frequency, preferred time, day-window / notes, `BookingStepCleanerPreference`. |
| `apps/web/.../bookingRecurringApi.ts` | Customer recurring HTTP client + documented routes. |
| `services/api/.../booking-direction-intake/*` | Intake DTO, estimate mapping, submit controller. |
| `services/api/.../slot-holds/*` | Slot availability engine for bookings module (not yet wired to public funnel). |
| `services/api/.../recurring/*` | Recurring plan CRUD, ops summary, `preferredFoId` on plan DTOs. |
| `apps/web/.../admin/ops/recurring/page.tsx` | Operator recurring dashboard shell. |

---

_Last updated: booking product recovery drop._
