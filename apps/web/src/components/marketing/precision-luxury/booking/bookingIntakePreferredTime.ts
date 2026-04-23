/**
 * Public funnel no longer collects arrival preference before estimate.
 * Payload/API still require a non-empty string — use this neutral sentinel.
 */
export const BOOKING_INTAKE_PREFERRED_TIME_DEFERRED =
  "Deferred to team scheduling after estimate";
