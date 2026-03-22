type BookingFlowProgressProps = {
  currentStep: number;
  steps: Array<{
    id: number;
    label: string;
  }>;
};

export function BookingFlowProgress({
  currentStep,
  steps,
}: BookingFlowProgressProps) {
  return (
    <div className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold font-[var(--font-manrope)] ${
                  isActive
                    ? "border-[#0D9488] bg-[#0D9488] text-white shadow-[0_10px_30px_rgba(13,148,136,0.18)]"
                    : isComplete
                      ? "border-[#0D9488]/20 bg-[#0D9488]/10 text-[#0D9488]"
                      : "border-[#C9B27C]/25 bg-[#FFF9F3] text-[#475569]"
                }`}
              >
                {String(step.id).padStart(2, "0")}
              </div>

              <div className="min-w-0">
                <p
                  className={`font-[var(--font-manrope)] text-sm font-medium ${
                    isActive || isComplete ? "text-[#0F172A]" : "text-[#475569]"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 ? (
                <div className="hidden h-px flex-1 bg-[#C9B27C]/20 lg:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
