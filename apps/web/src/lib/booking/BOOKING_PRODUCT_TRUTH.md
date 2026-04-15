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

## URL serialization truth

Implementation: `apps/web/src/components/marketing/precision-luxury/booking/bookingUrlState.ts` (`buildBookingSearchParams`, `parseBookingSearchParams`). Constants: `BOOKING_URL_SERIALIZATION` in `bookingProductContract.ts`.

### One-time path (after decision)

- `bookingPath=one_time` is always written on the one-time confirm path.
- Legacy `frequency` continues to carry the **schedule row** from the questionnaire (typically `One-Time` for the deep-clean happy path).
- `cadence` is omitted (no recurring cadence in URL).

### Recurring path (decision → recurring_setup → confirm)

- `bookingPath=recurring` and `cadence={weekly|biweekly|monthly}` are written as soon as the customer chooses a recurring cadence.
- The `frequency` query param mirrors the **cadence label** (`Weekly`, `Bi-Weekly`, `Monthly`) so the URL never claims `frequency=One-Time` while the funnel is on a recurring path.
- When recurring setup has a first anchor, `recAnchor=YYYY-MM-DD` and `recTime={morning|midday|afternoon|anytime}` are added so refresh / cold URL can rehydrate setup.
- Funnel **in-memory** `state.frequency` remains the schedule row used for the locked **preview/submit** estimate key when a snapshot exists; URL hydration preserves that row when it still matches `buildBookingEstimateDrivingSignature` (so estimate snapshots are not cleared by canonical URL churn).

### Precedence (legacy / contradictory query pairs)

1. If `cadence` is present and valid, it defines recurring intent and **wins** over a stale `frequency=One-Time` and over `bookingPath=one_time` if both were ever present in a bad link.
2. Else if `bookingPath=recurring`, recurring intent is implied; cadence is inferred from `frequency` when it maps to `Weekly` / `Bi-Weekly` / `Monthly`, otherwise it defaults to `weekly`.
3. Else if `bookingPath=one_time`, one-time intent is explicit.
4. Else recurring intent is not inferred from `frequency` alone (so `frequency=Weekly` on **schedule** / **review** stays a schedule row, not a recurring plan path).

### Auth redirect resume

- Before redirecting to `/customer/auth?redirect=/book`, the funnel persists JSON state under `sessionStorage` key `booking_flow_state`.
- That payload must include `recurringIntent: { type: "recurring", cadence }` and recurring setup fields; the serializer must emit matching `bookingPath` / `cadence` / `frequency` / optional `recAnchor` / `recTime` when the client rebuilds the URL after restore.

## One-time path

- **Guest-capable** through confirm for intake submit.
- **Review** requires a successful estimate snapshot (`preview-estimate` + locked snapshot) before continue.
- **Decision** offers one-time; choosing it sets `recurringIntent: { type: "one_time" }` and jumps to **confirm** (URL writes `bookingPath=one_time` plus schedule `frequency`).
- **Confirm** requires valid estimate snapshot and contact fields; submit calls `POST /api/v1/booking-direction-intake/submit` with DTO-allowed fields including optional **`bookingHandoff`**.

## Recurring path

