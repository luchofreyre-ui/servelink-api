import type { ReactNode, Ref } from "react";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import { BookingSectionCard } from "../BookingSectionCard";
import { BookingTextField } from "./BookingTextField";
import { getSelectedService } from "./bookingFlowData";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import type { BookingFlowState } from "./bookingFlowTypes";
import {
  formatEstimateConfidence,
  formatEstimateDurationMinutes,
  formatEstimateUsdFromCents,
} from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import {
  getBookingCustomerEmailError,
  getBookingCustomerNameError,
  isBookingContactValid,
} from "./bookingContactValidation";

type BookingStepReviewProps = {
  state: BookingFlowState;
  previewEstimate: FunnelReviewEstimate | null;
  previewDeepCleanCard: DeepCleanProgramDisplay | null;
  previewLoading: boolean;
  previewError: string | null;
  previewFetchCompleted: boolean;
  previewErrorRef?: Ref<HTMLParagraphElement>;
  showContactFieldErrors: boolean;
  onContactChange: (
    patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
  ) => void;
};

function isHomeComplete(state: BookingFlowState) {
  return !!state.homeSize && !!state.bedrooms && !!state.bathrooms;
}

function isScheduleComplete(state: BookingFlowState) {
  return !!state.frequency && !!state.preferredTime;
}

function isBookingReady(state: BookingFlowState) {
  return !!state.serviceId && isHomeComplete(state) && isScheduleComplete(state);
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
      <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
        {title}
      </p>
      <div className="mt-3 font-[var(--font-manrope)] text-base text-[#0F172A]">
        {children}
      </div>
    </div>
  );
}

function deepProgramFallbackLabel(state: BookingFlowState) {
  return state.deepCleanProgram === "phased_3_visit"
    ? "3-visit deep clean program"
    : "One-visit deep clean";
}

