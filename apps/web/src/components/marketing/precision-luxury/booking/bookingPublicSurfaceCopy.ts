import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingDeepCleanFocus,
  BookingDeepCleanProgramChoice,
  BookingFrequencyOption,
  BookingHomeCondition,
  BookingProblemAreaToken,
  BookingScopeIntensity,
  BookingSurfaceComplexity,
  BookingTimeOption,
  BookingTransitionState,
} from "./bookingFlowTypes";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";

export const BOOKING_CONFIRMATION_REQUEST_SECTION_TITLE = "What you shared";

/** `/book/confirmation` — booking record + estimate figures present (from existing query shape). */
export const BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED =
  "Your booking is saved";

/** `/book/confirmation` — request received without the full saved-booking bundle. */
export const BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED =
  "We have your request";

/** No credible handoff from this device—address bar may have dropped details or this is a fresh visit. */
export const BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY =
  "Pick up where you left off";

export const BOOKING_CONFIRMATION_INTRO_NEUTRAL_REENTRY =
  "This screen usually appears right after you send a request. If you refreshed, used a bookmark, or arrived here without the usual details, we can’t safely show a finished summary from here alone.";

export const BOOKING_CONFIRMATION_NEXT_STEPS_NEUTRAL_REENTRY =
  "Head back to booking to continue a request or start a new one—we’ll guide you through the same calm steps.";

/** Primary control returning to the live funnel (clears local continuity on click in the client). */
export const BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA = "Return to booking";

/** Confirmation → `/book` — explicit new attempt (replaces generic “New booking” label). */
export const BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA = "Start a new booking";

/** Short tooltip-style hint: fresh form vs. retrying the same send from review. */
export const BOOKING_CONFIRMATION_BEGIN_FRESH_REQUEST_TITLE =
  "Begins a clean request—your previous answers stay on the last screen only.";

export const BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_LEAD =
  "The estimate below reflects what you just confirmed with us.";
export const BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_DETAIL =
  "Final pricing and visit timing are set when we follow up by email—nothing on this page alone schedules your first visit.";

export const BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_LEAD =
  "Your preferences and contact path are on file with Servelink.";
export const BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_DETAIL =
  "We could not finish every automated step in one go, but your details are not lost—our team continues from here.";

export const BOOKING_CONFIRMATION_NEXT_STEPS_BOOKING_SAVED =
  "Watch the inbox you used on the previous step—we may ask a brief follow-up before we lock timing. You can also start a fresh booking note if your home or cadence changes meaningfully.";

export const BOOKING_CONFIRMATION_NEXT_STEPS_REQUEST_RECEIVED =
  "We read what you sent and reply from the email you provided. If something urgent changed, mention it when we write—you do not need to resend this entire form unless your needs are materially different.";

/** Server-reported codes already passed through the confirmation URL today. */
export function bookingConfirmationNoticeForBookingErrorCode(
  code: string,
): string {
  switch (code.trim()) {
    case "ESTIMATE_EXECUTION_FAILED":
      return "We saved your preferences, but couldn’t finalize an automated quote yet. Our team will reach out with pricing.";
    case "ESTIMATE_INPUT_INVALID":
      return "We saved your preferences. A few details need a quick review—our team will follow up to finish your quote.";
    case "BOOKING_CREATE_FAILED":
      return "We saved your request, but couldn’t finish creating the live booking in one step. Our team will still follow up with next steps.";
    default:
      return "We saved your request. One step didn’t complete automatically—our team will follow up with next steps.";
  }
}

/** Recoverable submit failure — user stays on review; selections preserved. */
export const BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD =
  "We couldn’t send that just now.";
export const BOOKING_REVIEW_SUBMIT_RECOVERY_HINT =
  "Your details are still here. Try again in a moment, or adjust something small on the steps behind you and send once more.";

