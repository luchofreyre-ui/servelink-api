import Link from "next/link";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import {
  isDeepCleanServiceType,
  selectDeepCleanFieldsFromScreen,
} from "@/booking-screen/deepCleanScreenSelectors";
import {
  mapBookingScreenExecutionToDisplay,
  mapBookingScreenProgramToDisplay,
} from "@/mappers/deepCleanProgramMappers";
import { buildFoKnowledgeHref } from "@/components/knowledge/fo/buildFoKnowledgeHref";
import { FoRecommendedKnowledgeBlock } from "./FoRecommendedKnowledgeBlock";
import { DeepCleanExecutionPanel } from "./DeepCleanExecutionPanel";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function FranchiseOwnerBookingDetail({
  screen,
  fleetScreens: _fleetScreens,
}: {
  screen: unknown;
  fleetScreens: unknown[];
}) {
  const s = asRecord(screen);
  const booking = s ? asRecord(s.booking) : null;

  const fields = selectDeepCleanFieldsFromScreen(screen);
  const program = mapBookingScreenProgramToDisplay(fields.rawProgram);
  const isDeepClean = isDeepCleanServiceType(fields.serviceType);
  const bookingId = fields.bookingId;

  const executionDisplay = mapBookingScreenExecutionToDisplay(
    fields.rawExecution ?? null,
    program,
  );

  const knowledgeHubHref = bookingId
    ? buildFoKnowledgeHref({ bookingId })
    : buildFoKnowledgeHref({});
  const knowledgeQuickHref = bookingId
    ? buildFoKnowledgeHref({ bookingId }, { focusQuickSolve: true })
    : buildFoKnowledgeHref({}, { focusQuickSolve: true });

  return (
    <div className="space-y-6">
      {bookingId ? (
        <section
          className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm"
          data-testid="fo-booking-knowledge-guidance"
        >
          <p className="font-semibold text-slate-900">Knowledge guidance</p>
          <p className="mt-2 text-slate-700">
            Open the Knowledge Hub for <span className="font-medium">advisory</span> cleaning guidance tied to
            this booking (surfaces, problems, playbooks). This is not a guarantee of onsite conditions — your
            final judgment should always reflect what you actually see at the property.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={knowledgeHubHref}
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Open Knowledge Hub
            </Link>
            <Link
              href={knowledgeQuickHref}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Quick Solve for this job
            </Link>
          </div>
        </section>
      ) : null}

      {bookingId ? (
        <FoRecommendedKnowledgeBlock bookingId={bookingId} screen={screen} />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p className="font-semibold text-slate-900">Job detail</p>
        <dl className="mt-3 grid gap-2 text-slate-600">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Booking</dt>
            <dd className="font-mono text-slate-900">
              {bookingId || "—"}
            </dd>
          </div>
          {typeof booking?.status === "string" ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Status</dt>
              <dd className="text-slate-900">{booking.status}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {isDeepClean && program ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Deep clean program</p>
          <p className="mt-1 text-xs text-slate-500">
            Expected scope per visit. Scheduling is not automated from this
            screen.
          </p>
          <div className="mt-4">
            <DeepCleanProgramCard
              program={program}
              expectationHeadings
              hideEyebrow
            />
          </div>
        </section>
      ) : isDeepClean && !program ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-amber-950">
            Deep clean program details unavailable
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            This booking is deep clean, but no saved program breakdown was
            returned. Confirm scope with ops if needed.
          </p>
        </section>
      ) : null}

      {isDeepClean && program && executionDisplay && bookingId ? (
        <DeepCleanExecutionPanel
          bookingId={bookingId}
          execution={executionDisplay}
        />
      ) : isDeepClean && program && !executionDisplay ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-amber-950">
            Deep clean execution state unavailable
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            Expected tasks may still show above. Reload or contact ops if this
            persists.
          </p>
        </section>
      ) : null}
    </div>
  );
}
