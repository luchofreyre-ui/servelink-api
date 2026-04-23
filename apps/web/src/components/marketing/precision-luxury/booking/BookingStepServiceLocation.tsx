import { BookingSectionCard } from "../BookingSectionCard";
import { BookingTextField } from "./BookingTextField";
import type { BookingFlowState } from "./bookingFlowTypes";
import {
  BOOKING_LOCATION_CITY_LABEL,
  BOOKING_LOCATION_STATE_LABEL,
  BOOKING_LOCATION_STEP_BODY,
  BOOKING_LOCATION_STEP_TITLE,
  BOOKING_LOCATION_STREET_LABEL,
  BOOKING_LOCATION_STREET_PLACEHOLDER,
  BOOKING_LOCATION_UNIT_LABEL,
  BOOKING_LOCATION_UNIT_PLACEHOLDER,
  BOOKING_LOCATION_ZIP_HELPER,
  BOOKING_LOCATION_ZIP_LABEL,
} from "./bookingPublicSurfaceCopy";
import {
  isServiceLocationComplete,
  normalizeBookingServiceLocationZipParam,
} from "./bookingUrlState";

type BookingStepServiceLocationProps = {
  state: BookingFlowState;
  onChange: (
    patch: Partial<
      Pick<
        BookingFlowState,
        | "serviceLocationZip"
        | "serviceLocationStreet"
        | "serviceLocationCity"
        | "serviceLocationState"
        | "serviceLocationUnit"
        | "serviceLocationAddressLine"
      >
    >,
  ) => void;
};

export function BookingStepServiceLocation({
  state,
  onChange,
}: BookingStepServiceLocationProps) {
  const ok = isServiceLocationComplete(state);
  const zipOk = normalizeBookingServiceLocationZipParam(state.serviceLocationZip).length >= 5;

  return (
    <BookingSectionCard
      eyebrow="Step 3"
      title={BOOKING_LOCATION_STEP_TITLE}
      body={BOOKING_LOCATION_STEP_BODY}
    >
      <div className="space-y-8" data-testid="booking-step-location">
        <BookingTextField
          id="booking-service-location-street"
          label={BOOKING_LOCATION_STREET_LABEL}
          value={state.serviceLocationStreet}
          onChange={(value) => onChange({ serviceLocationStreet: value })}
          placeholder={BOOKING_LOCATION_STREET_PLACEHOLDER}
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
          />
          <BookingTextField
            id="booking-service-location-state"
            label={BOOKING_LOCATION_STATE_LABEL}
            value={state.serviceLocationState}
            onChange={(value) => onChange({ serviceLocationState: value })}
            placeholder="e.g. CA"
          />
        </div>
        <BookingTextField
          id="booking-service-location-zip"
          label={BOOKING_LOCATION_ZIP_LABEL}
          value={state.serviceLocationZip}
          onChange={(value) => onChange({ serviceLocationZip: value })}
          placeholder="e.g. 94103"
          helper={BOOKING_LOCATION_ZIP_HELPER}
        />
        <div
          className={`rounded-2xl border px-5 py-4 ${
            ok
              ? "border-[#0D9488]/22 bg-[rgba(13,148,136,0.06)]"
              : zipOk
                ? "border-[#C9B27C]/18 bg-white"
                : "border-[#C9B27C]/18 bg-white"
          }`}
        >
          <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
            {ok
              ? "We have enough routing detail to match teams to this address."
              : "Continue stays disabled until street, city, state, and ZIP are filled in."}
          </p>
        </div>
      </div>
    </BookingSectionCard>
  );
}
