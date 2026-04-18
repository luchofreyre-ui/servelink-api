import { BookingSectionCard } from "../BookingSectionCard";
import { BookingTextField } from "./BookingTextField";
import type { BookingFlowState } from "./bookingFlowTypes";
import {
  BOOKING_LOCATION_ADDR_LABEL,
  BOOKING_LOCATION_ADDR_PLACEHOLDER,
  BOOKING_LOCATION_STEP_BODY,
  BOOKING_LOCATION_STEP_TITLE,
  BOOKING_LOCATION_ZIP_HELPER,
  BOOKING_LOCATION_ZIP_LABEL,
} from "./bookingPublicSurfaceCopy";
import { normalizeBookingServiceLocationZipParam } from "./bookingUrlState";

type BookingStepServiceLocationProps = {
  state: BookingFlowState;
  onChange: (
    patch: Partial<
      Pick<BookingFlowState, "serviceLocationZip" | "serviceLocationAddressLine">
    >,
  ) => void;
};

export function BookingStepServiceLocation({
  state,
  onChange,
}: BookingStepServiceLocationProps) {
  const zipOk = normalizeBookingServiceLocationZipParam(state.serviceLocationZip).length >= 5;

  return (
    <BookingSectionCard
      eyebrow="Step 3"
      title={BOOKING_LOCATION_STEP_TITLE}
      body={BOOKING_LOCATION_STEP_BODY}
    >
      <div className="space-y-8" data-testid="booking-step-location">
        <BookingTextField
          id="booking-service-location-zip"
          label={BOOKING_LOCATION_ZIP_LABEL}
          value={state.serviceLocationZip}
          onChange={(value) => onChange({ serviceLocationZip: value })}
          placeholder="e.g. 94103"
          helper={BOOKING_LOCATION_ZIP_HELPER}
        />
        <BookingTextField
          id="booking-service-location-address"
          label={BOOKING_LOCATION_ADDR_LABEL}
          value={state.serviceLocationAddressLine}
          onChange={(value) => onChange({ serviceLocationAddressLine: value })}
          placeholder={BOOKING_LOCATION_ADDR_PLACEHOLDER}
        />
        <div
          className={`rounded-2xl border px-5 py-4 ${
            zipOk
              ? "border-[#0D9488]/22 bg-[rgba(13,148,136,0.06)]"
              : "border-[#C9B27C]/18 bg-white"
          }`}
        >
          <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
            {zipOk
              ? "Location meets the minimum we need before team matching."
              : "Continue stays disabled on the next step until the service ZIP is at least five characters."}
          </p>
        </div>
      </div>
    </BookingSectionCard>
  );
}
