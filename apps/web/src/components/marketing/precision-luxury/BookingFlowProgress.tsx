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
    <div className="rounded-[18px] border border-[#C9B27C]/16 bg-white p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] max-[380px]:p-2 sm:rounded-[28px] sm:p-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 max-[380px]:gap-1.5 sm:gap-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div key={step.id} className="flex min-w-[7.25rem] flex-1 items-center gap-2 max-[380px]:min-w-[6.4rem] sm:min-w-0 sm:gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold font-[var(--font-manrope)] max-[380px]:h-6 max-[380px]:w-6 max-[380px]:text-[10px] sm:h-11 sm:w-11 sm:text-sm ${NU_PREMIUM_TRANSITION} ${nuPremiumFocusRing} ${
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
                  className={`truncate font-[var(--font-manrope)] text-[11px] font-medium max-[380px]:text-[10px] sm:text-sm ${
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
