/** Small operational taxonomy — persisted via BookingEvent NOTE or intake.funnelMilestones only. */
export const PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS = [
  "REVIEW_VIEWED",
  "REVIEW_ABANDONED",
  "DEPOSIT_UI_REACHED",
  "DEPOSIT_SUBMIT_INITIATED",
  "DEPOSIT_SUCCEEDED",
  "BOOKING_REENTRY",
  "RECURRING_CADENCE_SELECTED",
] as const;
