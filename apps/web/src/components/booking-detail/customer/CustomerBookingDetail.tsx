import Link from "next/link";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { BOOKING_CONFIRMATION_TEAM_PREP_TITLE } from "@/components/marketing/precision-luxury/booking/bookingPublicSurfaceCopy";
import { selectCustomerAuthorityEducationalContext } from "@/booking-screen/customerAuthorityEducationSelectors";
import {
  isDeepCleanServiceType,
  selectDeepCleanFieldsFromScreen,
} from "@/booking-screen/deepCleanScreenSelectors";
import { CustomerBookingEducationBlock } from "./CustomerBookingEducationBlock";
import {
  mapBookingScreenExecutionToCustomerDisplay,
  mapBookingScreenProgramToDisplay,
} from "@/mappers/deepCleanProgramMappers";

import { DeepCleanExecutionReadOnlyPanel } from "../shared/DeepCleanExecutionReadOnlyPanel";
import {
  extractCustomerTeamPrepFromBookingNotes,
  formatBookingReferenceLabel,
} from "@/lib/bookings/bookingDisplay";
import type { BookingStatus } from "@/lib/bookings/bookingApiTypes";

const CUSTOMER_VISIBLE_BOOKING_STATUSES = new Set<BookingStatus>([
  "pending_payment",
  "pending_dispatch",
  "hold",
  "review",
  "offered",
  "assigned",
  "accepted",
  "en_route",
  "active",
  "in_progress",
  "completed",
  "canceled",
  "cancelled",
  "exception",
]);

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function asCustomerVisibleBookingStatus(status: string | null): BookingStatus | null {
  return status && CUSTOMER_VISIBLE_BOOKING_STATUSES.has(status as BookingStatus)
    ? (status as BookingStatus)
    : null;
}

export function CustomerBookingDetail({ screen }: { screen: unknown }) {
  const s = asRecord(screen);
  const booking = s ? asRecord(s.booking) : null;
  const bookingId =
    booking && typeof booking.id === "string" ? booking.id : "—";
  const bookingReference =
    bookingId !== "—" ? formatBookingReferenceLabel(bookingId) : "Reference pending";
  const bookingStatus = asCustomerVisibleBookingStatus(
    booking && typeof booking.status === "string" ? booking.status : null,
  );

  const bookingNotes =
    booking && typeof (booking as { notes?: unknown }).notes === "string"
      ? String((booking as { notes?: string }).notes)
      : null;
  const teamPrepDetails =
    extractCustomerTeamPrepFromBookingNotes(bookingNotes);

  const fields = selectDeepCleanFieldsFromScreen(screen);
  const isDeepClean = isDeepCleanServiceType(fields.serviceType);
  const program = mapBookingScreenProgramToDisplay(fields.rawProgram);
  const customerExecution = mapBookingScreenExecutionToCustomerDisplay(
    fields.rawExecution ?? null,
    program,
  );

  const authorityEducation = selectCustomerAuthorityEducationalContext(screen);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Visit details
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Your booking
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              We&apos;ll keep this page updated with the details you need before and after your visit.
            </p>
          </div>
          {bookingStatus ? (
            <BookingStatusBadge status={bookingStatus} />
          ) : null}
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Reference</dt>
            <dd className="mt-1 font-semibold text-slate-900">{bookingReference}</dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Next step</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {bookingStatus === "pending_payment"
                ? "Finish deposit"
                : bookingStatus === "completed"
                  ? "Visit complete"
                  : "We’ll keep this page updated"}
            </dd>
          </div>
        </dl>
      </section>

      {authorityEducation ? (
        <CustomerBookingEducationBlock context={authorityEducation} />
      ) : null}

      {teamPrepDetails ? (
        <section
          data-testid="customer-booking-team-prep"
          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm sm:p-6"
        >
          <h2 className="font-semibold text-slate-900">
            {BOOKING_CONFIRMATION_TEAM_PREP_TITLE}
          </h2>
          <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
            {teamPrepDetails}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            For your crew on arrival — not used to change your quoted visit total.
          </p>
        </section>
      ) : null}

      <section
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm sm:p-6"
        data-testid="customer-booking-knowledge-card"
      >
        <h2 className="font-semibold text-slate-900">Need cleaning guidance?</h2>
        <p className="mt-2 leading-6 text-slate-600">
          Explore how we think about surfaces, stains, and safe cleaning — search topics or browse the
          encyclopedia anytime.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/search"
            className="inline-flex min-h-[42px] items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Search
          </Link>
          <Link
            href="/encyclopedia"
            className="inline-flex min-h-[42px] items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Encyclopedia
          </Link>
        </div>
      </section>

      {isDeepClean && program ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-slate-900">
            Your deep clean program
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Visits and scope included with your booking.
          </p>
          <div className="mt-4">
            <DeepCleanProgramCard
              program={program}
              expectationHeadings
              hideEyebrow
            />
          </div>
        </section>
      ) : null}

      {isDeepClean && program && customerExecution ? (
        <DeepCleanExecutionReadOnlyPanel
          execution={customerExecution}
          showOperatorNotes={false}
          tone="light"
        />
      ) : null}

      {isDeepClean && program && !customerExecution ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 sm:p-6">
          <p className="font-medium text-slate-800">Visit progress</p>
          <p className="mt-1">
            Progress information is not available yet. Check back later or
            contact us if you have questions about your visits.
          </p>
        </section>
      ) : null}

      {isDeepClean && !program ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 sm:p-6">
          <p className="font-medium text-slate-800">Deep clean details</p>
          <p className="mt-1">
            We couldn&apos;t load your visit breakdown right now. Your booking
            is still on file — contact us if you need help.
          </p>
        </section>
      ) : null}
    </div>
  );
}
