import Link from "next/link";
import type { CustomerKnowledgeContext } from "@/customer/customerKnowledgeRecommendations";
import { getCustomerKnowledgeRecommendations } from "@/customer/customerKnowledgeRecommendations";
import type { RoleTheme } from "@/lib/role-theme";
import type { CustomerDashboardViewModel } from "@/dashboard/customer/customerDashboardViewModel";

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
  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-xl font-bold ${theme.accent}`}>Your bookings</h1>
        <p className="mt-1 text-sm text-slate-600">Customer-safe view — no internal operations scores.</p>
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Summary (raw)</p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(vm.counts, null, 2)}
        </pre>
      </section>
    </div>
  );
}