- **Decision** allows recurring cadence selection **without** forcing login at that moment (URL immediately writes `bookingPath=recurring` and `cadence`).
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
      "selectedSlotLabel": "string | null",
      "selectedSlotDate": "string | null",
      "selectedSlotWindowStart": "ISO-8601 string | null",
      "selectedSlotWindowEnd": "ISO-8601 string | null",
      "selectedSlotFoId": "string (FranchiseOwner.id / cuid) | null",
      "selectedSlotSource": "preferred_provider | candidate_provider | null",
      "selectedSlotProviderLabel": "string | null",
      "holdId": "string | null",
      "holdExpiresAt": "ISO-8601 string | null",
      "slotHoldConfirmed": "boolean (optional)"
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
- **Ranking contract:** `services/api/src/modules/dispatch/provider-ranking.contract.ts` — explicit factor codes, weights, `RankedProviderCandidate`, and `RecommendationConfidence` (`high` | `medium` | `low`).
- **Ranking service:** `provider-ranking.service.ts` — `rankProviderCandidates` scores each active roster row deterministically (preferred cleaner and recurring continuity dominate; when handoff includes **FO + ISO slot window**, `exact_slot_match` / `exact_slot_conflict` adjust scores; schedule hints vs informational `FoSchedule` window labels add a weak positive; missing schedule windows apply a small negative). Tie-break: higher score then `cleanerId` ascending.
- **Evaluator:** `assignment-capacity.evaluator.ts` — `evaluateAssignmentCapacity`. The intake bridge passes a **real roster array** (possibly empty). Legacy rows may still omit `liveInputs` / have been evaluated before this drop; when `availableCleaners` is **omitted** in callers, roster ID checks are skipped. **Empty roster** → `needs_review` + `capacity_unknown` + `manual_review_required`. **`slot_selection` + `selectedSlotId` without `selectedSlotFoId` + ISO window pair** → `needs_review` + `slot_not_enforceable_yet` (opaque slot token only). **`slot_selection` with FO + `selectedSlotWindowStart` / `selectedSlotWindowEnd`** → intake evaluation records slot intent and verifies the FO is on the active roster; **operational** `scheduledStart` still depends on the customer JWT **`POST /bookings/availability/holds`** then **`POST /bookings/:id/confirm-hold`** after the booking shell exists (see “Availability / slot-hold API contract”). Hard preferred cleaner that **conflicts** with the selected-slot FO → `deferred` + `selected_slot_vs_hard_preferred_cleaner_conflict`. Selected FO missing from roster → `needs_review` + `selected_slot_provider_not_on_roster`. **`preference_only`** with roster and no preferred cleaner → **top scored** roster candidate is recommended when confidence is **medium** or **high**; **low** confidence (thin signals only) forces `needs_review` + `low_ranking_confidence` and **clears** the public recommendation while still persisting a **top-3** `rankedCandidates` snapshot for ops. Preferred cleaner IDs may match either franchise-owner id or `providerId` on a roster row. Recurring continuity uses `RecurringPlan.preferredFoId` when resolvable.
- **Persistence:** `BookingDirectionIntake.assignmentExecution` JSON (`{ constraints, evaluation, liveInputs }`). `liveInputs` holds a minimal roster snapshot and, for **recurring** path intakes, `recurringContinuityContext` when lookup succeeds. `evaluation` may include `recommendationConfidence`, `recommendationReasonSummary`, and `rankedCandidates` (bounded). **`Booking.notes`** also receives `--- SERVELINK_ASSIGNMENT_EXECUTION_JSON ---` after the handoff block when a booking is created.
- **Dispatch control:** Non-`assignable` outcomes set `BookingDispatchControl.reviewRequired` with `reviewSource=intake_assignment_capacity_v1` and reason codes embedded in `reviewReason` for command-center visibility.
- **Honesty:** `BOOKING_PRODUCT_CONTRACT.schedulingMode` is **`hybrid_slot_or_preference`**. Exact slot language is shown only when the handoff includes FO + ISO window (`slot_selection` with enforceable payload). Intake-time evaluation cannot replace post-submit hold/confirm; guests without a customer JWT cannot complete hold/confirm — the web submit path **downgrades** scheduling to `preference_only` on the wire when no token is present. Cleaner preference is evaluated against the **live roster** when the bridge runs; recurring continuity is **attempted** when customer + plan context exists — not promised on every path.

## Scheduling truth

- Exact slot selection is supported when **provider-backed windows** are returned (`GET /api/v1/bookings/availability/windows/aggregate` in the funnel; legacy single-FO `GET /api/v1/bookings/availability/windows` remains for direct per-FO callers), the customer selects a row that includes a concrete **`foId`**, and after intake creates a booking shell the same session can run **hold + confirm-hold** with a **customer JWT** (`POST /api/v1/bookings/availability/holds`, `POST /api/v1/bookings/:id/confirm-hold`). Holds are short-lived (see API service `HOLD_SECONDS`).
- **Preference-only** scheduling remains the explicit fallback when the aggregate returns no windows, the customer is not signed in, or hold/confirm fails (user is returned to the schedule step with fixed copy).
- **Confirm** distinguishes “Your selected arrival window” vs “Your timing preference” via `buildBookingDispatchHandoffSummary`.

## Multi-provider availability truth

