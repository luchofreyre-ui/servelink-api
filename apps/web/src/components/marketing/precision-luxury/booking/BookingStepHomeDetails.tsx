import { useEffect, useRef } from "react";
import { BookingSectionCard } from "../BookingSectionCard";
import {
  BookingSelectField,
  type BookingSelectFieldOption,
} from "./BookingSelectField";
import {
  BOOKING_BATHROOMS_FIELD_HELPER,
  BOOKING_BATHROOMS_FIELD_LABEL,
  BOOKING_BEDROOMS_FIELD_HELPER,
  BOOKING_BEDROOMS_FIELD_LABEL,
  BOOKING_HOME_BATHROOM_OPTIONS,
  BOOKING_HOME_BEDROOM_OPTIONS,
  BOOKING_STEP2_ROOMS_SECTION_BODY,
  BOOKING_STEP2_ROOMS_SECTION_TITLE,
} from "./bookingEstimateFactorFields";
import type {
  BookingAddOnToken,
  BookingAppliancePresenceToken,
  BookingBathroomComplexity,
  BookingChildrenInHome,
  BookingClutterAccess,
  BookingDeepCleanFocus,
  BookingFirstTimeVisitProgram,
  BookingFloorMix,
  BookingFlowState,
  BookingKitchenIntensity,
  BookingLastProCleanRecency,
  BookingLayoutType,
  BookingOccupancyLevel,
  BookingOverallLaborCondition,
  BookingPetImpactLevel,
  BookingPrimaryIntent,
  BookingRecurringCadenceIntent,
  BookingSurfaceDetailToken,
  BookingTransitionState,
} from "./bookingFlowTypes";
import {
  BOOKING_ADD_ON_LABELS,
  BOOKING_APPLIANCE_PRESENCE_LABELS,
  BOOKING_DEEP_CLEAN_FOCUS_LABELS,
  BOOKING_STEP2_ADDONS_SECTION_HELPER,
  BOOKING_STEP2_ADDONS_SECTION_TITLE,
  BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_BODY,
  BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_TITLE,
  BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_HELPER,
  BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_TITLE,
  BOOKING_STEP2_TRANSITION_SETUP_SECTION_BODY,
  BOOKING_STEP2_TRANSITION_SETUP_SECTION_TITLE,
  BOOKING_STEP_EDIT_CONTINUITY_HINT,
  BOOKING_TRANSITION_STATE_LABELS,
} from "./bookingPublicSurfaceCopy";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingHomeSizeParam,
} from "./bookingUrlState";
import { BOOKING_HOME_SIZE_RANGE_OPTIONS } from "./bookingHomeSizeRanges";

type BookingStepHomeDetailsProps = {
  state: BookingFlowState;
  onChange: (patch: Partial<BookingFlowState>) => void;
  selectedServiceTitle: string;
  deepCleanPlanLabel: string | null;
};

