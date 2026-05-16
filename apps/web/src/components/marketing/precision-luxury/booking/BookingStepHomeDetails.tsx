import { useEffect, useRef } from "react";
import { BookingSectionCard } from "../BookingSectionCard";
import {
  BookingSelectField,
  type BookingSelectFieldOption,
} from "./BookingSelectField";
import { BookingTextField } from "./BookingTextField";
import {
  getBookingCustomerEmailError,
  getBookingCustomerNameError,
  isBookingContactValid,
} from "./bookingContactValidation";
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
  BookingFloorMix,
  BookingFlowState,
  BookingKitchenIntensity,
  BookingLastProCleanRecency,
  BookingLayoutType,
  BookingOccupancyLevel,
  BookingOverallLaborCondition,
  BookingPetImpactLevel,
  BookingSurfaceDetailToken,
  BookingTransitionState,
} from "./bookingFlowTypes";
import {
  BOOKING_LOCATION_CITY_LABEL,
  BOOKING_LOCATION_STATE_LABEL,
  BOOKING_LOCATION_STREET_LABEL,
  BOOKING_LOCATION_STREET_PLACEHOLDER,
  BOOKING_LOCATION_UNIT_LABEL,
  BOOKING_LOCATION_UNIT_PLACEHOLDER,
  BOOKING_LOCATION_ZIP_HELPER,
  BOOKING_LOCATION_ZIP_LABEL,
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
  isHomeDetailsComplete,
  isServiceLocationComplete,
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingServiceLocationZipParam,
} from "./bookingUrlState";
import { BOOKING_HOME_SIZE_RANGE_OPTIONS } from "./bookingHomeSizeRanges";

type BookingStepHomeDetailsProps = {
  state: BookingFlowState;
  onChange: (patch: Partial<BookingFlowState>) => void;
  selectedServiceTitle: string;
  deepCleanPlanLabel: string | null;
  showFieldErrors?: boolean;
};

