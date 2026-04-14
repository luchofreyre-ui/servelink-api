import Link from "next/link";
import type {
  RecurringExhaustedRow,
  RecurringOpsSummaryItem,
} from "@/components/marketing/precision-luxury/booking/bookingRecurringApi";

export type RecurringOpsDashboardProps = {
  summary: RecurringOpsSummaryItem;
  exhausted: RecurringExhaustedRow[];
};

function SummaryCard(props: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {props.title}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
        {props.value}
      </p>
    </div>
  );
}

export function RecurringOpsDashboard(props: RecurringOpsDashboardProps) {
  const { summary, exhausted } = props;
  const drift = summary.reconciliationDriftCount > 0;

  return (
    <div className="space-y-6 border-t border-gray-200 bg-gray-50 p-6 text-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Orchestration metrics</h2>
          <p className="text-sm text-gray-500">
            Read-only visibility into occurrence generation, retries, and
            reconciliation drift from <code className="font-mono text-xs">GET /recurring/ops/*</code>.
          </p>
        </div>
        <Link
          href="/admin/ops"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          Ops home
        </Link>
      </div>

      {drift ? (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
          role="status"
        >
          <p className="font-semibold">Reconciliation drift detected</p>
          <p className="mt-1 text-sm">
            {summary.reconciliationDriftCount} occurrence
            {summary.reconciliationDriftCount === 1 ? "" : "s"} have a
            non-clean reconciliation state. Investigate before changing
            automation.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Pending generation"
          value={summary.pendingGenerationCount}
        />
        <SummaryCard title="Processing" value={summary.processingCount} />
        <SummaryCard
          title="Retryable failed"
          value={summary.failedRetryableCount}
        />
        <SummaryCard title="Exhausted" value={summary.exhaustedCount} />
        <SummaryCard
          title="Reconciliation drift"
          value={summary.reconciliationDriftCount}
        />
        <SummaryCard
          title="Canceled plans (booked occurrence)"
          value={summary.canceledPlanWithBookedNextCount}
        />
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Exhausted occurrences</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Occurrence</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Attempts</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reconciliation</th>
                <th className="px-3 py-2">Booking</th>
                <th className="px-3 py-2">Error</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {exhausted.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No exhausted occurrences.
                  </td>
                </tr>
              ) : (
                exhausted.map((row) => (
                  <tr
                    key={row.occurrenceId}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.occurrenceId}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.planId}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">{row.customerId}</div>
                      {row.customerEmail ? (
                        <div className="text-xs text-gray-600">
                          {row.customerEmail}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.processingAttempts}
                    </td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2 text-xs">
                      {row.reconciliationState ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.bookingId ?? "—"}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-red-800">
                      {row.generationError ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                      {row.updatedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
