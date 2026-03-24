import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import type { BookingDeepCleanProgramChoice } from "./bookingFlowTypes";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { bookingServiceCatalog } from "./bookingServiceCatalog";

type BookingStepServiceProps = {
  serviceId: string;
  onSelect: (serviceId: string) => void;
  deepCleanProgram: BookingDeepCleanProgramChoice;
  onDeepCleanProgramChange: (value: BookingDeepCleanProgramChoice) => void;
};

export function BookingStepService({
  serviceId,
  onSelect,
  deepCleanProgram,
  onDeepCleanProgramChange,
}: BookingStepServiceProps) {
  const showDeepProgram = isDeepCleaningBookingServiceId(serviceId);

  return (
    <BookingSectionCard
      eyebrow="Step 1"
      title="Choose the right service"
      body="The page should help the client select confidently without feeling overloaded."
    >
      <div className="grid gap-5">
        {bookingServiceCatalog.map((option) => (
          <div key={option.id} onClick={() => onSelect(option.id)}>
            <BookingOptionCard
              title={option.title}
              body={option.shortDescription}
              meta={option.meta}
              selected={serviceId === option.id}
            />
          </div>
        ))}
      </div>

      {showDeepProgram ? (
        <div className="mt-10 space-y-4 border-t border-[#C9B27C]/14 pt-8">
          <div>
            <p className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
              How should we structure your deep clean?
            </p>
            <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Same total scope either way: one intensive visit, or three focused
              visits spread over time. The program does not reduce work—it
              changes pacing and how visits are scheduled.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onDeepCleanProgramChange("single_visit")}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                deepCleanProgram === "single_visit"
                  ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] ring-2 ring-[#0D9488]/25"
                  : "border-[#C9B27C]/20 bg-white hover:border-[#C9B27C]/35"
              }`}
            >
              <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
                One-visit deep clean
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                Full deep clean completed in a single appointment—best when you
                want the home reset in one go.
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDeepCleanProgramChange("phased_3_visit")}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                deepCleanProgram === "phased_3_visit"
                  ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] ring-2 ring-[#0D9488]/25"
                  : "border-[#C9B27C]/20 bg-white hover:border-[#C9B27C]/35"
              }`}
            >
              <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
                3-visit deep clean program
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                Same scope split across three visits: heavy foundation first,
                then two detail-and-maintenance passes. Spreads labor and
                disruption; not a shortcut.
              </p>
            </button>
          </div>
        </div>
      ) : null}
    </BookingSectionCard>
  );
}
