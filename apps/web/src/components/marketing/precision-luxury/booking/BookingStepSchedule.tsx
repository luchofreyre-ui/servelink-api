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
      title="Choose your schedule"
      body="Select how often and when you’d like service. You can adjust this later."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-2 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred frequency
          </p>

          {!state.frequency && (
            <p className="mb-4 text-sm text-[#64748B]">
              Choose how often you want service.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {frequencyOptions.map((option) => (
              <div key={option} onClick={() => onFrequencySelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="Select the cadence that fits your lifestyle."
                  selected={state.frequency === option}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred timing
          </p>

          {!state.preferredTime && (
            <p className="mb-4 text-sm text-[#64748B]">
              Choose a time window that works best for your routine.
            </p>
          )}

          <div className="grid gap-4">
            {timeOptions.map((option) => (
              <div key={option} onClick={() => onTimeSelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="We’ll match you with availability in this window."
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
