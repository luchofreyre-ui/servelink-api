import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
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

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function CustomerBookingDetail({ screen }: { screen: unknown }) {
  const s = asRecord(screen);
  const booking = s ? asRecord(s.booking) : null;
  const bookingId =
    booking && typeof booking.id === "string" ? booking.id : "—";
  const bookingStatus =
    booking && typeof booking.status === "string" ? booking.status : null;

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
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Your booking</p>
        <dl className="mt-3 grid gap-2">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-slate-500">Reference</dt>
            <dd className="font-mono text-slate-900">{bookingId}</dd>
          </div>
          {bookingStatus ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-900">{bookingStatus}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {authorityEducation ? (
        <CustomerBookingEducationBlock context={authorityEducation} />
      ) : null}

      {isDeepClean && program ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
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
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Visit progress</p>
          <p className="mt-1">
            Progress information is not available yet. Check back later or
            contact us if you have questions about your visits.
          </p>
        </section>
      ) : null}

      {isDeepClean && !program ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
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
