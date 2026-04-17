import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";

type BookingServiceHandoffCardProps = {
  serviceId: string;
};

export function BookingServiceHandoffCard({
  serviceId,
}: BookingServiceHandoffCardProps) {
  const service = getBookingServiceCatalogItem(serviceId);

  return (
    <section className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.22em] text-[#C9B27C]">
        Your service
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
            {service.summaryLabel}
          </h2>
          <p className="mt-2 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
            {service.shortDescription}
          </p>
        </div>

        <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
          {service.bookingTag}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
        <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#0F172A]">
          You started from a service page, so this is pre-selected below. Your
          choice stays selected as you move through the steps—you can change it
          anytime.
        </p>
      </div>
    </section>
  );
}
