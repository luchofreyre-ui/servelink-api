import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";
import type { BookingFlowState } from "./bookingFlowTypes";

type BookingSummaryCardProps = {
  state: BookingFlowState;
};

export function BookingSummaryCard({ state }: BookingSummaryCardProps) {
  const selectedService = getBookingServiceCatalogItem(state.serviceId);

  return (
    <section className="rounded-[32px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
        Booking summary
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          {selectedService.summaryLabel}
        </h2>
        <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
          {selectedService.bookingTag}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { label: "Frequency", value: state.frequency },
          {
            label: "Home Profile",
            value: `${state.bedrooms} · ${state.bathrooms} · ${state.homeSize}`,
          },
          { label: "Preferred Timing", value: state.preferredTime },
          { label: "Pets", value: state.pets },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14"
          >
            <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-[#475569]">
              {item.label}
            </p>
            <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-[#0D9488]/18 bg-[#0D9488] p-5 text-white shadow-[0_14px_40px_rgba(13,148,136,0.16)]">
        <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-white/75">
          Premium booking standard
        </p>
        <p className="mt-3 font-[var(--font-manrope)] text-sm leading-7 text-white">
          The booking flow should feel as polished as the service itself. This summary keeps
          decisions visible and increases completion confidence.
        </p>
      </div>
    </section>
  );
}