export function BookingStepReview({
  state,
  previewEstimate,
  previewDeepCleanCard,
  previewLoading,
  previewError,
  previewFetchCompleted,
  previewErrorRef,
  showContactFieldErrors,
  onContactChange,
}: BookingStepReviewProps) {
  const service = getSelectedService(state.serviceId);
  const homeOk = isHomeComplete(state);
  const scheduleOk = isScheduleComplete(state);
  const ready = isBookingReady(state);
  const contactOk = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );
  const bannerReady = ready && contactOk;
  const deep = isDeepCleaningBookingServiceId(state.serviceId);

  const petsDisplay = state.pets?.trim() ? state.pets : "Not specified";

  const nameError =
    showContactFieldErrors && !contactOk
      ? getBookingCustomerNameError(state.customerName)
      : null;
  const emailError =
    showContactFieldErrors && !contactOk
      ? getBookingCustomerEmailError(state.customerEmail)
      : null;

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title="Review your booking direction"
      body="Confirm everything looks right before we lock in your direction. You can go back to adjust any step."
    >
      <div
        className={`mb-8 rounded-2xl border px-5 py-4 ${
          bannerReady
            ? "border-[#0D9488]/25 bg-[rgba(13,148,136,0.08)]"
            : "border-[#C9B27C]/20 bg-white"
        }`}
      >
        <p
          className={`font-[var(--font-manrope)] text-sm font-medium leading-6 ${
            bannerReady ? "text-[#0F766E]" : "text-[#92400E]"
          }`}
        >
          {!ready
            ? "Complete the missing details before confirming your booking direction."
            : !contactOk
              ? "Add your contact details so we can follow up on your booking direction."
              : "Everything needed to book is in place."}
        </p>
      </div>

      <div className="grid gap-4">
        <ReviewSection title="Service">
          <p className="font-medium">{service.title}</p>
          {deep ? (
            <div className="mt-3 border-t border-[#C9B27C]/14 pt-3">
              {previewDeepCleanCard ? (
                <DeepCleanProgramCard
                  program={previewDeepCleanCard}
                  className="text-[#0F172A]"
                />
              ) : previewLoading ? (
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  Loading program breakdown…
                </p>
              ) : previewError ? null : (
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {deepProgramFallbackLabel(state)}
                </p>
              )}
            </div>
          ) : null}
        </ReviewSection>

        <ReviewSection title="Indicative estimate">
          {previewLoading ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              Calculating your estimate…
            </p>
          ) : null}
          {!previewLoading && previewEstimate?.source === "server" ? (
            <p className="font-[var(--font-manrope)] text-xs text-[#64748B]">
              Live preview from our pricing engine (same inputs as when you
              confirm).
            </p>
          ) : null}
          {!previewLoading && previewEstimate?.source === "local" ? (
            <p className="font-[var(--font-manrope)] text-xs text-[#64748B]">
              Simplified on-page estimate from your home size and service type.
              The live preview could not be reached — confirm your direction for
              an official saved quote.
            </p>
          ) : null}
          {!previewLoading && !previewError && !previewEstimate && !previewFetchCompleted ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              Preparing estimate…
            </p>
          ) : null}
          {previewError ? (
            <p
              ref={previewErrorRef}
              className="font-[var(--font-manrope)] text-sm font-medium text-[#B45309]"
            >
              {previewError}{" "}
              <span className="font-normal text-[#92400E]">
                You can still confirm your booking direction.
              </span>
            </p>
          ) : null}
          {previewEstimate ? (
            <div className="space-y-2">
              <p className="font-medium">
                <span className="text-[#64748B]">Price:</span>{" "}
                {formatEstimateUsdFromCents(previewEstimate.priceCents)}
              </p>
              <p className="font-medium">
                <span className="text-[#64748B]">Duration:</span>{" "}
                {formatEstimateDurationMinutes(previewEstimate.durationMinutes)}
              </p>
              <p className="font-medium">
                <span className="text-[#64748B]">Confidence:</span>{" "}
                {formatEstimateConfidence(previewEstimate.confidence)}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {previewEstimate.source === "server"
                  ? "Final numbers may adjust slightly when your booking is confirmed."
                  : "Figures are indicative only; confirming saves your direction so we can return an authoritative quote."}
              </p>
            </div>
          ) : previewFetchCompleted && !previewLoading && !previewError ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              Estimate unavailable for this step.
            </p>
          ) : null}
        </ReviewSection>

        <ReviewSection title="Home details">
          {homeOk ? (
            <p className="font-medium">
              {state.bedrooms} · {state.bathrooms} · {state.homeSize}
            </p>
          ) : (
            <p className="font-semibold text-[#B91C1C]">Incomplete</p>
          )}
        </ReviewSection>

        <ReviewSection title="Schedule">
          {scheduleOk ? (
            <div className="space-y-1">
              <p className="font-medium">
                <span className="text-[#64748B]">Frequency:</span>{" "}
                {state.frequency}
              </p>
              <p className="font-medium">
                <span className="text-[#64748B]">Preferred timing:</span>{" "}
                {state.preferredTime}
              </p>
            </div>
          ) : (
            <p className="font-semibold text-[#B91C1C]">Incomplete</p>
          )}
        </ReviewSection>

        <ReviewSection title="Optional details">
          <p className="font-medium">
            <span className="text-[#64748B]">Pets:</span> {petsDisplay}
          </p>
        </ReviewSection>

        <ReviewSection title="Your contact">
          <p className="mb-4 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            We will use this to confirm your direction and reach you with next
            steps.
          </p>
          <div className="space-y-4">
            <BookingTextField
              id="booking-customer-name"
              label="Full name"
              value={state.customerName}
              onChange={(value) => onContactChange({ customerName: value })}
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
              onChange={(value) => onContactChange({ customerEmail: value })}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={Boolean(emailError)}
              helper={emailError ?? undefined}
            />
          </div>
          {contactOk ? (
            <div className="mt-4 border-t border-[#C9B27C]/14 pt-4">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Confirm before sending
              </p>
              <p className="mt-2 font-medium">
                <span className="text-[#64748B]">Name:</span>{" "}
                {state.customerName.trim()}
              </p>
              <p className="mt-1 font-medium">
                <span className="text-[#64748B]">Email:</span>{" "}
                {state.customerEmail.trim()}
              </p>
            </div>
          ) : null}
        </ReviewSection>
      </div>
    </BookingSectionCard>
  );
}
