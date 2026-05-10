import { BOOKING_TRUST_RIBBON_ITEMS } from "./bookingPublicSurfaceCopy";

type BookingTrustRibbonProps = {
  className?: string;
};

/** Restrained operational trust strip — review, schedule, deposit surfaces only. */
export function BookingTrustRibbon({ className }: BookingTrustRibbonProps) {
  return (
    <p
      data-testid="booking-trust-ribbon"
      role="presentation"
      className={`rounded-2xl border border-[#C9B27C]/12 bg-[#FFF9F3]/80 px-4 py-2.5 font-[var(--font-manrope)] text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748B] ${className ?? ""}`}
    >
      {BOOKING_TRUST_RIBBON_ITEMS.join(" · ")}
    </p>
  );
}
