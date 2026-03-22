import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import type {
  BookingFlowState,
  BookingFrequencyOption,
  BookingTimeOption,
} from "./bookingFlowTypes";

const frequencyOptions: BookingFrequencyOption[] = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "One-Time",
];

const timeOptions: BookingTimeOption[] = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Friday",
  "Saturday",
];

type BookingStepScheduleProps = {
  state: BookingFlowState;
  onFrequencySelect: (value: BookingFrequencyOption) => void;
  onTimeSelect: (value: BookingTimeOption) => void;
};

export function BookingStepSchedule({
  state,
  onFrequencySelect,
  onTimeSelect,
}: BookingStepScheduleProps) {
  return (
    <BookingSectionCard
      eyebrow="Step 3"
      title="Guide the client into a clear, high-confidence scheduling choice"
      body="This stage should feel structured and predictable, which increases trust before payment or confirmation."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-4 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred frequency
          </p>
          <div className="grid grid-cols-2 gap-4">
            {frequencyOptions.map((option) => (
              <div key={option} onClick={() => onFrequencySelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="Selected as a presentation example for the final booking UI."
                  selected={state.frequency === option}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred timing
          </p>
          <div className="grid gap-4">
            {timeOptions.map((option) => (
              <div key={option} onClick={() => onTimeSelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="Use polished scheduling options instead of cluttered date-picker-first UX."
                  selected={state.preferredTime === option}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </BookingSectionCard>
  );
}
