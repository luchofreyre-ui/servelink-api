import type { ReactNode } from "react";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import { mapReviewDeepCleanChoiceToDisplay } from "@/mappers/deepCleanProgramMappers";
import { BookingSectionCard } from "../BookingSectionCard";
import { getSelectedService } from "./bookingFlowData";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import type { BookingFlowState } from "./bookingFlowTypes";

type BookingStepReviewProps = {
  state: BookingFlowState;
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

export function BookingStepReview({ state }: BookingStepReviewProps) {
  const service = getSelectedService(state.serviceId);
  const homeOk = isHomeComplete(state);
  const scheduleOk = isScheduleComplete(state);
  const ready = isBookingReady(state);
  const deep = isDeepCleaningBookingServiceId(state.serviceId);
  const reviewProgram = deep
    ? mapReviewDeepCleanChoiceToDisplay({
        deepCleanProgram:
          state.deepCleanProgram === "phased_3_visit"
            ? "phased_3_visit"
            : "single_visit",
      })
    : null;

  const petsDisplay = state.pets?.trim() ? state.pets : "Not specified";

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title="Review your booking direction"
      body="Confirm everything looks right before we lock in your direction. You can go back to adjust any step."
    >
      <div
        className={`mb-8 rounded-2xl border px-5 py-4 ${
          ready
            ? "border-[#0D9488]/25 bg-[rgba(13,148,136,0.08)]"
            : "border-[#C9B27C]/20 bg-white"
        }`}
      >
        <p
          className={`font-[var(--font-manrope)] text-sm font-medium leading-6 ${
            ready ? "text-[#0F766E]" : "text-[#92400E]"
          }`}
        >
          {ready
            ? "Everything needed to book is in place."
            : "Complete the missing details before confirming your booking direction."}
        </p>
      </div>

      <div className="grid gap-4">
        <ReviewSection title="Service">
          <p className="font-medium">{service.title}</p>
          {reviewProgram ? (
            <div className="mt-3 border-t border-[#C9B27C]/14 pt-3">
              <DeepCleanProgramCard
                program={reviewProgram}
                hideZeroPrices
                className="text-[#0F172A]"
              />
            </div>
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
      </div>
    </BookingSectionCard>
  );
}
