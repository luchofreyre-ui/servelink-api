import Link from "next/link";
import type { CustomerKnowledgeContext } from "@/customer/customerKnowledgeRecommendations";
import { getCustomerKnowledgeRecommendations } from "@/customer/customerKnowledgeRecommendations";
import type { RoleTheme } from "@/lib/role-theme";
import type { CustomerDashboardViewModel } from "@/dashboard/customer/customerDashboardViewModel";

function humanizeCountLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function CustomerDashboard({
  theme,
  vm,
  knowledgeContext,
}: {
  theme: RoleTheme;
  vm: CustomerDashboardViewModel;
  knowledgeContext?: CustomerKnowledgeContext;
}) {
  const recs = getCustomerKnowledgeRecommendations(knowledgeContext ?? {});
  const visitSummaryRows = Object.entries(vm.counts)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Nu Standard customer care
            </p>
            <h1 className={`mt-2 text-2xl font-bold tracking-tight ${theme.accent}`}>
              Your visits
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upcoming service, visit details, and helpful Nu Standard guidance in one calm place.
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Book another visit
          </Link>
        </div>
      </header>

      <section
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        data-testid="customer-dashboard-knowledge-card"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Home guidance
        </p>
        <h2 className="mt-2 text-base font-semibold text-slate-900">Cleaning Encyclopedia</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Browse answers on surfaces, stains, safe methods, and how cleaning works. It is the same
          knowledge hub we use to keep service standards consistent.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/search"
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Search Knowledge
          </Link>
          <Link
            href="/encyclopedia"
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Browse Encyclopedia
          </Link>
        </div>
      </section>

      {recs.length > 0 ? (
        <div
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          data-testid="customer-dashboard-recommendations"
        >
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Recommended for your home</h2>

          <div className="space-y-2">
            {recs.map((r) => (
              <a key={r.href} href={r.href} className="block text-sm text-slate-700 hover:underline">
                {r.title}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Visit summary</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A quick view of booking activity and care status.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {vm.queue.rows.length > 0
              ? `${vm.queue.rows.length} visit update${vm.queue.rows.length === 1 ? "" : "s"}`
              : "No open visit updates"}
          </p>
        </div>
        {visitSummaryRows.length > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {visitSummaryRows.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {humanizeCountLabel(key)}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
            <p className="font-medium text-slate-800">Your visit history will appear here.</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Once a booking is active, we&apos;ll show the important updates without exposing internal
              operations details.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
