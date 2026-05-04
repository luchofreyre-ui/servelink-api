import Link from "next/link";
import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import type { BookingPublicPath } from "./bookingFlowTypes";
import {
  BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_BODY,
  BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE,
  BOOKING_PUBLIC_CARD_MOVE_BODY,
  BOOKING_PUBLIC_CARD_MOVE_TITLE,
  BOOKING_PUBLIC_CARD_ONE_TIME_BODY,
  BOOKING_PUBLIC_CARD_ONE_TIME_TITLE,
  BOOKING_PUBLIC_CARD_RECURRING_BODY,
  BOOKING_PUBLIC_CARD_RECURRING_TITLE,
  BOOKING_PUBLIC_SERVICE_SECTION_BODY,
  BOOKING_PUBLIC_SERVICE_SECTION_TITLE,
  BOOKING_RECURRING_GATE_BODY,
  BOOKING_RECURRING_GATE_HEADLINE,
  BOOKING_RECURRING_GATE_LOGIN_CTA,
  BOOKING_RECURRING_GATE_REGISTER_CTA,
} from "./bookingPublicSurfaceCopy";
import {
  PUBLIC_BOOK_INTERNAL_FIRST_TIME,
  PUBLIC_BOOK_INTERNAL_MOVE,
} from "./publicBookingTaxonomy";

export type PublicBookingServiceCardSelection =
  | { kind: "one_time_cleaning" }
  | { kind: "first_time_with_recurring" }
  | { kind: "move_transition" }
  | { kind: "recurring_auth_gate" };

type BookingStepServiceProps = {
  bookingPublicPath: BookingPublicPath;
  serviceId: string;
  onSelectPublicService: (selection: PublicBookingServiceCardSelection) => void;
};

export function BookingStepService({
  bookingPublicPath,
  serviceId,
  onSelectPublicService,
}: BookingStepServiceProps) {
  const oneTimeSelected =
    bookingPublicPath === "one_time_cleaning" &&
    serviceId === PUBLIC_BOOK_INTERNAL_FIRST_TIME;
  const firstRecurringSelected =
    bookingPublicPath === "first_time_with_recurring" &&
    serviceId === PUBLIC_BOOK_INTERNAL_FIRST_TIME;
  const moveSelected =
    bookingPublicPath === "move_transition" && serviceId === PUBLIC_BOOK_INTERNAL_MOVE;
  const recurringGate = bookingPublicPath === "recurring_auth_gate";

  return (
    <BookingSectionCard
      eyebrow="Step 1"
      title={BOOKING_PUBLIC_SERVICE_SECTION_TITLE}
      body={BOOKING_PUBLIC_SERVICE_SECTION_BODY}
    >
      <div className="grid gap-5" data-testid="booking-public-service-options">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPublicService({ kind: "one_time_cleaning" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectPublicService({ kind: "one_time_cleaning" });
            }
          }}
        >
          <BookingOptionCard
            title={BOOKING_PUBLIC_CARD_ONE_TIME_TITLE}
            body={BOOKING_PUBLIC_CARD_ONE_TIME_BODY}
            meta="Anonymous path"
            selected={oneTimeSelected}
          />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPublicService({ kind: "first_time_with_recurring" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectPublicService({ kind: "first_time_with_recurring" });
            }
          }}
        >
          <BookingOptionCard
            title={BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE}
            body={BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_BODY}
            meta="Anonymous path"
            selected={firstRecurringSelected}
          />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPublicService({ kind: "move_transition" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectPublicService({ kind: "move_transition" });
            }
          }}
        >
          <BookingOptionCard
            title={BOOKING_PUBLIC_CARD_MOVE_TITLE}
            body={BOOKING_PUBLIC_CARD_MOVE_BODY}
            meta="Anonymous path"
            selected={moveSelected}
          />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPublicService({ kind: "recurring_auth_gate" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectPublicService({ kind: "recurring_auth_gate" });
            }
          }}
        >
          <BookingOptionCard
            title={BOOKING_PUBLIC_CARD_RECURRING_TITLE}
            body={BOOKING_PUBLIC_CARD_RECURRING_BODY}
            meta="Login required"
            selected={recurringGate}
          />
        </div>
      </div>

      {recurringGate ? (
        <div
          className="mt-10 space-y-6 border-t border-[#C9B27C]/14 pt-8"
          data-testid="booking-recurring-auth-gate"
        >
          <div>
            <p className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
              {BOOKING_RECURRING_GATE_HEADLINE}
            </p>
            <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_RECURRING_GATE_BODY}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/customer/auth"
              className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-white shadow-[0_12px_32px_rgba(13,148,136,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
            >
              {BOOKING_RECURRING_GATE_LOGIN_CTA}
            </Link>
            <Link
              href="/customer/auth"
              className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/30 bg-white px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:border-[#C9B27C]/50"
            >
              {BOOKING_RECURRING_GATE_REGISTER_CTA}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Your selection
        </p>
        <p className="mt-2 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
          {oneTimeSelected
            ? BOOKING_PUBLIC_CARD_ONE_TIME_TITLE
            : firstRecurringSelected
              ? BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE
              : moveSelected
                ? BOOKING_PUBLIC_CARD_MOVE_TITLE
                : recurringGate
                  ? BOOKING_PUBLIC_CARD_RECURRING_TITLE
                  : "Choose a service to continue"}
        </p>
        <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
          {recurringGate
            ? "Choose First-Time Cleaning With Recurring Service above to price the opening reset and recurring cadence before deposit."
            : "You can change the service above before you continue."}
        </p>
      </div>
    </BookingSectionCard>
  );
}
