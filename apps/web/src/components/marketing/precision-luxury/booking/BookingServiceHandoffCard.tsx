import type { BookingPublicPath } from "./bookingFlowTypes";
import {
  BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_BODY,
  BOOKING_PUBLIC_CARD_MOVE_BODY,
  BOOKING_PUBLIC_CARD_ONE_TIME_BODY,
  BOOKING_RECURRING_GATE_BODY,
} from "./bookingPublicSurfaceCopy";
import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";
import { getPublicBookingMarketingTitle } from "./publicBookingTaxonomy";

type BookingServiceHandoffCardProps = {
  serviceId: string;
  bookingPublicPath: BookingPublicPath;
};

export function BookingServiceHandoffCard({
  serviceId,
  bookingPublicPath,
}: BookingServiceHandoffCardProps) {
  const title = getPublicBookingMarketingTitle(bookingPublicPath);
  const catalog = getBookingServiceCatalogItem(serviceId);
  const body =
    bookingPublicPath === "recurring_auth_gate"
      ? BOOKING_RECURRING_GATE_BODY
      : bookingPublicPath === "move_transition"
        ? BOOKING_PUBLIC_CARD_MOVE_BODY
        : bookingPublicPath === "first_time_with_recurring"
          ? BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_BODY
          : bookingPublicPath === "one_time_cleaning"
            ? BOOKING_PUBLIC_CARD_ONE_TIME_BODY
            : catalog.shortDescription;

  return (
    <section className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.22em] text-[#C9B27C]">
        Your service
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
            {title}
          </h2>
          <p className="mt-2 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
            {body}
          </p>
        </div>

        <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
          {bookingPublicPath === "recurring_auth_gate"
            ? "Account"
            : catalog.bookingTag}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
        <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#0F172A]">
          {bookingPublicPath === "recurring_auth_gate"
            ? "Recurring visits are managed in your Nu Standard account—sign in to continue this path."
            : "We’ll carry this service choice into review, where the estimate and scheduling context come together before you select a team."}
        </p>
      </div>
    </section>
  );
}