export function BookingStepHomeDetails({
  state,
  onChange,
  selectedServiceTitle,
  deepCleanPlanLabel,
}: BookingStepHomeDetailsProps) {
  const visitContextSectionRef = useRef<HTMLDivElement | null>(null);
  const prevCoreHomeCompleteRef = useRef(false);

  const homeSizeOk = Boolean(normalizeBookingHomeSizeParam(state.homeSize));
  const bedroomsOk = Boolean(String(state.bedrooms ?? "").trim());
  const bathroomsOk = Boolean(String(state.bathrooms ?? "").trim());
  const coreHomeComplete = homeSizeOk && bedroomsOk && bathroomsOk;

  useEffect(() => {
    if (coreHomeComplete && !prevCoreHomeCompleteRef.current) {
      try {
        visitContextSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } catch {
        /* jsdom may not implement scrollIntoView options */
      }
    }
    prevCoreHomeCompleteRef.current = coreHomeComplete;
  }, [coreHomeComplete]);

  const bedroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BEDROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const bathroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BATHROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const halfBathOptions: BookingSelectFieldOption[] = [
    { value: "0", label: "None" },
    { value: "1", label: "One half bath" },
    { value: "2_plus", label: "Two or more half baths" },
  ];

  const floorMixOptions: { value: BookingFloorMix; label: string }[] = [
    { value: "mostly_hard", label: "Mostly hard floors" },
    { value: "mixed", label: "Mixed floors" },
    { value: "mostly_carpet", label: "Mostly carpet" },
  ];

  const layoutOptions: { value: BookingLayoutType; label: string }[] = [
    { value: "open_plan", label: "Mostly open plan" },
    { value: "mixed", label: "Mixed layout" },
    { value: "segmented", label: "Many segmented rooms" },
  ];

  const occupancyOptions: { value: BookingOccupancyLevel; label: string }[] = [
    { value: "ppl_1_2", label: "1–2 people" },
    { value: "ppl_3_4", label: "3–4 people" },
    { value: "ppl_5_plus", label: "5+ people" },
  ];

  const laborConditionOptions: {
    value: BookingOverallLaborCondition;
    label: string;
  }[] = [
    { value: "recently_maintained", label: "Recently maintained" },
    { value: "normal_lived_in", label: "Normal lived-in" },
    { value: "behind_weeks", label: "Behind several weeks" },
    { value: "major_reset", label: "Major reset needed" },
  ];

  const kitchenIntensityOptions: {
    value: BookingKitchenIntensity;
    label: string;
  }[] = [
    { value: "light_use", label: "Light use" },
    { value: "average_use", label: "Average use" },
    { value: "heavy_use", label: "Heavy use" },
  ];

  const bathComplexityOptions: {
    value: BookingBathroomComplexity;
    label: string;
  }[] = [
    { value: "standard", label: "Standard" },
    { value: "moderate_detailing", label: "Moderate detailing" },
    { value: "heavy_detailing", label: "Heavy detailing" },
  ];

  const clutterAccessOptions: { value: BookingClutterAccess; label: string }[] =
    [
      { value: "mostly_clear", label: "Mostly clear" },
      { value: "moderate_clutter", label: "Moderate clutter" },
      { value: "heavy_clutter", label: "Heavy clutter" },
    ];

  const surfaceDetailOptions: BookingSurfaceDetailToken[] = [
    "interior_glass",
    "heavy_mirrors",
    "built_ins",
    "detailed_trim",
    "many_touchpoints",
  ];

  const primaryIntentOptions: { value: BookingPrimaryIntent; label: string }[] =
    [
      { value: "maintenance_clean", label: "Maintenance clean" },
      { value: "detailed_standard", label: "Detailed standard clean" },
      { value: "reset_level", label: "Reset-level clean" },
    ];

  const lastProOptions: { value: BookingLastProCleanRecency; label: string }[] =
    [
      { value: "within_30_days", label: "Within 30 days" },
      { value: "days_30_90", label: "30–90 days" },
      { value: "days_90_plus", label: "90+ days" },
      { value: "unknown_or_not_recently", label: "Unknown / not recently" },
    ];

  const firstTimeProgramOptions: {
    value: BookingFirstTimeVisitProgram;
    label: string;
  }[] = [
    { value: "one_visit", label: "One visit" },
    { value: "two_visit", label: "Two-visit program" },
    { value: "three_visit", label: "Three-visit program" },
  ];

  const recurringIntentOptions: {
    value: BookingRecurringCadenceIntent;
    label: string;
  }[] = [
    { value: "weekly", label: "Weekly intent" },
    { value: "biweekly", label: "Biweekly intent" },
    { value: "monthly", label: "Monthly intent" },
    { value: "none", label: "No recurring intent" },
  ];

  const addOnOptions: BookingAddOnToken[] = [
    "inside_fridge",
    "inside_oven",
    "interior_windows",
    "baseboards_detail",
    "cabinets_detail",
  ];

  const deepCleanFocusOptions: BookingDeepCleanFocus[] = [
    "whole_home_reset",
    "kitchen_bath_priority",
    "high_touch_detail",
  ];

  const transitionStateOptions: BookingTransitionState[] = [
    "empty_home",
    "lightly_furnished",
    "fully_furnished",
  ];

  const appliancePresenceOptions: BookingAppliancePresenceToken[] = [
    "refrigerator_present",
    "oven_present",
    "dishwasher_present",
    "washer_dryer_present",
  ];

  const showDeepCleanServiceSections =
    isDeepCleaningBookingServiceId(state.serviceId);
  const showMoveTransitionServiceSections =
    isBookingMoveTransitionServiceId(state.serviceId);

  function toggleSurfaceDetail(token: BookingSurfaceDetailToken) {
    const has = state.surfaceDetailTokens.includes(token);
    const next = has
      ? state.surfaceDetailTokens.filter((t) => t !== token)
      : [...state.surfaceDetailTokens, token];
    onChange({
      surfaceDetailTokens: [...new Set(next)].sort() as BookingSurfaceDetailToken[],
    });
  }

  function toggleAddOn(token: BookingAddOnToken) {
    const has = state.selectedAddOns.includes(token);
    const next = has
      ? state.selectedAddOns.filter((t) => t !== token)
      : [...state.selectedAddOns, token];
    onChange({ selectedAddOns: normalizeBookingAddOnsForPayload(next) });
  }

  function toggleAppliancePresence(token: BookingAppliancePresenceToken) {
    const has = state.appliancePresence.includes(token);
    const next = has
      ? state.appliancePresence.filter((t) => t !== token)
      : [...state.appliancePresence, token];
    onChange({
      appliancePresence: normalizeBookingAppliancePresenceForPayload(next),
    });
  }

  return (
    <BookingSectionCard
      eyebrow="Step 2"
      title="Tell us about your home"
      body="This helps us scope your service correctly and avoid surprises."
    >
      <div className="mb-10 rounded-2xl border border-[#C9B27C]/16 bg-white px-5 py-4 shadow-sm ring-1 ring-[#C9B27C]/10">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Request context
        </p>
        <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A]">
          <span className="font-medium">Service:</span> {selectedServiceTitle}
        </p>
        {deepCleanPlanLabel ? (
          <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A]">
            <span className="font-medium">Visit pacing:</span> {deepCleanPlanLabel}
          </p>
        ) : null}
        <p className="mt-4 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
          {BOOKING_STEP_EDIT_CONTINUITY_HINT}
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4" data-testid="booking-home-size-range">
          <div>
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Home size range
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Choose the bracket that best matches the home so we can align with
              our planning bands.
            </p>
          </div>
          <BookingSelectField
            id="booking-home-size-range"
            label="Square footage"
            value={state.homeSize}
            onChange={(value) => onChange({ homeSize: value })}
            options={[
              { value: "", label: "Select a size range" },
              ...BOOKING_HOME_SIZE_RANGE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
            placeholder="Select a size range"
          />
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              {BOOKING_STEP2_ROOMS_SECTION_TITLE}
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_STEP2_ROOMS_SECTION_BODY}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <BookingSelectField
              id="booking-home-bedrooms"
              label={BOOKING_BEDROOMS_FIELD_LABEL}
              value={state.bedrooms}
              onChange={(value) => onChange({ bedrooms: value })}
              options={bedroomOptions}
              placeholder="Select bedrooms"
              helper={BOOKING_BEDROOMS_FIELD_HELPER}
            />

            <BookingSelectField
              id="booking-home-bathrooms"
              label={BOOKING_BATHROOMS_FIELD_LABEL}
              value={state.bathrooms}
              onChange={(value) => onChange({ bathrooms: value })}
              options={bathroomOptions}
              placeholder="Select bathrooms"
              helper={BOOKING_BATHROOMS_FIELD_HELPER}
            />
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Layer 1 — Baseline home facts
            </p>
            <p className="mt-2 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Home layout and occupancy
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Square footage range and bedrooms are above; capture the rest of the
              baseline facts here.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <BookingSelectField
              id="booking-home-half-baths"
              label="Half bathrooms"
              value={state.halfBathrooms}
              onChange={(value) =>
                onChange({
                  halfBathrooms: value as BookingFlowState["halfBathrooms"],
                })
              }
              options={halfBathOptions}
            />
            <BookingSelectField
              id="booking-home-levels"
              label="Number of levels / stairs context"
              value={state.intakeFloors}
              onChange={(value) =>
                onChange({
                  intakeFloors: value as BookingFlowState["intakeFloors"],
                })
              }
              options={[
                { value: "1", label: "Single level" },
                { value: "2", label: "Two levels" },
                { value: "3_plus", label: "Three or more levels" },
              ]}
            />
            <BookingSelectField
              id="booking-home-stairs"
              label="Interior stair flights"
              value={state.intakeStairsFlights}
              onChange={(value) =>
                onChange({
                  intakeStairsFlights:
                    value as BookingFlowState["intakeStairsFlights"],
                })
              }
              options={[
                { value: "none", label: "None" },
                { value: "one", label: "One flight" },
                { value: "two_plus", label: "Two or more flights" },
                { value: "not_sure", label: "Not sure" },
              ]}
            />
          </div>
          <p
            id="booking-floor-mix-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Floor mix
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-floor-mix-legend"
          >
            {floorMixOptions.map(({ value, label }) => {
              const selected = state.floorMix === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ floorMix: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-layout-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Layout type
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-layout-legend"
          >
            {layoutOptions.map(({ value, label }) => {
              const selected = state.layoutType === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ layoutType: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-occupancy-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Occupancy level
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-occupancy-legend"
          >
            {occupancyOptions.map(({ value, label }) => {
              const selected = state.occupancyLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ occupancyLevel: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-children-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Children in the home
          </p>
          <div
            className="mt-3 grid max-w-md grid-cols-2 gap-3"
            role="radiogroup"
            aria-labelledby="booking-children-legend"
          >
            {(
              [
                { value: "no" as const, label: "No" },
                { value: "yes" as const, label: "Yes" },
              ] satisfies { value: BookingChildrenInHome; label: string }[]
            ).map(({ value, label }) => {
              const selected = state.childrenInHome === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ childrenInHome: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-pet-impact-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Pet impact
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-pet-impact-legend"
          >
            {(
              [
                { value: "none" as const, label: "None" },
                { value: "light" as const, label: "Light pet impact" },
                { value: "heavy" as const, label: "Heavy pet impact" },
              ] satisfies { value: BookingPetImpactLevel; label: string }[]
            ).map(({ value, label }) => {
              const selected = state.petImpactLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ petImpactLevel: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <BookingSelectField
              id="booking-home-pets"
              label="Pets (optional free text)"
              value={state.pets}
              onChange={(value) => onChange({ pets: value })}
              options={[
                "",
                "No pets",
                "One dog",
                "One cat",
                "Multiple pets",
              ]}
              placeholder="Optional detail"
            />
          </div>
        </div>

        <div
          ref={visitContextSectionRef}
          className="border-t border-[#C9B27C]/14 pt-10"
          data-testid="booking-home-visit-context-section"
        >
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Layer 2 — Labor multipliers
            </p>
            <p className="mt-2 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              What drives time on site
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              These answers tune labor weighting—not just copy for the estimator.
            </p>
          </div>
          <p
            id="booking-overall-condition-legend"
            className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Overall condition
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-labelledby="booking-overall-condition-legend"
          >
            {laborConditionOptions.map(({ value, label }) => {
              const selected = state.overallLaborCondition === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ overallLaborCondition: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-kitchen-intensity-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Kitchen intensity
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-kitchen-intensity-legend"
          >
            {kitchenIntensityOptions.map(({ value, label }) => {
              const selected = state.kitchenIntensity === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ kitchenIntensity: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-bath-complexity-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Bathroom complexity
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-bath-complexity-legend"
          >
            {bathComplexityOptions.map(({ value, label }) => {
              const selected = state.bathroomComplexity === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ bathroomComplexity: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-clutter-access-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Clutter / access
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-clutter-access-legend"
          >
            {clutterAccessOptions.map(({ value, label }) => {
              const selected = state.clutterAccess === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ clutterAccess: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-surface-detail-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Surface complexity (multi-select)
          </p>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-labelledby="booking-surface-detail-legend"
          >
            {surfaceDetailOptions.map((token) => {
              const pressed = state.surfaceDetailTokens.includes(token);
              const label =
                token === "interior_glass"
                  ? "Interior glass"
                  : token === "heavy_mirrors"
                    ? "Heavy mirrors"
                    : token === "built_ins"
                      ? "Built-ins"
                      : token === "detailed_trim"
                        ? "Detailed trim"
                        : "Many touchpoints";
              return (
                <button
                  key={token}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleSurfaceDetail(token)}
                  className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
                    pressed
                      ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
                      : "border-[#C9B27C]/25 bg-white text-[#0F172A] hover:border-[#C9B27C]/45"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Layer 3 — Expectation / reset signals
            </p>
            <p className="mt-2 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              What “done” should feel like
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Cadence intent is not your schedule—it informs how aggressive the reset
              should be relative to ongoing maintenance.
            </p>
          </div>
          <p
            id="booking-primary-intent-legend"
            className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Primary intent
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-primary-intent-legend"
          >
            {primaryIntentOptions.map(({ value, label }) => {
              const selected = state.primaryIntent === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ primaryIntent: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-last-pro-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Professional cleaning recency
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-labelledby="booking-last-pro-legend"
          >
            {lastProOptions.map(({ value, label }) => {
              const selected = state.lastProCleanRecency === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ lastProCleanRecency: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-first-time-program-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            First-time cleaning program
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-labelledby="booking-first-time-program-legend"
          >
            {firstTimeProgramOptions.map(({ value, label }) => {
              const selected = state.firstTimeVisitProgram === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    onChange({
                      firstTimeVisitProgram: value,
                      ...(isDeepCleaningBookingServiceId(state.serviceId)
                        ? {
                            deepCleanProgram:
                              value === "three_visit"
                                ? "phased_3_visit"
                                : "single_visit",
                          }
                        : {}),
                    })
                  }
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
          <p
            id="booking-recurring-intent-legend"
            className="mt-8 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
          >
            Recurring cadence intent (not your schedule)
          </p>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            role="radiogroup"
            aria-labelledby="booking-recurring-intent-legend"
          >
            {recurringIntentOptions.map(({ value, label }) => {
              const selected = state.recurringCadenceIntent === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ recurringCadenceIntent: value })}
                  className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                    selected
                      ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                      : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                  }`}
                >
                  <span className="block font-semibold text-[#0F172A]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              {BOOKING_STEP2_ADDONS_SECTION_TITLE}
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
              {BOOKING_STEP2_ADDONS_SECTION_HELPER}
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={BOOKING_STEP2_ADDONS_SECTION_TITLE}
          >
            {addOnOptions.map((token) => {
              const pressed = state.selectedAddOns.includes(token);
              return (
                <button
                  key={token}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleAddOn(token)}
                  className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
                    pressed
                      ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
                      : "border-[#C9B27C]/25 bg-white text-[#0F172A] hover:border-[#C9B27C]/45"
                  }`}
                >
                  {BOOKING_ADD_ON_LABELS[token]}
                </button>
              );
            })}
          </div>
        </div>

        {showDeepCleanServiceSections ? (
          <div className="border-t border-[#C9B27C]/14 pt-10">
            <div className="mb-5">
              <p
                id="booking-home-deep-clean-focus-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_TITLE}
              </p>
              <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                {BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_BODY}
              </p>
            </div>
            <div
              className="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-labelledby="booking-home-deep-clean-focus-legend"
            >
              {deepCleanFocusOptions.map((value) => {
                const selected = state.deepCleanFocus === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange({ deepCleanFocus: value })}
                    className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                      selected
                        ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                        : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                    }`}
                  >
                    <span className="block font-semibold text-[#0F172A]">
                      {BOOKING_DEEP_CLEAN_FOCUS_LABELS[value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {showMoveTransitionServiceSections ? (
          <div className="border-t border-[#C9B27C]/14 pt-10">
            <div className="mb-5">
              <p
                id="booking-home-transition-setup-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_STEP2_TRANSITION_SETUP_SECTION_TITLE}
              </p>
              <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                {BOOKING_STEP2_TRANSITION_SETUP_SECTION_BODY}
              </p>
            </div>
            <div
              className="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-labelledby="booking-home-transition-setup-legend"
            >
              {transitionStateOptions.map((value) => {
                const selected = state.transitionState === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange({ transitionState: value })}
                    className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                      selected
                        ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                        : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                    }`}
                  >
                    <span className="block font-semibold text-[#0F172A]">
                      {BOOKING_TRANSITION_STATE_LABELS[value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {showMoveTransitionServiceSections ? (
          <div className="border-t border-[#C9B27C]/14 pt-10">
            <div className="mb-5">
              <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
                {BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_TITLE}
              </p>
              <p className="mt-1 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_HELPER}
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_TITLE}
            >
              {appliancePresenceOptions.map((token) => {
                const pressed = state.appliancePresence.includes(token);
                return (
                  <button
                    key={token}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => toggleAppliancePresence(token)}
                    className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
                      pressed
                        ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
                        : "border-[#C9B27C]/25 bg-white text-[#0F172A] hover:border-[#C9B27C]/45"
                    }`}
                  >
                    {BOOKING_APPLIANCE_PRESENCE_LABELS[token]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </BookingSectionCard>
  );
}
