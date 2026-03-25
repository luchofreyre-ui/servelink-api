import Link from "next/link";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import {
  isDeepCleanServiceType,
  selectDeepCleanFieldsFromScreen,
} from "@/booking-screen/deepCleanScreenSelectors";
import { selectFoScenarioShortcuts } from "@/booking-screen/foKnowledgeScenarioShortcuts";
import {
  selectFoKnowledgeHubActionLinksFromScreen,
} from "@/booking-screen/foKnowledgeScreenSelectors";
import {
  mapBookingScreenExecutionToDisplay,
  mapBookingScreenProgramToDisplay,
} from "@/mappers/deepCleanProgramMappers";
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
  const bookingId =
    fields.bookingId ||
    (booking && typeof booking.id === "string" ? booking.id : "");

  const executionDisplay = mapBookingScreenExecutionToDisplay(
    fields.rawExecution ?? null,
    program,
  );

  const knowledgeActions =
    bookingId ? selectFoKnowledgeHubActionLinksFromScreen(screen, bookingId) : [];

  const shortcuts = selectFoScenarioShortcuts(screen);

  return (
    <div className="space-y-6">
      {bookingId && shortcuts.length > 0 ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4" data-testid="fo-booking-scenario-shortcuts">
          <h3 className="mb-2 text-sm font-semibold text-indigo-900">
            Recommended Quick Solve scenarios
          </h3>

          <div className="space-y-2">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="block rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {bookingId ? (
        <section
          className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm"
          data-testid="fo-booking-knowledge-guidance"
        >
          <p className="font-semibold text-slate-900">Knowledge guidance</p>
          <p className="mt-2 text-slate-700">
            Use <span className="font-medium">Quick Solve</span> when you want a structured surface + problem
            recommendation, or <span className="font-medium">Search Knowledge</span> to explore the encyclopedia
            with optional context from this booking. Advisory only — always confirm what you see on site.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="fo-booking-knowledge-actions">
            {knowledgeActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                data-testid={
                  action.label === "Open Quick Solve"
                    ? "fo-booking-open-quick-solve"
                    : action.label === "Search Knowledge"
                      ? "fo-booking-search-knowledge"
                      : undefined
                }
                className={
                  action.emphasis === "primary"
                    ? "inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    : "inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                }
              >
                {action.label}
              </Link>
            ))}
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
