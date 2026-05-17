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
      <header>
        <h1 className={`text-xl font-bold ${theme.accent}`}>Your visits</h1>
        <p className="mt-1 text-sm text-slate-600">
          A simple view of upcoming service and helpful Nu Standard guidance.
        </p>
      </header>

      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        data-testid="customer-dashboard-knowledge-card"
      >
        <h2 className="text-sm font-semibold text-slate-900">Cleaning Encyclopedia</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Browse answers on surfaces, stains, safe methods, and how cleaning works — the same knowledge hub
          we use to keep standards consistent.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/search"
            className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Search Knowledge
          </Link>
          <Link
            href="/encyclopedia"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Browse Encyclopedia
          </Link>
        </div>
      </section>

      {recs.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="customer-dashboard-recommendations">
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Visit summary</p>
        {visitSummaryRows.length > 0 ? (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {visitSummaryRows.map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {humanizeCountLabel(key)}
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            We&apos;ll show visit totals here once activity is available.
          </p>
        )}
      </section>
    </div>
  );
}