/** Step 4 banner while a recoverable send failure is showing below. */
export const BOOKING_REVIEW_BANNER_AFTER_SEND_DID_NOT_FINISH =
  "Sending didn’t finish, so we’re not treating this as submitted yet. Your selections stay put—try again when you’re ready.";

export const BOOKING_REVIEW_SUBMIT_TRY_AGAIN = "Try sending again";

/** Step 4 — while the live quote is catching up to the latest selections. */
export const BOOKING_REVIEW_ESTIMATE_REFRESHING_TITLE = "Refreshing your quote";
export const BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY =
  "We’re updating pricing and visit planning for your latest selections—usually just a moment.";

/** Step 4 — preview could not be produced for the current inputs. */
export const BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD =
  "We couldn’t show a live quote for these details yet.";
export const BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_HINT =
  "Adjust the selections above or try again shortly—we’ll show a fresh preview when it’s ready.";

/** Step 4 — preview finished but no figures returned. */
export const BOOKING_REVIEW_ESTIMATE_NONE_AFTER_FETCH =
  "No preview is available for this combination yet. Try small changes to home or schedule, or send your request and we’ll follow up personally.";

/** Submit control — disabled states (no jargon). */
export const BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING =
  "Wait for refreshed quote…";
export const BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_NEEDS_ATTENTION =
  "Preview needed to send";
export const BOOKING_REVIEW_SUBMIT_AFTER_DETAILS_CHANGE =
  "Refresh quote to send";
export const BOOKING_REVIEW_SUBMIT_ADD_CONTACT_FIRST =
  "Add contact details to continue";

/** Shown on earlier steps as a gentle continuity cue (no jargon). */
export const BOOKING_STEP_EDIT_CONTINUITY_HINT =
  "When you return to review, we refresh your quote from these details.";

export function bookingConfirmationDeepPlanEchoLabel(
  program: BookingDeepCleanProgramChoice,
): string {
  return program === "phased_3_visit"
    ? "3-visit deep clean program"
    : "One-visit deep clean";
}

/** Home step — cadence still feeds the estimator before you pick a team and time. */
export const BOOKING_HOME_CADENCE_SECTION_TITLE = "Service cadence";

export const BOOKING_HOME_CADENCE_SECTION_BODY =
  "How often you’d like visits, and the part of day that usually works for arrivals. You’ll pick a team and a concrete arrival time on the next step.";

/** Step 4 — scheduling: team, arrival window, final confirm (web shell). */
export const BOOKING_SCHEDULE_PAGE_TITLE = "Schedule your visit";

export const BOOKING_SCHEDULE_PAGE_LEAD =
  "You choose your team, then a concrete arrival time. Your booking is confirmed only after the final step below.";

export const BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE = "Choose your team";

export const BOOKING_SCHEDULE_TEAM_SUPPORT_LINE =
  "We’ve selected the best teams available for your home and service.";

export const BOOKING_SCHEDULE_CHOOSE_TEAM_LEAD =
  "Up to two teams you can book with here. Pick one to see only their open times—never mixed across teams.";

export const BOOKING_SCHEDULE_TEAM_CARD_RECOMMENDED_BODY =
  "Recommended — strong fit for this visit based on your details.";

export const BOOKING_SCHEDULE_TEAM_CARD_BODY =
  "Available for your visit. You choose your team; scheduling stays with that team.";

export const BOOKING_SCHEDULE_RECOMMENDED_BADGE = "Recommended";

export const BOOKING_SCHEDULE_TEAMS_LOADING = "Finding the best teams for you…";

export const BOOKING_SCHEDULE_TEAMS_LOADING_STILL =
  "Still working… this can take a moment.";

export const BOOKING_SCHEDULE_WINDOWS_LOADING = "Loading open times for this team…";

export const BOOKING_SCHEDULE_WINDOWS_LOADING_STILL =
  "Still loading times… this can take a moment.";

