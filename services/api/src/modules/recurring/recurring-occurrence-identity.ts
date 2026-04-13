/** Prefix stored in occurrence.generationError when booking exists but DB finalize failed. */
export const BOOKING_FINALIZE_ERROR_PREFIX =
  "BOOKING_CREATED_BUT_OCCURRENCE_FINALIZE_FAILED:" as const;

/** Substring included in booking.notes for idempotent duplicate detection. */
export const BOOKING_NOTE_FINGERPRINT_KEY = "recurringFp" as const;

export function buildOccurrenceBookingFingerprint(input: {
  recurringPlanId: string;
  occurrenceId: string;
  customerId: string;
  targetDateIso: string;
  serviceType: string;
}): string {
  return `recurring:${input.recurringPlanId}:occurrence:${input.occurrenceId}:target:${input.targetDateIso}:service:${input.serviceType}:customer:${input.customerId}`;
}

export function formatBookingNoteWithFingerprint(
  baseNote: string,
  fingerprint: string,
): string {
  return `${baseNote} | ${BOOKING_NOTE_FINGERPRINT_KEY}=${fingerprint}`;
}

export function parseBookingIdFromFinalizeError(
  generationError: string | null | undefined,
): string | null {
  if (!generationError?.includes(BOOKING_FINALIZE_ERROR_PREFIX)) {
    return null;
  }
  const rest = generationError
    .split(BOOKING_FINALIZE_ERROR_PREFIX)
    .pop()
    ?.trim();
  return rest && rest.length > 0 ? rest : null;
}
