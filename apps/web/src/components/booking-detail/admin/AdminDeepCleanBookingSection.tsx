import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import {
  deepCleanExecutionPayloadLooksPresent,
  isDeepCleanServiceType,
  selectDeepCleanFieldsFromScreen,
} from "@/booking-screen/deepCleanScreenSelectors";
import {
  mapBookingScreenCalibrationToAdminDisplay,
  mapBookingScreenExecutionToAdminDisplay,
  mapBookingScreenProgramToDisplay,
} from "@/mappers/deepCleanProgramMappers";

import { AdminDeepCleanCalibrationPanel } from "./AdminDeepCleanCalibrationPanel";
import { DeepCleanExecutionReadOnlyPanel } from "../shared/DeepCleanExecutionReadOnlyPanel";

/**
 * Admin booking page: deep clean program + read-only execution from the same
 * `GET /api/v1/bookings/:id/screen` payload as other roles.
 */
export function AdminDeepCleanBookingSection({
  screen,
  screenError,
}: {
  screen: unknown | null;
  screenError?: string | null;
}) {
  if (screenError?.trim()) {
    return (
      <section
        aria-label="Deep clean program and visit execution"
        className="rounded-[28px] border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-xl font-semibold text-white">Booking screen</h2>
        <p className="mt-2 text-sm text-amber-200">
          Program and visit detail could not be loaded: {screenError}
        </p>
      </section>
    );
  }

  if (screen == null) {
    return null;
  }

  const fields = selectDeepCleanFieldsFromScreen(screen);
  if (!isDeepCleanServiceType(fields.serviceType)) {
    return null;
  }

  const program = mapBookingScreenProgramToDisplay(fields.rawProgram);
  const adminExecution = mapBookingScreenExecutionToAdminDisplay(
    fields.rawExecution ?? null,
    program,
  );
  const calibrationDisplay = mapBookingScreenCalibrationToAdminDisplay(
    fields.rawCalibration ?? null,
  );
  const executionPayload = deepCleanExecutionPayloadLooksPresent(
    fields.rawExecution,
  );
  const programMissingButExecution = !program && executionPayload;

  return (
    <section
      aria-label="Deep clean program and visit execution"
      className="space-y-4"
    >
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Deep clean program</h2>
        <p className="mt-1 text-sm text-white/60">
          Read-only inspection from the canonical booking screen (same data as
          franchise owner and customer).
        </p>

        {programMissingButExecution ? (
          <div
            className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            data-testid="admin-deep-clean-warning-program-missing"
          >
            Deep clean program definition unavailable for this booking.
            Execution data is present — verify persistence and screen mapping.
          </div>
        ) : null}

        {program ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900 shadow-sm">
            <DeepCleanProgramCard
              program={program}
              expectationHeadings
              hideEyebrow
            />
          </div>
        ) : !programMissingButExecution ? (
          <div className="mt-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
            Deep clean program definition unavailable for this booking.
          </div>
        ) : null}

        {program && !adminExecution ? (
          <div
            className="mt-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50"
            data-testid="admin-deep-clean-warning-execution-missing"
          >
            Deep clean execution details unavailable. Reload or verify the
            booking screen response.
          </div>
        ) : null}

        {adminExecution ? (
          <div className="mt-4">
            <DeepCleanExecutionReadOnlyPanel
              execution={adminExecution}
              showOperatorNotes
              tone="dark"
              title="Deep clean visit execution"
              subtitle="Per-visit status, timestamps, duration, and notes (read-only)."
            />
          </div>
        ) : null}

        {calibrationDisplay ? (
          <AdminDeepCleanCalibrationPanel calibration={calibrationDisplay} />
        ) : null}
      </div>
    </section>
  );
}
