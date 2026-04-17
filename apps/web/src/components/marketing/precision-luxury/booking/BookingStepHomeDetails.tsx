import { BookingSectionCard } from "../BookingSectionCard";
import {
  BookingSelectField,
  type BookingSelectFieldOption,
} from "./BookingSelectField";
import { BookingTextField } from "./BookingTextField";
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
  BookingDeepCleanFocus,
  BookingFlowState,
  BookingFrequencyOption,
  BookingHomeCondition,
  BookingProblemAreaToken,
  BookingScopeIntensity,
  BookingSurfaceComplexity,
  BookingTimeOption,
  BookingTransitionState,
} from "./bookingFlowTypes";
import {
  BOOKING_ADD_ON_LABELS,
  BOOKING_APPLIANCE_PRESENCE_LABELS,
  BOOKING_DEEP_CLEAN_FOCUS_LABELS,
  BOOKING_HOME_CONDITION_LABELS,
  BOOKING_PROBLEM_AREA_LABELS,
  BOOKING_SCOPE_INTENSITY_LABELS,
  BOOKING_SURFACE_COMPLEXITY_LABELS,
  BOOKING_STEP2_ADDONS_SECTION_HELPER,
  BOOKING_STEP2_ADDONS_SECTION_TITLE,
  BOOKING_STEP2_CONDITION_SECTION_TITLE,
  BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_BODY,
  BOOKING_STEP2_DEEP_CLEAN_FOCUS_SECTION_TITLE,
  BOOKING_STEP2_PROBLEM_AREAS_HELPER,
  BOOKING_STEP2_PROBLEM_AREAS_SECTION_TITLE,
  BOOKING_STEP2_SCOPE_INTENSITY_SECTION_BODY,
  BOOKING_STEP2_SCOPE_INTENSITY_SECTION_TITLE,
  BOOKING_STEP2_SURFACE_SECTION_TITLE,
  BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_HELPER,
  BOOKING_STEP2_TRANSITION_APPLIANCES_SECTION_TITLE,
  BOOKING_STEP2_TRANSITION_SETUP_SECTION_BODY,
  BOOKING_STEP2_TRANSITION_SETUP_SECTION_TITLE,
  BOOKING_HOME_CADENCE_SECTION_BODY,
  BOOKING_HOME_CADENCE_SECTION_TITLE,
  BOOKING_CADENCE_ARRIVAL_WINDOW_LABEL,
  BOOKING_STEP2_VISIT_CONTEXT_SECTION_BODY,
  BOOKING_STEP2_VISIT_CONTEXT_SECTION_TITLE,
  BOOKING_STEP_EDIT_CONTINUITY_HINT,
  BOOKING_TRANSITION_STATE_LABELS,
  frequencyCardBody,
  timingCardBody,
} from "./bookingPublicSurfaceCopy";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingProblemAreasForPayload,
} from "./bookingUrlState";

type BookingStepHomeDetailsProps = {
  state: BookingFlowState;
  onChange: (patch: Partial<BookingFlowState>) => void;
  selectedServiceTitle: string;
  deepCleanPlanLabel: string | null;
};

const cadenceFrequencyOptions: BookingFrequencyOption[] = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "One-Time",
];

const cadenceTimeOptions: BookingTimeOption[] = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Friday",
  "Saturday",
];

