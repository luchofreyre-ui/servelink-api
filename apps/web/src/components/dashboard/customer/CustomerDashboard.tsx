import type { RoleTheme } from "@/lib/role-theme";
import type { CustomerDashboardViewModel } from "@/dashboard/customer/customerDashboardViewModel";

export function CustomerDashboard({
  theme,
  vm,
}: {
  theme: RoleTheme;
  vm: CustomerDashboardViewModel;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-xl font-bold ${theme.accent}`}>Your bookings</h1>
        <p className="mt-1 text-sm text-slate-600">Customer-safe view — no internal operations scores.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Summary (raw)</p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(vm.counts, null, 2)}
        </pre>
      </section>
    </div>
  );
}