- Slots may be sourced from **more than one eligible franchise owner** when `BookingAvailabilityAggregateService` fans out `SlotAvailabilityService.listAvailableWindows` per candidate FO.
- A **preferred FO** (optional `preferredFoId` query param, mirrored from funnel preferred cleaner id) is **prioritized** in candidate ordering and window sorting; if geo-filtered dispatch candidates exclude that FO, the service can still attach the preferred FO from the **roster** when it remains an active provider (honest “still try preferred” behavior — not a guarantee of dispatch eligibility).
- When no preferred FO is set, candidates still come from **real** active `FranchiseOwner` rows (roster path) or **dispatch-filtered** rows when `siteLat`, `siteLng`, `squareFootage`, and `estimatedLaborMinutes` are supplied on the aggregate query.
- Every selectable UI row maps to **one concrete `foId`** for hold creation — no generic slot pool.
- `BOOKING_PRODUCT_CONTRACT.availabilityScope` is **`multi_provider_candidates`**; the product remains **hybrid** with **preference-only** fallback.

## Multi-provider windows contract

- **`GET /api/v1/bookings/availability/windows`** (unchanged): requires **`foId`**; returns **only** `{ startAt, endAt }[]` for that franchise owner — **no embedded provider identity** in each window object (caller already knows `foId`). Capacity for that FO is implied by existing bookings + active holds inside `SlotAvailabilityService`. **No ZIP filter** in that service; dispatch geo filtering happens only when using the aggregate path with dispatch inputs.
- **`GET /api/v1/bookings/availability/windows/aggregate`**: `rangeStart`, `rangeEnd`, `durationMinutes` required; optional `preferredFoId` (**non-empty string**, matches real `FranchiseOwner.id` when set), optional `siteLat`/`siteLng`/`squareFootage`/`estimatedLaborMinutes`/`recommendedTeamSize`/`maxProviders`. Response: `{ mode: "preferred_provider_only" | "multi_provider_candidates", windows: ProviderBackedAvailabilityWindow[] }` where each window includes **`foId`**, **`source`** (`preferred_provider` \| `candidate_provider`), **`windowLabel`**, **`cleanerLabel`**, and ISO **`startAt`/`endAt`**. **Dedup policy:** identical start/end across two FOs remain **separate rows** so holds target the correct FO. **Sort:** preferred-provider windows first, then ascending `startAt`, then `foId`.
- **Holds / confirm-hold** unchanged: body still includes the selected window’s **`foId`**.