export function BookingStepHomeDetails({
  state,
  onChange,
  selectedServiceTitle,
  deepCleanPlanLabel,
}: BookingStepHomeDetailsProps) {
  const bedroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BEDROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const bathroomOptions: BookingSelectFieldOption[] = [
    "",
    ...BOOKING_HOME_BATHROOM_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const conditionOptions: BookingHomeCondition[] = [
    "light_upkeep",
    "standard_lived_in",
    "heavy_buildup",
    "move_in_out_reset",
  ];

  const problemOptions: BookingProblemAreaToken[] = [
    "kitchen_grease",
    "bathroom_buildup",
    "pet_hair",
    "heavy_dust",
  ];

  const surfaceOptions: BookingSurfaceComplexity[] = [
    "minimal_furnishings",
    "average_furnishings",
    "dense_layout",
  ];

  const scopeIntensityOptions: BookingScopeIntensity[] = [
    "targeted_touch_up",
    "full_home_refresh",
    "detail_heavy",
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

  function toggleProblemArea(token: BookingProblemAreaToken) {
    const has = state.problemAreas.includes(token);
    const next = has
      ? state.problemAreas.filter((t) => t !== token)
      : [...state.problemAreas, token];
    onChange({ problemAreas: normalizeBookingProblemAreasForPayload(next) });
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
            <span className="font-medium">Deep clean plan:</span> {deepCleanPlanLabel}
          </p>
        ) : null}
        <p className="mt-4 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
          {BOOKING_STEP_EDIT_CONTINUITY_HINT}
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <div>
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Approximate size
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Add square footage in digits (for example 2200 or 2,200 sq ft) so we
              can align with our size bands.
            </p>
          </div>
          <BookingTextField
            id="booking-home-size"
            label="Home size"
            value={state.homeSize}
            onChange={(value) => onChange({ homeSize: value })}
            placeholder="e.g. 2,200 sq ft or 2200"
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
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              Household
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Optional—helps us plan products and safety. Skip if you prefer.
            </p>
          </div>
          <BookingSelectField
            id="booking-home-pets"
            label="Pets (optional)"
            value={state.pets}
            onChange={(value) => onChange({ pets: value })}
            options={[
              "",
              "No pets",
              "One dog",
              "One cat",
              "Multiple pets",
            ]}
            placeholder="Tell us about pets (optional)"
          />
        </div>

        <div
          className="border-t border-[#C9B27C]/14 pt-10"
          data-testid="booking-home-cadence-section"
        >
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              {BOOKING_HOME_CADENCE_SECTION_TITLE}
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_HOME_CADENCE_SECTION_BODY}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <p
                id="booking-home-frequency-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                Visit frequency
              </p>
              <div
                className="mt-4 grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-labelledby="booking-home-frequency-legend"
              >
                {cadenceFrequencyOptions.map((value) => {
                  const selected = state.frequency === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ frequency: value })}
                      className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="block font-semibold text-[#0F172A]">
                        {value}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[#64748B]">
                        {frequencyCardBody(state.serviceId, value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p
                id="booking-home-preferred-time-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_CADENCE_ARRIVAL_WINDOW_LABEL}
              </p>
              <div
                className="mt-4 grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-labelledby="booking-home-preferred-time-legend"
              >
                {cadenceTimeOptions.map((value) => {
                  const selected = state.preferredTime === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ preferredTime: value })}
                      className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="block font-semibold text-[#0F172A]">
                        {value}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[#64748B]">
                        {timingCardBody(value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
              {BOOKING_STEP2_VISIT_CONTEXT_SECTION_TITLE}
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_STEP2_VISIT_CONTEXT_SECTION_BODY}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <p
                id="booking-home-condition-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_STEP2_CONDITION_SECTION_TITLE}
              </p>
              <div
                className="mt-4 grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-labelledby="booking-home-condition-legend"
              >
                {conditionOptions.map((value) => {
                  const selected = state.condition === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ condition: value })}
                      className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="block font-semibold text-[#0F172A]">
                        {BOOKING_HOME_CONDITION_LABELS[value]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p
                id="booking-home-problems-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_STEP2_PROBLEM_AREAS_SECTION_TITLE}
              </p>
              <p className="mt-1 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {BOOKING_STEP2_PROBLEM_AREAS_HELPER}
              </p>
              <div
                className="mt-4 flex flex-wrap gap-2"
                role="group"
                aria-labelledby="booking-home-problems-legend"
              >
                {problemOptions.map((token) => {
                  const pressed = state.problemAreas.includes(token);
                  return (
                    <button
                      key={token}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => toggleProblemArea(token)}
                      className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
                        pressed
                          ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
                          : "border-[#C9B27C]/25 bg-white text-[#0F172A] hover:border-[#C9B27C]/45"
                      }`}
                    >
                      {BOOKING_PROBLEM_AREA_LABELS[token]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p
                id="booking-home-surface-legend"
                className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
              >
                {BOOKING_STEP2_SURFACE_SECTION_TITLE}
              </p>
              <div
                className="mt-4 grid gap-3 sm:grid-cols-3"
                role="radiogroup"
                aria-labelledby="booking-home-surface-legend"
              >
                {surfaceOptions.map((value) => {
                  const selected = state.surfaceComplexity === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ surfaceComplexity: value })}
                      className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="block font-semibold text-[#0F172A]">
                        {BOOKING_SURFACE_COMPLEXITY_LABELS[value]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#C9B27C]/14 pt-10">
          <div className="mb-5">
            <p
              id="booking-home-scope-intensity-legend"
              className="font-[var(--font-poppins)] text-sm font-semibold tracking-[-0.02em] text-[#0F172A]"
            >
              {BOOKING_STEP2_SCOPE_INTENSITY_SECTION_TITLE}
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_STEP2_SCOPE_INTENSITY_SECTION_BODY}
            </p>
          </div>
          <div>
            <div
              className="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-labelledby="booking-home-scope-intensity-legend"
            >
              {scopeIntensityOptions.map((value) => {
                const selected = state.scopeIntensity === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange({ scopeIntensity: value })}
                    className={`rounded-2xl border px-4 py-4 text-left font-[var(--font-manrope)] text-sm transition ${
                      selected
                        ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                        : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                    }`}
                  >
                    <span className="block font-semibold text-[#0F172A]">
                      {BOOKING_SCOPE_INTENSITY_LABELS[value]}
                    </span>
                  </button>
                );
              })}
            </div>
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
