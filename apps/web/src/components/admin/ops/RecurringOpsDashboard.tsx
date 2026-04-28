import Link from "next/link";
import type {
  RecurringOpsExhaustedItem,
  RecurringOpsPageData,
  RecurringOpsSummary,
} from "@/lib/api/adminOps";

function statusForSummary(summary: RecurringOpsSummary | null): {
  label: string;
  className: string;
} {
  if (!summary) {
    return {
      label: "unavailable",
      className: "bg-amber-100 text-amber-800",
    };
  }
  const attention =
    summary.exhaustedCount +
    summary.failedRetryableCount +
    summary.reconciliationDriftCount +
    summary.canceledPlanWithBookedNextCount;
  if (attention > 0) {
    return {
      label: "attention",
      className: "bg-rose-100 text-rose-800",
    };
  }
  if (summary.processingCount > 0 || summary.pendingGenerationCount > 0) {
    return {
      label: "active",
      className: "bg-sky-100 text-sky-800",
    };
  }
  return {
    label: "healthy",
    className: "bg-emerald-100 text-emerald-800",
  };
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">
        {value ?? "-"}
      </div>
    </div>
  );
}

export function RecurringOpsDashboard({ data }: { data: RecurringOpsPageData }) {
  const summary = data.summary;
  const status = statusForSummary(summary);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/admin/ops" className="text-sm text-slate-500 underline">
              Back to admin ops
            </Link>
            <h1 className="mt-3 text-3xl font-semibold">Recurring Ops</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Read-only recurring generation health from the existing recurring
              ops endpoints. Exhausted rows are occurrences that need operator
              review after retry limits.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {data.unavailableReason ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Recurring ops data is partially unavailable: {data.unavailableReason}
          </section>
        ) : null}

        <section
          aria-label="Recurring ops summary"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <MetricCard
            label="Pending generation"
            value={summary?.pendingGenerationCount ?? null}
          />
          <MetricCard
            label="Processing"
            value={summary?.processingCount ?? null}
          />
          <MetricCard
            label="Failed retryable"
            value={summary?.failedRetryableCount ?? null}
          />
          <MetricCard label="Exhausted" value={summary?.exhaustedCount ?? null} />
          <MetricCard
            label="Reconciliation drift"
            value={summary?.reconciliationDriftCount ?? null}
          />
          <MetricCard
            label="Canceled plans with booked next"
            value={summary?.canceledPlanWithBookedNextCount ?? null}
          />
        </section>

        <section
          aria-label="Exhausted recurring occurrences"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">
              Exhausted Recurring Occurrences
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Rows are returned by <code>/api/v1/recurring/ops/exhausted</code>.
            </p>
          </div>
          <RecurringExhaustedTable items={data.exhausted} />
        </section>
      </div>
    </main>
  );
}

function RecurringExhaustedTable({
  items,
}: {
  items: RecurringOpsExhaustedItem[];
}) {
  if (!items.length) {
    return (
      <div className="p-4 text-sm text-slate-500">
        No exhausted recurring occurrences.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left">
            <th className="p-2">Occurrence</th>
            <th className="p-2">Plan</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Attempts</th>
            <th className="p-2">Status</th>
            <th className="p-2">Reconciliation</th>
            <th className="p-2">Booking</th>
            <th className="p-2">Error</th>
            <th className="p-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.occurrenceId} className="border-b align-top">
              <td className="p-2 font-mono text-xs">{item.occurrenceId}</td>
              <td className="p-2 font-mono text-xs">{item.planId}</td>
              <td className="p-2">
                <div>{item.customerEmail}</div>
                <div className="font-mono text-xs text-slate-500">
                  {item.customerId}
                </div>
              </td>
              <td className="p-2">{item.processingAttempts}</td>
              <td className="p-2">{item.status}</td>
              <td className="p-2">{item.reconciliationState ?? "-"}</td>
              <td className="p-2">
                {item.bookingId ? (
                  <Link
                    href={`/admin/bookings/${item.bookingId}`}
                    className="font-mono text-xs text-sky-700 underline"
                  >
                    {item.bookingId}
                  </Link>
                ) : (
                  "-"
                )}
              </td>
              <td className="max-w-[260px] break-words p-2 text-xs">
                {item.generationError ?? "-"}
              </td>
              <td className="p-2 whitespace-nowrap">
                {formatDateTime(item.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
