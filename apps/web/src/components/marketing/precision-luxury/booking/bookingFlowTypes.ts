export type BookingStepId =
  | "service"
  | "home"
  | "location"
  | "schedule"
  | "review";

export enum CustomerIntent {
  RESET = "RESET",
  MAINTAIN = "MAINTAIN",
  TOP_UP = "TOP_UP",
  TRANSACTIONAL = "TRANSACTIONAL",
}

/** Anonymous /book surface only — recurring is a gated auth handoff, not an intake path. */
export type BookingPublicPath =
  | "one_time_cleaning"
  | "first_time_with_recurring"
  | "move_transition"
  | "recurring_auth_gate";

/** First-time cleaning only — after a live estimate is shown (review step). */
export type BookingFirstTimePostEstimateVisitChoice =
  | ""
  | "one_visit"
  | "three_visit_reset";

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

/** Layer 1 — baseline home facts (structured; maps into `EstimateFactorsDto`). */
export type BookingHalfBathroomsKey = "0" | "1" | "2_plus";
export type BookingIntakeFloors = "1" | "2" | "3_plus";
export type BookingIntakeStairsFlights = "none" | "one" | "two_plus" | "not_sure";
export type BookingFloorMix = "mostly_hard" | "mixed" | "mostly_carpet";
export type BookingLayoutType = "open_plan" | "mixed" | "segmented";
export type BookingOccupancyLevel = "ppl_1_2" | "ppl_3_4" | "ppl_5_plus";
export type BookingChildrenInHome = "yes" | "no";
export type BookingPetImpactLevel = "none" | "light" | "heavy";

/** Layer 2 — labor multipliers. */
export type BookingOverallLaborCondition =
  | "recently_maintained"
  | "normal_lived_in"
  | "behind_weeks"
  | "major_reset";
export type BookingKitchenIntensity = "light_use" | "average_use" | "heavy_use";
export type BookingBathroomComplexity =
  | "standard"
  | "moderate_detailing"
  | "heavy_detailing";
export type BookingClutterAccess = "mostly_clear" | "moderate_clutter" | "heavy_clutter";
export type BookingSurfaceDetailToken =
  | "interior_glass"
  | "heavy_mirrors"
  | "built_ins"
  | "detailed_trim"
  | "many_touchpoints";

/** Layer 3 — expectation / reset signals. */
export type BookingPrimaryIntent =
  | "maintenance_clean"
  | "detailed_standard"
  | "reset_level";
export type BookingLastProCleanRecency =
  | "within_30_days"
  | "days_30_90"
  | "days_90_plus"
  | "unknown_or_not_recently";
export type BookingFirstTimeVisitProgram = "one_visit" | "two_visit" | "three_visit";
export type BookingRecurringCadenceIntent =
  | "weekly"
  | "every_10_days"
  | "biweekly"
  | "monthly"
  | "none";

export type BookingRecurringInterestCadence =
  | "weekly"
  | "every_10_days"
  | "biweekly"
  | "monthly"
  | "not_sure";

export type BookingRecurringInterest = {
  interested: boolean;
  cadence?: BookingRecurringInterestCadence;
  note?: string;
};

export type BookingAvailableTeamOption = {
  id: string;
  displayName: string;
  isRecommended?: boolean;
};

export type BookingFlowState = {
  step: BookingStepId;
  serviceId: string;
  /** Client-only booking intent signal; not persisted to backend yet. */
  intent?: CustomerIntent;
  /** Drives public step-1 cards, recurring gate, and copy — not sent as its own API field. */
  bookingPublicPath: BookingPublicPath;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  /** Legacy URL/radios — kept for compatibility; estimator payload uses layered intake. */
  condition: BookingHomeCondition;
  /** Controlled multi-select; sorted when sent for stable request keys. */
  problemAreas: BookingProblemAreaToken[];
  /** Furnishings / layout density for visit planning. */
  surfaceComplexity: BookingSurfaceComplexity;
  /** How much ground each visit should cover (defaults to full-home refresh). */
  scopeIntensity: BookingScopeIntensity;
  /** Controlled add-ons only; normalized when patched or parsed. */
  selectedAddOns: BookingAddOnToken[];
  /** Intent-aware enhancement selections submitted as safe capture data. */
  selectedUpsellIds: string[];
  /** Optional recurring service interest; capture only, not a recurring contract. */
  recurringInterest?: BookingRecurringInterest;
  /**
   * Public anonymous funnel always stores one-time; recurring cadence belongs in
   * `/customer` after login. Kept for payload compatibility with direction intake.
   */
  frequency: BookingFrequencyOption | "";
  /** Empty until user selects a valid option (URL/parser may omit). */
  preferredTime: BookingTimeOption | "";
  /** Set when `serviceId` is deep clean; otherwise "". Driven from review after estimate for first-time. */
  deepCleanProgram: BookingDeepCleanProgramChoice | "";
  /** Service area — collected before review/estimate in the anonymous funnel. */
  serviceLocationZip: string;
  /** Street address (required for anonymous progression). */
  serviceLocationStreet: string;
  serviceLocationCity: string;
  serviceLocationState: string;
  /** Apt / suite / unit (optional). */
  serviceLocationUnit: string;
  /** Legacy single line; migrated from URL `locAddr` when structured fields are empty. */
  serviceLocationAddressLine: string;
  /** Opening clean structure — chosen only after estimate is ready on review. */
  firstTimePostEstimateVisitChoice: BookingFirstTimePostEstimateVisitChoice;
  halfBathrooms: BookingHalfBathroomsKey;
  intakeFloors: BookingIntakeFloors;
  intakeStairsFlights: BookingIntakeStairsFlights;
  floorMix: BookingFloorMix;
  layoutType: BookingLayoutType;
  occupancyLevel: BookingOccupancyLevel;
  childrenInHome: BookingChildrenInHome;
  petImpactLevel: BookingPetImpactLevel;
  overallLaborCondition: BookingOverallLaborCondition;
  kitchenIntensity: BookingKitchenIntensity;
  bathroomComplexity: BookingBathroomComplexity;
  clutterAccess: BookingClutterAccess;
  surfaceDetailTokens: BookingSurfaceDetailToken[];
  primaryIntent: BookingPrimaryIntent;
  lastProCleanRecency: BookingLastProCleanRecency;
  firstTimeVisitProgram: BookingFirstTimeVisitProgram;
  recurringCadenceIntent: BookingRecurringCadenceIntent;
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
  availableWindows: {
    slotId?: string;
    startAt: string;
    endAt: string;
    durationMinutes?: number;
  }[];
  selectedTeamId: string;
  selectedTeamDisplayName: string;
  selectedSlotId: string;
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
