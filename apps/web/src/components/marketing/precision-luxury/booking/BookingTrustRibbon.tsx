import {
  BOOKING_TRUST_RIBBON_ITEMS,
  BOOKING_TRUST_RIBBON_SUBLINE,
} from "./bookingPublicSurfaceCopy";

type BookingTrustRibbonProps = {
  className?: string;
};

/** Restrained operational trust strip — review, schedule, deposit surfaces only. */
export function BookingTrustRibbon({ className }: BookingTrustRibbonProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <p
        data-testid="booking-trust-ribbon"
        role="presentation"
        className="rounded-2xl border border-[#C9B27C]/12 bg-[#FFF9F3]/80 px-4 py-3 font-[var(--font-manrope)] text-xs font-medium leading-relaxed tracking-normal text-[#64748B]"
      >
        {BOOKING_TRUST_RIBBON_ITEMS.join(" · ")}
      </p>
      <p className="px-1 font-[var(--font-manrope)] text-[11px] leading-snug text-[#94A3B8] md:text-xs md:leading-relaxed">
        {BOOKING_TRUST_RIBBON_SUBLINE}
      </p>
    </div>
  );
}
