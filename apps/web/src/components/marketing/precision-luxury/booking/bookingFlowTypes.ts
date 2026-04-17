export type BookingStepId = "service" | "home" | "schedule" | "review";

/** Client-only preview planning band (no scores or backend certainty). */
export type BookingPreviewConfidenceBand =
  | "high_clarity"
  | "customized"
  | "special_attention";

export type BookingServiceOption = {
  id: string;
  title: string;
  body: string;
  meta: string;
};

export type BookingFrequencyOption = "Weekly" | "Bi-Weekly" | "Monthly" | "One-Time";

export type BookingTimeOption =
  | "Weekday Morning"
  | "Weekday Afternoon"
  | "Friday"
  | "Saturday";

/** Public deep clean product; empty when service is not deep clean. */
export type BookingDeepCleanProgramChoice = "single_visit" | "phased_3_visit";

/** Estimator depth — home visit context (Step 2). */
export type BookingHomeCondition =
  | "light_upkeep"
  | "standard_lived_in"
  | "heavy_buildup"
  | "move_in_out_reset";

export type BookingProblemAreaToken =
  | "kitchen_grease"
  | "bathroom_buildup"
  | "pet_hair"
  | "heavy_dust";

export type BookingSurfaceComplexity =
  | "minimal_furnishings"
  | "average_furnishings"
  | "dense_layout";

/** Breadth of work requested on the visit (Step 2 estimator depth). */
export type BookingScopeIntensity =
  | "targeted_touch_up"
  | "full_home_refresh"
  | "detail_heavy";

/** Controlled add-on tokens only — stable for URL + preview keys. */
export type BookingAddOnToken =
  | "inside_fridge"
  | "inside_oven"
  | "interior_windows"
  | "baseboards_detail"
  | "cabinets_detail";

/** Deep-clean service — where effort should concentrate (Step 2, deep service only). */
export type BookingDeepCleanFocus =
  | "whole_home_reset"
  | "kitchen_bath_priority"
  | "high_touch_detail";

/** Move transition service — occupancy shape (Step 2, move-in/move-out only). */
export type BookingTransitionState =
  | "empty_home"
  | "lightly_furnished"
  | "fully_furnished";

/** Move transition — appliances to plan into the visit (controlled tokens). */
export type BookingAppliancePresenceToken =
  | "refrigerator_present"
  | "oven_present"
  | "dishwasher_present"
  | "washer_dryer_present";

export type BookingAvailableTeamOption = {
  id: string;
  displayName: string;
  isRecommended?: boolean;
};

export type BookingFlowState = {
  step: BookingStepId;
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  /** How lived-in the home feels before we arrive (defaults to standard). */
  condition: BookingHomeCondition;
  /** Controlled multi-select; sorted when sent for stable request keys. */
  problemAreas: BookingProblemAreaToken[];
  /** Furnishings / layout density for visit planning. */
  surfaceComplexity: BookingSurfaceComplexity;
  /** How much ground each visit should cover (defaults to full-home refresh). */
  scopeIntensity: BookingScopeIntensity;
  /** Controlled add-ons only; normalized when patched or parsed. */
  selectedAddOns: BookingAddOnToken[];
  /** Empty until user selects a valid option (URL/parser may omit). */
  frequency: BookingFrequencyOption | "";
  /** Empty until user selects a valid option (URL/parser may omit). */
  preferredTime: BookingTimeOption | "";
  /** Set when `serviceId` is deep clean; otherwise "". */
  deepCleanProgram: BookingDeepCleanProgramChoice | "";
  /** Deep-clean service only; ignored in UI/intake for other services. */
  deepCleanFocus: BookingDeepCleanFocus;
  /** Move-in/move-out service only; ignored in UI/intake for other services. */
  transitionState: BookingTransitionState;
  /** Move-in/move-out only; normalized when patched or parsed. */
  appliancePresence: BookingAppliancePresenceToken[];
  /**
   * Contact capture for the funnel (Phase 3). Intentionally not mirrored in URL
   * query params to avoid leaking PII through referrers and server logs.
   */
  customerName: string;
  customerEmail: string;
  /** After review intake submit succeeds — public scheduling uses this booking id. */
  schedulingBookingId: string;
  schedulingIntakeId: string;
  /** Ranked team options from `public_booking_team_options` (max 2). */
  availableTeams: BookingAvailableTeamOption[];
  /** Open slots for the selected team (from `public_booking_team_availability`). */
  availableWindows: { startAt: string; endAt: string }[];
  selectedTeamId: string;
  selectedTeamDisplayName: string;
  selectedSlotStart: string;
  selectedSlotEnd: string;
  publicHoldId: string;
  /** True after public hold + confirm succeeds. */
  schedulingConfirmed: boolean;
};

export type BookingStepDefinition = {
  id: BookingStepId;
  order: number;
  label: string;
};
