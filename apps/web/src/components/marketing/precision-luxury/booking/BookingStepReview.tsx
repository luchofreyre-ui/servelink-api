import { BookingSectionCard } from "../BookingSectionCard";
import { getSelectedService } from "./bookingFlowData";
import type { BookingFlowState } from "./bookingFlowTypes";

type BookingStepReviewProps = {
  state: BookingFlowState;
};

export function BookingStepReview({ state }: BookingStepReviewProps) {
  const service = getSelectedService(state.serviceId);

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title="Review the booking direction before confirmation"
      body="This review layer should make the client feel confident, informed, and fully oriented before the final commit."
    >
      <div className="grid gap-4">
        {[
          { label: "Service", value: service.title },
          { label: "Frequency", value: state.frequency },
          {
            label: "Home Details",
            value: `${state.bedrooms} · ${state.bathrooms} · ${state.homeSize}`,
          },
          { label: "Pets", value: state.pets },
          { label: "Preferred Timing", value: state.preferredTime },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4"
          >
            <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
              {item.label}
            </p>
            <p className="mt-2 font-[var(--font-manrope)] text-base text-[#0F172A]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </BookingSectionCard>
  );
}