export const BOOKING_SCHEDULE_CHOOSE_TEAM_HINT =
  "Select a team to see only their open arrival windows.";

export const BOOKING_SCHEDULE_SLOT_CARD_BODY =
  "Arrival window for your selected team.";

export const BOOKING_SCHEDULE_NO_TEAMS =
  "No teams are available to schedule online for this request yet. You can still save your direction—we’ll follow up by email with next steps.";

export const BOOKING_SCHEDULE_ZERO_TEAMS_TITLE = "No teams available right now";

export const BOOKING_SCHEDULE_ZERO_TEAMS_BODY =
  "We couldn’t find availability for your request at the moment. You can adjust your details or we’ll follow up with options.";

export const BOOKING_SCHEDULE_ZERO_TEAMS_ADJUST_CTA = "Adjust details";

export const BOOKING_SCHEDULE_ZERO_TEAMS_CONTINUE_CTA = "Continue anyway";

export const BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_TITLE = "We couldn’t load teams";

export const BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_BODY =
  "Check your connection and try again, or adjust your details and save again from review.";

export const BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE = "No times available for this team";

export const BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_BODY =
  "Try the other available team or adjust your details.";

export const BOOKING_SCHEDULE_NO_SLOTS_TRY_OTHER_TEAM_CTA = "Switch team";

export const BOOKING_SCHEDULE_NO_SLOTS_BACK_TO_REVIEW_CTA = "Back to review";

export const BOOKING_SCHEDULE_HOLD_FAILED =
  "That time is no longer available. Please choose another time.";

export const BOOKING_SCHEDULE_HOLD_FAILED_HINT =
  "Open times for this team were refreshed—pick another window below.";

export const BOOKING_SCHEDULE_CONFIRM_FAILED =
  "We couldn’t finalize your booking. Please try again.";

export const BOOKING_SCHEDULE_RETRY_CONFIRM_CTA = "Try again";

export const BOOKING_SCHEDULE_CHOOSE_DIFFERENT_TIME_CTA = "Choose a different time";

export const BOOKING_SCHEDULE_SLOTS_TITLE = "Choose your arrival time";

export const BOOKING_SCHEDULE_SLOTS_LEAD =
  "These openings are for your selected team only. Pick one window before you confirm.";

export const BOOKING_SCHEDULE_SLOTS_EMPTY =
  "No open times in this range for this team. Try another team or we’ll help you find a time by email.";

export const BOOKING_SCHEDULE_CHOOSE_SLOT_HINT =
  "Choose an arrival window above to enable confirmation.";

export const BOOKING_SCHEDULE_SUMMARY_TITLE = "Your booking";

export const BOOKING_SCHEDULE_SUMMARY_TEAM_LABEL = "Team";

export const BOOKING_SCHEDULE_SUMMARY_ARRIVAL_LABEL = "Arrival";

export const BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA = "Confirm your booking";

/** @deprecated Use BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA */
export const BOOKING_SCHEDULE_CONFIRM_ARRIVAL_CTA = BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA;

export const BOOKING_SCHEDULE_CONFIRMING = "Confirming your booking…";

export const BOOKING_REVIEW_SELECTED_TEAM_LABEL = "Selected team";

export const BOOKING_REVIEW_SELECTED_ARRIVAL_LABEL = "Requested arrival";

/** Cadence timing (home + review) — not the concrete booked arrival slot. */
export const BOOKING_CADENCE_ARRIVAL_WINDOW_LABEL = "Typical arrival window";

export const BOOKING_REVIEW_SAVE_AND_SCHEDULE_CTA = "See available teams";

export const BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA = BOOKING_REVIEW_SAVE_AND_SCHEDULE_CTA;

export const BOOKING_REVIEW_SUBMIT_SAVING = "Saving your details…";

export const BOOKING_REVIEW_STEP_TITLE = "Review your direction & quote";

