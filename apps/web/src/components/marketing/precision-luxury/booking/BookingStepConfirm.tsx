import { BookingStepFrame } from "./BookingStepFrame";

export type BookingConfirmChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  detail?: string;
};

type BookingStepConfirmProps = {
  title?: string;
  description?: string;
  checklist: BookingConfirmChecklistItem[];
  summary?: React.ReactNode;
  warning?: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
};

export function BookingStepConfirm({
  title = "Confirm booking details",
  description = "Review the final booking state before confirmation so schedule, hold, and recurring intent stay in sync with the backend contract.",
  checklist,
  summary,
  warning,
  footer,
  aside,
}: BookingStepConfirmProps) {
  return (
    <BookingStepFrame
      eyebrow="Confirm"
      title={title}
      description={description}
      footer={footer}
      aside={aside}
    >
      <div className="space-y-5">
        {summary ? (
          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5">
            {summary}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-neutral-950">
              Final readiness checklist
            </h3>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-[18px] border border-neutral-100 bg-neutral-50 px-4 py-3"
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${
                    item.complete
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-amber-500 bg-white text-amber-600"
                  }`}
                >
                  {item.complete ? "✓" : "!"}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-950">
                    {item.label}
                  </p>
                  {item.detail ? (
                    <p className="text-sm leading-6 text-neutral-600">
                      {item.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {warning ? (
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
            {warning}
          </div>
        ) : null}
      </div>
    </BookingStepFrame>
  );
}