export function BookingStepHomeDetails({
  state,
  onChange,
  selectedServiceTitle,
  deepCleanPlanLabel,
  showFieldErrors = false,
}: BookingStepHomeDetailsProps) {
  const visitContextSectionRef = useRef<HTMLDivElement | null>(null);
  const prevCoreHomeCompleteRef = useRef(false);

  const layer1Complete = isHomeDetailsComplete(state);
  const locationComplete = isServiceLocationComplete(state);
  const contactComplete = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );
  const zipOk =
    normalizeBookingServiceLocationZipParam(state.serviceLocationZip).length >= 5;
  const nameError = showFieldErrors
    ? getBookingCustomerNameError(state.customerName)
    : null;
  const emailError = showFieldErrors
    ? getBookingCustomerEmailError(state.customerEmail)
    : null;

  useEffect(() => {
    if (layer1Complete && !prevCoreHomeCompleteRef.current) {
      try {
        visitContextSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } catch {
        /* jsdom may not implement scrollIntoView options */
      }
    }
    prevCoreHomeCompleteRef.current = layer1Complete;
  }, [layer1Complete]);

  const bedroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BEDROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const bathroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BATHROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const halfBathOptions: BookingSelectFieldOption[] = [
    { value: "", label: "Select half bathrooms" },
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

  const lastProOptions: { value: BookingLastProCleanRecency; label: string }[] =
    [
      { value: "within_30_days", label: "Within 30 days" },
      { value: "days_30_90", label: "30–90 days" },
      { value: "days_90_plus", label: "90+ days" },
      { value: "unknown_or_not_recently", label: "Unknown / not recently" },
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
      title="Your home details"
      body="These details help us prepare the right visit, route the team accurately, and keep follow-up clear."
    >
      <div className="mb-10 rounded-2xl border border-[#C9B27C]/16 bg-white px-5 py-4 shadow-sm ring-1 ring-[#C9B27C]/10">
        <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
          Intake for {selectedServiceTitle}
        </p>
        {deepCleanPlanLabel ? (
          <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A]">
            <span className="font-medium">Visit pacing:</span> {deepCleanPlanLabel}
          </p>
        ) : null}
        <p className="mt-4 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
          {BOOKING_STEP_EDIT_CONTINUITY_HINT} We only ask for details that help prepare the visit or reach you about the request.
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
              visit time and staffing expectations.
            </p>
          </div>
          <BookingSelectField
            id="booking-home-size-range"
            label="Square footage"
            value={state.homeSize}
            onChange={(value) => onChange({ homeSize: value })}
            invalid={showFieldErrors && !state.homeSize}
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
              invalid={showFieldErrors && !state.bedrooms}
            />

            <BookingSelectField
              id="booking-home-bathrooms"
              label={BOOKING_BATHROOMS_FIELD_LABEL}
              value={state.bathrooms}
              onChange={(value) => onChange({ bathrooms: value })}
              options={bathroomOptions}
              placeholder="Select bathrooms"
              helper={BOOKING_BATHROOMS_FIELD_HELPER}
              invalid={showFieldErrors && !state.bathrooms}
            />
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Arrival address
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              We use this to confirm service area, prepare routing, and avoid asking for location twice.
            </p>
          </div>
          <div className="space-y-5">
            <BookingTextField
              id="booking-service-location-street"
              label={BOOKING_LOCATION_STREET_LABEL}
              value={state.serviceLocationStreet}
              onChange={(value) => onChange({ serviceLocationStreet: value })}
              placeholder={BOOKING_LOCATION_STREET_PLACEHOLDER}
              invalid={showFieldErrors && state.serviceLocationStreet.trim().length < 3}
              helper={
                showFieldErrors && state.serviceLocationStreet.trim().length < 3
                  ? "Please enter the service street address."
                  : undefined
              }
            />
            <BookingTextField
              id="booking-service-location-unit"
              label={BOOKING_LOCATION_UNIT_LABEL}
              value={state.serviceLocationUnit}
              onChange={(value) => onChange({ serviceLocationUnit: value })}
              placeholder={BOOKING_LOCATION_UNIT_PLACEHOLDER}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <BookingTextField
                id="booking-service-location-city"
                label={BOOKING_LOCATION_CITY_LABEL}
                value={state.serviceLocationCity}
                onChange={(value) => onChange({ serviceLocationCity: value })}
                placeholder="e.g. San Francisco"
                invalid={showFieldErrors && state.serviceLocationCity.trim().length < 2}
                helper={
                  showFieldErrors && state.serviceLocationCity.trim().length < 2
                    ? "Please add the service city."
                    : undefined
                }
              />
              <BookingTextField
                id="booking-service-location-state"
                label={BOOKING_LOCATION_STATE_LABEL}
                value={state.serviceLocationState}
                onChange={(value) => onChange({ serviceLocationState: value })}
                placeholder="e.g. CA"
                invalid={showFieldErrors && state.serviceLocationState.trim().length < 2}
                helper={
                  showFieldErrors && state.serviceLocationState.trim().length < 2
                    ? "Please add the service state."
                    : undefined
                }
              />
            </div>
            <BookingTextField
              id="booking-service-location-zip"
              label={BOOKING_LOCATION_ZIP_LABEL}
              value={state.serviceLocationZip}
              onChange={(value) => onChange({ serviceLocationZip: value })}
              placeholder="e.g. 94103"
              helper={
                showFieldErrors && !zipOk
                  ? "Please enter a valid service ZIP code."
                  : BOOKING_LOCATION_ZIP_HELPER
              }
              invalid={showFieldErrors && !zipOk}
            />
          </div>
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 ${
              locationComplete
                ? "border-[#0D9488]/22 bg-[rgba(13,148,136,0.06)]"
                : "border-[#C9B27C]/18 bg-white"
            }`}
          >
            <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              {locationComplete
                ? "We have enough routing detail to prepare the next step."
                : "Street, city, state, and ZIP are needed before we can prepare the estimate review."}
            </p>
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Contact for follow-up
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              We use this to send the request summary and clarify arrival details. No sales call is required.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <BookingTextField
              id="booking-customer-name"
              label="Full name"
              value={state.customerName}
              onChange={(value) => onChange({ customerName: value })}
              placeholder="Alex Rivera"
              autoComplete="name"
              invalid={Boolean(nameError)}
              helper={nameError ?? undefined}
            />
            <BookingTextField
              id="booking-customer-email"
              label="Email"
              type="email"
              value={state.customerEmail}
              onChange={(value) => onChange({ customerEmail: value })}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={Boolean(emailError)}
              helper={emailError ?? undefined}
            />
          </div>
          {contactComplete ? (
            <p className="mt-4 rounded-2xl border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] px-5 py-4 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              Contact is ready for the request summary and scheduling follow-up.
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Home preparation facts
            </p>
            <p className="mt-2 font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Home layout and occupancy
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              These answers help us prepare supplies, pacing, and team arrival expectations.
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
              invalid={showFieldErrors && !state.halfBathrooms}
            />
            <BookingSelectField
              id="booking-home-levels"
              label="Home levels and stairs"
              value={state.intakeFloors}
              onChange={(value) =>
                onChange({
                  intakeFloors: value as BookingFlowState["intakeFloors"],
                  intakeStairsFlights:
                    value === "1"
                      ? "none"
                      : value === "2"
                        ? "one"
                        : value === "3_plus"
                          ? "two_plus"
                          : "",
                })
              }
              options={[
                { value: "", label: "Select home levels" },
                { value: "1", label: "Single level / no interior stairs" },
                { value: "2", label: "Two levels / one flight" },
                { value: "3_plus", label: "Three or more levels / multiple flights" },
              ]}
              invalid={showFieldErrors && !state.intakeFloors}
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
            aria-invalid={showFieldErrors && !state.petImpactLevel ? true : undefined}
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
          {showFieldErrors && !state.petImpactLevel ? (
            <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#B91C1C]">
              Please choose the closest pet impact level.
            </p>
          ) : null}
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
                  onClick={() =>
                    onChange({
                      overallLaborCondition: value,
                      primaryIntent:
                        value === "major_reset"
                          ? "reset_level"
                          : value === "recently_maintained"
                            ? "maintenance_clean"
                            : "detailed_standard",
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
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Recent professional cleaning
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              This helps us understand how much preparation the first visit may need.
            </p>
          </div>
          <p
            id="booking-last-pro-legend"
            className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
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
