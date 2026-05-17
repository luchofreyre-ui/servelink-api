import {
  NU_PREMIUM_TRANSITION,
  nuPremiumFocusRing,
} from "./ui/NuStandardPremiumPrimitives";

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
    <div className="rounded-[22px] border border-[#C9B27C]/16 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:gap-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div key={step.id} className="flex min-w-[8.25rem] flex-1 items-center gap-2 sm:min-w-0 sm:gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold font-[var(--font-manrope)] sm:h-11 sm:w-11 sm:text-sm ${NU_PREMIUM_TRANSITION} ${nuPremiumFocusRing} ${
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
                  className={`truncate font-[var(--font-manrope)] text-xs font-medium sm:text-sm ${
                    isActive || isComplete ? "text-[#0F172A]" : "text-[#475569]"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 ? (
                <div className="hidden h-px flex-1 bg-[#C9B27C]/20 xl:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
