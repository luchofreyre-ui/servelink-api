import { ConflictException } from "@nestjs/common";
import { MIN_DURATION_MINUTES } from "../crew-capacity/assigned-crew-and-duration";

/** Upper bound for a single slot window (sanity / corruption guard). */
const MAX_HOLD_DURATION_MINUTES = 24 * 60;

/**
 * Validates that the slot hold window is acceptable for confirmation.
 *
 * - **Legacy** (`useHoldElapsedDurationModel` false/undefined): hold wall time must match
 *   `Math.round(estimatedHours * 60)` (historical booking + hold agreement).
 * - **Public crew-adjusted** (`true`): hold `startAt`/`endAt` are the scheduling truth from
 *   the same path that created the hold; only positivity + sane bounds are enforced.
 */
export function assertConfirmHoldSlotDuration(args: {
  useHoldElapsedDurationModel: boolean | undefined;
  holdDurationMinutes: number;
  bookingDurationMinutesFromEstimatedHours: number;
}): void {
  const holdMin = args.holdDurationMinutes;
  if (!Number.isFinite(holdMin) || holdMin < 1) {
    throw new ConflictException("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
  }

  if (args.useHoldElapsedDurationModel === true) {
    if (holdMin < MIN_DURATION_MINUTES) {
      throw new ConflictException("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
    }
    if (holdMin > MAX_HOLD_DURATION_MINUTES) {
      throw new ConflictException("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
    }
    return;
  }

  if (holdMin !== args.bookingDurationMinutesFromEstimatedHours) {
    throw new ConflictException("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
  }
}