export const BOOKING_REVIEW_STEP_BODY =
  "Confirm your home details and preview look right. This saves your request and shows teams you can book with—not the final booking yet.";

export const BOOKING_REVIEW_NEXT_SCHEDULE_TITLE = "Next: choose your team and arrival time";

export const BOOKING_REVIEW_NEXT_SCHEDULE_BODY =
  "You’ll see the best teams available for your home, then pick a time that works for you.";

export const BOOKING_REVIEW_BANNER_READY_NEXT_STEP =
  "You’re ready for the next step: pick your team and arrival time.";

export const BOOKING_REVIEW_SCHEDULE_NOTE =
  "After you continue, you’ll choose your team and a concrete arrival time.";

export function frequencyCardBody(
  serviceId: string,
  frequency: BookingFrequencyOption,
): string {
  if (isDeepCleaningBookingServiceId(serviceId)) {
    if (frequency === "One-Time") {
      return "A single intensive visit—common before hosting, listing prep, or a seasonal reset.";
    }
    return "Most deep cleans stay occasional; pick the rhythm that matches how you use the home.";
  }

  switch (frequency) {
    case "Weekly":
      return "Keeps presentation consistent with the shortest gap between visits.";
    case "Bi-Weekly":
      return "A balanced cadence for busy homes that still want a steady baseline.";
    case "Monthly":
      return "Light-touch maintenance between deeper resets or seasonal work.";
    case "One-Time":
      return "A focused visit when you need a reset without an ongoing plan.";
  }
}

export function timingCardBody(time: BookingTimeOption): string {
  switch (time) {
    case "Weekday Morning":
      return "Arrivals in the earlier weekday window.";
    case "Weekday Afternoon":
      return "Midday or afternoon weekday arrivals.";
    case "Friday":
      return "End-of-week scheduling when you want the home ready for the weekend.";
    case "Saturday":
      return "Weekend-friendly timing for busier weekday households.";
  }
}

/** Step 2 — visit context (estimator depth, Phase 1). */
export const BOOKING_STEP2_VISIT_CONTEXT_SECTION_TITLE = "How the home shows up";
export const BOOKING_STEP2_VISIT_CONTEXT_SECTION_BODY =
  "Honest signals help us size time and attention so the first visit matches the work ahead—never to judge.";

export const BOOKING_STEP2_CONDITION_SECTION_TITLE = "Overall condition";
export const BOOKING_STEP2_PROBLEM_AREAS_SECTION_TITLE = "Where time tends to collect";
export const BOOKING_STEP2_PROBLEM_AREAS_HELPER =
  "Select any that apply—optional, but it sharpens your preview.";
export const BOOKING_STEP2_SURFACE_SECTION_TITLE = "Furnishings & layout";

/** Step 2 — scope intensity + add-ons (estimator depth Phase 3). */
export const BOOKING_STEP2_SCOPE_INTENSITY_SECTION_TITLE = "How much we cover";
export const BOOKING_STEP2_SCOPE_INTENSITY_SECTION_BODY =
  "Set the breadth of this visit—separate from condition and layout signals below.";
export const BOOKING_STEP2_ADDONS_SECTION_TITLE = "Add-ons";
export const BOOKING_STEP2_ADDONS_SECTION_HELPER =
  "Optional focused tasks—each adds its own pocket of work.";

export const BOOKING_SCOPE_INTENSITY_LABELS: Record<
  BookingScopeIntensity,
  string
> = {
  targeted_touch_up: "Targeted touch-up",
  full_home_refresh: "Full-home refresh",
  detail_heavy: "Detail-heavy reset",
};

export const BOOKING_ADD_ON_LABELS: Record<BookingAddOnToken, string> = {
  inside_fridge: "Inside fridge",
  inside_oven: "Inside oven",
  interior_windows: "Interior windows",
  baseboards_detail: "Baseboards detail",
  cabinets_detail: "Cabinets detail",
};