## Availability / slot-hold API contract

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/bookings/availability/windows/aggregate` | Customer JWT | Multi-provider fan-out + provider-backed windows (see “Multi-provider windows contract”). |
| `GET` | `/api/v1/bookings/availability/windows` | Customer JWT (`JwtAuthGuard` on `BookingsController`) | Query params (validated DTO): `foId` (**FranchiseOwner.id** string), `rangeStart`, `rangeEnd` (ISO-8601), `durationMinutes` (int ≥ 1). Response: **JSON array** of `{ startAt, endAt }` (ISO instants). |
| `POST` | `/api/v1/bookings/availability/holds` | Customer JWT | Body (`CreateSlotHoldDto`): `bookingId`, `foId` (both **cuid/string ids** matching persisted rows), `startAt`, `endAt` (ISO-8601). Booking must be **`pending_payment`** with **`estimatedHours` > 0** (intake-created shell). **Hold is created only after a booking row exists** (model B). Returns `BookingSlotHold` row including `id`, `expiresAt`. Wrong lifecycle → **`409 BOOKING_SLOT_HOLD_BOOKING_STATE_INVALID`**. |
| `POST` | `/api/v1/bookings/:id/confirm-hold` | Customer JWT | Body: `{ holdId, note? }`. Optional header `idempotency-key`. Confirms booking from validated non-expired hold while booking is **`pending_payment`** (then transitions to **`assigned`** with `scheduledStart` from the hold). **Application-level** idempotent replay (same header + booking) returns `{ ..., alreadyApplied: true }` via `BookingEvent` — the route opts out of the generic HTTP idempotency response cache so this contract is not masked. May return `BOOKING_SLOT_HOLD_EXPIRED`, `BOOKING_CONFIRMATION_STATE_INVALID` (e.g. booking never in `pending_payment`), etc. |

**Fallback policy:** If any prerequisite fails (guest session, window list empty, duration mismatch vs locked estimate snapshot, overlap, eligibility), the funnel keeps **preference-only** intent and surfaces the exact user-facing strings for expired hold vs other reservation failures on the confirm action.

## Scheduling contract

- **Legacy wire columns:** `frequency` + `preferredTime` on the intake DTO (unchanged).
- **Funnel state:** `scheduleSelection` (`ScheduleSelection` in `bookingFlowTypes.ts`).
- **Runtime product labels:** `BOOKING_PRODUCT_CONTRACT.schedulingMode` → **`hybrid_slot_or_preference`**; `availabilityScope` → **`multi_provider_candidates`** (`bookingProductContract.ts`). Persisted `bookingHandoff.scheduling.mode` remains **`preference_only` | `slot_selection`** per API DTO, with optional `selectedSlotSource` / `selectedSlotProviderLabel` on slot-backed submits.
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
- **`/admin/booking-direction-intakes`:** **Handoff** summary plus **Assignment**, **Reason codes**, **Continuity / pref**, and **Live execution** (recommended cleaner, preferred-match / continuity flags, roster count from `liveInputs`) when the bridge has run; API returns full JSON per row. The **Schedule** column also surfaces **slot-backed vs preference-only** detail from `bookingHandoff.scheduling` (mode, window label/ISO, **`selectedSlotSource`**, provider label, optional `holdId` prefix when present on the handoff JSON).
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
| Schedule hybrid (guest + mocked customer aggregate) | `booking-schedule-hybrid-ui.spec.ts` |

## Recovered roster / availability sources

| Backend path | What it provides |
|--------------|------------------|
| `services/api/src/modules/dispatch/dispatch-candidate.service.ts` | Active `FranchiseOwner` + `ServiceProvider` roster with geo/capacity **filters** for dispatch candidate ranking (booking-shaped input). |
| `services/api/src/modules/dispatch/roster-availability.service.ts` | Canonical **unfiltered** active FO + provider list for assignment evaluation; optional `FoSchedule` windows per FO (informational weekly windows, same table as `FoScheduleService`). |
| `services/api/prisma/schema.prisma` — `FranchiseOwner`, `ServiceProvider`, `FoSchedule`, `FoBlockout` | Active roster eligibility (`status`, `safetyHold`, `providerId`); linked provider display names; per-FO weekly schedule rows; blockouts (not yet driving intake evaluator rules). |
| `services/api/prisma/schema.prisma` — `BookingSlotHold` | Slot holds tied to `bookingId` + `foId` — used by public funnel **after** intake booking creation when JWT hold + confirm succeeds. |
| `services/api/prisma/schema.prisma` — `RecurringPlan.preferredFoId` | Continuity anchor for recurring customers when email resolves to a user with an active plan. |
| `services/api/src/modules/dispatch/provider-dispatch-resolver.service.ts` | `providerId` ↔ `foId` resolution for active franchise owners. |

## Recovered existing system surfaces

| Path | Role |
|------|------|
| `apps/web/.../bookingDirectionIntakeApi.ts` + `bookingIntakePayload.ts` | Preview (minimal) / submit payloads; submit includes **`bookingHandoff`**. |
| `apps/web/.../bookingDispatchHandoff.ts` | Confirm summaries + **`buildBookingHandoffPayloadForIntakeSubmit`**. |
| `apps/web/.../BookingFlowClient.tsx` | Step machine, preview guard, recurring vs one-time submit. |
| `apps/web/.../BookingStepSchedule.tsx` | Hybrid schedule: optional live windows (`bookingAvailabilityApi`) + preference fallback + `BookingStepCleanerPreference`. |
| `apps/web/.../bookingAvailabilityApi.ts` | Typed client for availability windows + hold + confirm-hold (customer JWT via `apiFetch`). |
| `apps/web/.../bookingRecurringApi.ts` | Customer recurring HTTP client + documented routes. |
| `services/api/.../booking-direction-intake/*` | Intake DTO (incl. `bookingHandoff`), persistence, bridge to `Booking`. |
| `services/api/.../slot-holds/*` | Slot availability + holds; wired from web funnel after booking shell exists (JWT). |
| `services/api/.../bookings/booking-availability-aggregate.service.ts` | Multi-provider windows aggregation for `GET .../availability/windows/aggregate`. |
| `services/api/.../recurring/*` | Recurring plan CRUD, ops summary, `preferredFoId` on plan DTOs. |
| `apps/web/.../admin/ops/recurring/page.tsx` | Operator recurring dashboard shell. |

---

_Last updated: multi-provider aggregate windows (`GET .../availability/windows/aggregate`) with hybrid preference fallback and provider-backed holds._
