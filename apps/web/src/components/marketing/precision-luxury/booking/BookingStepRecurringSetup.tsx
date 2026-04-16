import { BookingStepFrame } from "./BookingStepFrame";

export type BookingRecurringFrequencyOption = {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
};

type BookingStepRecurringSetupProps = {
  title?: string;
  description?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  frequencyOptions: BookingRecurringFrequencyOption[];
  onSelectFrequency: (id: string) => void;
  cadenceSummary?: string | null;
  notes?: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
};

export function BookingStepRecurringSetup({
  title = "Set up recurring service",
  description = "Turn recurring on only when the visit should continue on a defined cadence. This step exists to keep recurring intent separate from one-time scheduling and hold confirmation.",
  enabled,
  onEnabledChange,
  frequencyOptions,
  onSelectFrequency,
  cadenceSummary,
  notes,
  footer,
  aside,
}: BookingStepRecurringSetupProps) {
  return (
    <BookingStepFrame
      eyebrow="Recurring"
      title={title}
      description={description}
      footer={footer}
      aside={aside}
    >
      <div className="space-y-6">
        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-950">
                Recurring plan
              </h3>
              <p className="text-sm leading-6 text-neutral-600">
                Keep this on only when the customer expects future visits to be created from the same service contract.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onEnabledChange(!enabled)}
              aria-pressed={enabled}
              className={`inline-flex min-w-[132px] items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                enabled
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-300 bg-white text-neutral-900"
              }`}
            >
              {enabled ? "Recurring on" : "Recurring off"}
            </button>
          </div>
        </div>

        {enabled ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              {frequencyOptions.map((option) => {
                const isSelected = option.selected;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectFrequency(option.id)}
                    disabled={option.disabled}
                    aria-pressed={isSelected}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                      isSelected
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400"
                    } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold md:text-[15px]">
                          {option.label}
                        </h4>
                        <p
                          className={`text-sm leading-6 ${
                            isSelected ? "text-white/85" : "text-neutral-600"
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>

                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full border ${
                          isSelected
                            ? "border-white bg-white"
                            : "border-neutral-300 bg-transparent"
                        }`}
                      >
                        {isSelected ? (
                          <div className="mx-auto mt-[3px] h-2.5 w-2.5 rounded-full bg-neutral-950" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {cadenceSummary ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-medium text-emerald-900">
                  {cadenceSummary}
                </p>
              </div>
            ) : null}

            {notes ? <div>{notes}</div> : null}
          </div>
        ) : null}
      </div>
    </BookingStepFrame>
  );
}