/** Step 2 — deep-clean service only (Phase 4). */
export const BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_TITLE = "Deep-clean focus";
export const BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_BODY =
  "Tell us where you want the deepest attention on this reset visit.";

export const BOOKING_DEEP_CLEAN_FOCUS_LABELS: Record<BookingDeepCleanFocus, string> =
  {
    whole_home_reset: "Whole-home reset",
    kitchen_bath_priority: "Kitchen & bath priority",
    high_touch_detail: "High-touch detail",
  };

/** Step 2 — move-in/move-out service only (Phase 4). */
export const BOOKING_STEP2_TRANSITION_SETUP_SECTION_TITLE = "Home transition setup";
export const BOOKING_STEP2_TRANSITION_SETUP_SECTION_BODY =
  "How the home is staged before we arrive shapes time on floors, surfaces, and detail.";

export const BOOKING_TRANSITION_STATE_LABELS: Record<BookingTransitionState, string> =
  {
    empty_home: "Empty home",
    lightly_furnished: "Lightly furnished",
    fully_furnished: "Fully furnished",
  };

export const BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_TITLE =
  "Appliances to include";
export const BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_HELPER =
  "Select what should be part of this visit’s scope.";

export const BOOKING_APPLIANCE_PRESENCE_LABELS: Record<
  BookingAppliancePresenceToken,
  string
> = {
  refrigerator_present: "Refrigerator",
  oven_present: "Oven",
  dishwasher_present: "Dishwasher",
  washer_dryer_present: "Washer & dryer",
};

export const BOOKING_HOME_CONDITION_LABELS: Record<BookingHomeCondition, string> =
  {
    light_upkeep: "Light upkeep",
    standard_lived_in: "Standard lived-in",
    heavy_buildup: "Heavy buildup",
    move_in_out_reset: "Move-in / move-out reset",
  };

export const BOOKING_PROBLEM_AREA_LABELS: Record<BookingProblemAreaToken, string> =
  {
    kitchen_grease: "Kitchen grease",
    bathroom_buildup: "Bathroom buildup",
    pet_hair: "Pet hair",
    heavy_dust: "Heavy dust",
  };

export const BOOKING_SURFACE_COMPLEXITY_LABELS: Record<
  BookingSurfaceComplexity,
  string
> = {
  minimal_furnishings: "Minimal furnishings",
  average_furnishings: "Average furnishings",
  dense_layout: "Dense layout",
};

/** Step 4 review — estimator depth rows (aligned with Step 2 semantics). */
export const BOOKING_REVIEW_ESTIMATOR_CONDITION_LABEL = "Overall condition";
export const BOOKING_REVIEW_ESTIMATOR_FOCUS_AREAS_LABEL = "Focus areas";
export const BOOKING_REVIEW_ESTIMATOR_SURFACE_LABEL = "Furnishings & layout";
export const BOOKING_REVIEW_SCOPE_OF_WORK_LABEL = "Scope of work";
export const BOOKING_REVIEW_ADD_ONS_LABEL = "Add-ons";
export const BOOKING_REVIEW_DEEP_CLEAN_FOCUS_LABEL = "Deep-clean focus";
export const BOOKING_REVIEW_TRANSITION_SETUP_LABEL = "Home transition setup";
export const BOOKING_REVIEW_TRANSITION_APPLIANCES_LABEL = "Appliances included";

/** Step 4 — transparent “why” hints tied to estimate-driving inputs (no math or pricing breakdown). */
export const BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE =
  "What's driving your estimate";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION =
  "Heavier buildup increases time required.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_PROBLEM_AREAS =
  "Targeted problem areas add focused cleaning time.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DENSE_LAYOUT =
  "Dense layout requires more detailed work.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE =
  "A more detailed scope increases the time needed throughout the home.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS =
  "Selected add-ons add focused work beyond the main cleaning.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS =
  "Your deep-clean focus shifts more time toward the areas that need the most attention.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION =
  "Furnishings and move-state complexity can increase the detail needed throughout the home.";
