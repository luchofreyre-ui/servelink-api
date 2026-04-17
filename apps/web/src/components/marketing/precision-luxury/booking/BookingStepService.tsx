import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import type { BookingDeepCleanProgramChoice } from "./bookingFlowTypes";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import {
  bookingServiceCatalog,
  getBookingServiceCatalogItem,
} from "./bookingServiceCatalog";

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
      title="Choose your service"
      body="Pick the visit type that fits your home. You can switch before you send your request."
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
                Same thorough scope either way: one full visit, or three focused
                visits over time. It changes pacing and scheduling—not the level
                of care.
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
                Same scope split across three visits: a strong foundation first,
                then two detail passes. Easier scheduling day-to-day with the
                same thoroughness.
              </p>
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Your selection
        </p>
        <p className="mt-2 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
          {getBookingServiceCatalogItem(serviceId).title}
        </p>
        {showDeepProgram ? (
          <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
            Deep clean plan:{" "}
            <span className="font-medium text-[#0F172A]">
              {deepCleanProgram === "phased_3_visit"
                ? "Three visits"
                : "One visit"}
            </span>
          </p>
        ) : (
          <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
            You can change the service above before you continue.
          </p>
        )}
      </div>
    </BookingSectionCard>
  );
}
