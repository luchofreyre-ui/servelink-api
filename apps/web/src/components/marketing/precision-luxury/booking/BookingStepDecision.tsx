import { BookingStepFrame } from "./BookingStepFrame";

export type BookingDecisionOption = {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
};

type BookingStepDecisionProps = {
  title?: string;
  description?: string;
  options: BookingDecisionOption[];
  onSelect: (id: string) => void;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
};

export function BookingStepDecision({
  title = "Choose the booking path",
  description = "Select the path that matches the visit you want to schedule so the remaining steps stay aligned with the real booking contract.",
  options,
  onSelect,
  footer,
  aside,
}: BookingStepDecisionProps) {
  return (
    <BookingStepFrame
      eyebrow="Decision"
      title={title}
      description={description}
      footer={footer}
      aside={aside}
    >
      <div className="grid gap-4">
        {options.map((option) => {
          const isSelected = option.selected;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={option.disabled}
              aria-pressed={isSelected}
              className={`w-full rounded-[24px] border p-5 text-left transition ${
                isSelected
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400"
              } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold md:text-lg">
                      {option.label}
                    </h3>
                    {option.badge ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          isSelected
                            ? "bg-white/15 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {option.badge}
                      </span>
                    ) : null}
                  </div>

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
    </BookingStepFrame>
  );
}
