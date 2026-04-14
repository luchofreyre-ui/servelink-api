import { AdminRecurringOperationsPanel } from "@/components/admin/ops/AdminRecurringOperationsPanel";
import { RecurringOpsDashboard } from "@/components/admin/ops/RecurringOpsDashboard";
import {
  getRecurringOpsExhausted,
  getRecurringOpsSummary,
  RECURRING_API_DOCUMENTED_ROUTES,
} from "@/components/marketing/precision-luxury/booking/bookingRecurringApi";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminRecurringOpsPage() {
  let summary: Awaited<ReturnType<typeof getRecurringOpsSummary>>["item"] | null =
    null;
  let exhausted: Awaited<ReturnType<typeof getRecurringOpsExhausted>>["items"] =
    [];
  let opsError: string | null = null;

  try {
    const [summaryRes, exhaustedRes] = await Promise.all([
      getRecurringOpsSummary(),
      getRecurringOpsExhausted(50),
    ]);
    summary = summaryRes.item;
    exhausted = exhaustedRes.items;
  } catch (err) {
    opsError =
      err instanceof Error ? err.message : "Failed to load recurring ops data.";
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Recurring Operations
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Operator surface for recurring system visibility and control. Live JWT probes run in
            the panel below; ops metrics load server-side with your admin session.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/ops"
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Back to ops home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <section aria-labelledby="recurring-system-status">
          <h2 id="recurring-system-status" className="text-lg font-semibold text-gray-900">
            System status
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Root, debug, ops summary, and customer-only routes (not probed with an admin token).
          </p>
          <div className="mt-4">
            <AdminRecurringOperationsPanel
              opsSummaryLoaded={summary != null}
              opsError={opsError}
            />
          </div>
        </section>

        <section
          aria-labelledby="recurring-contract-manifest"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 id="recurring-contract-manifest" className="text-lg font-semibold text-gray-900">
            Contract / route manifest
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Confirmed recurring HTTP routes from the Nest recurring module (same paths the web
            client may call). There is no separate manifest HTTP handler; this JSON is the
            source of truth compiled from the controllers.
          </p>
          <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
            {JSON.stringify(RECURRING_API_DOCUMENTED_ROUTES, null, 2)}
          </pre>
        </section>

        <section aria-labelledby="recurring-business-data">
          <h2 id="recurring-business-data" className="text-lg font-semibold text-gray-900">
            Business data
          </h2>
          {opsError ? (
            <div
              className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
              role="status"
            >
              <p className="font-semibold">Backend route present but request did not succeed</p>
              <p className="mt-1">{opsError}</p>
              <p className="mt-2 text-xs text-amber-900/90">
                Admin endpoints under <code className="font-mono">/api/v1/recurring/ops/*</code>{" "}
                require an authenticated admin session. Without it, this section stays empty by
                design.
              </p>
            </div>
          ) : summary ? (
            <div className="mt-4">
              <RecurringOpsDashboard summary={summary} exhausted={exhausted} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">No ops summary available.</p>
          )}
        </section>

        <section
          aria-labelledby="recurring-customer-surface"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 id="recurring-customer-surface" className="text-lg font-semibold text-gray-900">
            Customer recurring surface
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The app ships a customer plans page at{" "}
            <Link href="/customer/recurring" className="font-mono text-blue-700 hover:underline">
              /customer/recurring
            </Link>{" "}
            backed by <code className="rounded bg-gray-100 px-1 font-mono text-xs">GET /recurring/plans/me</code> and
            related plan routes (customer JWT).
          </p>
        </section>

        <section
          aria-labelledby="booking-funnel-intake-gap"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 id="booking-funnel-intake-gap" className="text-lg font-semibold text-gray-900">
            Public booking funnel vs intake API
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The marketing booking flow captures richer schedule preferences, cleaner preference
            intent, and recurring setup in client state and confirm summaries. The booking-direction
            intake DTO used for one-time submit does not yet expose first-class fields for those
            objects, so operators should treat them as funnel truth until intake and admin booking
            detail views are extended. Recurring plan creation uses authenticated{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-xs">POST /recurring/plans</code>{" "}
            with cadence and anchor timing from recurring setup.
          </p>
        </section>
      </div>
    </div>
  );
}