export const BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES =
  "Including appliances adds focused work beyond the main cleaning.";

/** Step 4 — quote / planning clarity (derived from selections only; never numeric). */
export const BOOKING_REVIEW_PLANNING_CONFIDENCE_TITLE = "Quote clarity";

export const BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE =
  "Your details support a clear planning estimate.";
export const BOOKING_REVIEW_PRE_CONF_HIGH_BODY =
  "What you shared lines up cleanly for how we size the visit.";
export const BOOKING_REVIEW_PRE_CONF_HIGH_SUPPORTING =
  "Planning is straightforward from the details provided.";

export const BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE =
  "Your estimate reflects a more tailored scope.";
export const BOOKING_REVIEW_PRE_CONF_CUSTOM_BODY =
  "A few meaningful choices are shaping how this visit comes together.";
export const BOOKING_REVIEW_PRE_CONF_CUSTOM_SUPPORTING =
  "Multiple request details are shaping the estimate.";

export const BOOKING_REVIEW_PRE_CONF_SPECIAL_HEADLINE =
  "Your request includes details that may require a more customized final plan.";
export const BOOKING_REVIEW_PRE_CONF_SPECIAL_BODY =
  "The combination you described asks for extra nuance in how we plan the work.";
export const BOOKING_REVIEW_PRE_CONF_SPECIAL_SUPPORTING =
  "Selected details increase the need for a more tailored planning view.";

/** Step 4 — visit prep hints (informational; from selections only). */
export const BOOKING_REVIEW_PREP_SECTION_TITLE = "Before we arrive";

export const BOOKING_REVIEW_PREP_FRIDGE =
  "If the refrigerator is in scope, having it emptied beforehand keeps the visit focused.";
export const BOOKING_REVIEW_PREP_OVEN =
  "For interior oven work, a cooled oven with straightforward access is ideal.";
export const BOOKING_REVIEW_PREP_INTERIOR_WINDOWS =
  "Where interior windows are included, clear access along those walls helps us move efficiently.";
export const BOOKING_REVIEW_PREP_MOVE_FURNISHED =
  "With a furnished home, noting access paths and high-touch areas you care about helps us plan the visit.";
export const BOOKING_REVIEW_PREP_MOVE_APPLIANCES =
  "When appliances are in scope, confirming access and readiness keeps the day on track.";
export const BOOKING_REVIEW_PREP_DEEP_KITCHEN_BATH =
  "For a kitchen-and-bath-first plan, opening those rooms first sets a smooth rhythm.";
export const BOOKING_REVIEW_PREP_PETS =
  "If pets are part of the household, a simple access plan and a calm space for them goes a long way.";
export const BOOKING_REVIEW_PREP_DENSE_LAYOUT =
  "In a fuller layout, tucking small items and opening paths where you can makes detailed work easier.";

/** Step 4 — optional add-on / attention suggestions (never selected automatically). */
export const BOOKING_REVIEW_RECOMMEND_SECTION_TITLE = "You may also want to consider";

export const BOOKING_REVIEW_REC_INSIDE_OVEN =
  "Interior oven cleaning when the kitchen needs a deeper reset pass.";
export const BOOKING_REVIEW_REC_INSIDE_FRIDGE =
  "Interior refrigerator cleaning when the kitchen is a priority focus.";
export const BOOKING_REVIEW_REC_BASEBOARDS_DETAIL =
  "Detailed baseboards where bathrooms or edges would benefit from a finishing lift.";
export const BOOKING_REVIEW_REC_INTERIOR_WINDOWS =
  "Interior windows when you want glass and frames to read crisp for handoff or settling in.";
export const BOOKING_REVIEW_REC_CABINETS_DETAIL =
  "Detailed cabinet fronts when touch points and trim deserve extra finesse.";
