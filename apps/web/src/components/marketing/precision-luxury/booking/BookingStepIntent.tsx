import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import { CUSTOMER_INTENT_OPTIONS } from "./bookingIntentCopy";
import type { CustomerIntent } from "./bookingFlowTypes";

type BookingStepIntentProps = {
  intent?: CustomerIntent;
  onChange: (intent: CustomerIntent) => void;
};

export function BookingStepIntent({ intent, onChange }: BookingStepIntentProps) {
  return (
    <BookingSectionCard
      eyebrow="Step 2"
      title="What brings you in today?"
      body="Choose the reason that best matches this booking. This only changes how we guide the flow today."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CUSTOMER_INTENT_OPTIONS.map((option) => (
          <BookingOptionCard
            key={option.value}
            title={option.title}
            body={option.subtitle}
            selected={intent === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-4 py-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
        We’ll use this as a lightweight signal for messaging and next-step
        suggestions. It does not change pricing, payment, or the estimate logic.
      </p>
    </BookingSectionCard>
  );
}
