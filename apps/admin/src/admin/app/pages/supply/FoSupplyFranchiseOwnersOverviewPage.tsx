import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { FoSupplyFleetOverviewTable } from "../../../features/supply/components/FoSupplyFleetOverviewTable";
import { useFoSupplyFleetOverview } from "../../../features/supply/hooks/useSupply";
import type { FoSupplyQueueState } from "../../../features/supply/api/types";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";

type FleetTab = "all" | FoSupplyQueueState;

const TABS: { key: FleetTab; label: string; queue?: FoSupplyQueueState }[] = [
  { key: "all", label: "All" },
  { key: "READY_TO_ACTIVATE", label: "Ready to activate", queue: "READY_TO_ACTIVATE" },
  { key: "BLOCKED_CONFIGURATION", label: "Blocked (config)", queue: "BLOCKED_CONFIGURATION" },
  { key: "ACTIVE_AND_READY", label: "Active & ready", queue: "ACTIVE_AND_READY" },
  { key: "ACTIVE_BUT_BLOCKED", label: "Active (blocked)", queue: "ACTIVE_BUT_BLOCKED" },
];

export function FoSupplyFranchiseOwnersOverviewPage() {
  const [tab, setTab] = useState<FleetTab>("all");
  const queue = tab === "all" ? undefined : tab;
  const { data, isLoading, isError, error, refetch } = useFoSupplyFleetOverview(
    queue ? { queue } : {},
  );

  useEffect(() => {
    setAdminDocumentTitle("FO supply fleet");
  }, []);

  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;

  if (isLoading) {
    return <AdminLoadingState message="Loading franchise owner supply…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader
          title="Franchise owner supply"
          subtitle="Fleet readiness and activation queue."
        />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply/franchise-owners" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load fleet overview."}
        onRetry={() => refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Franchise owner supply"
        subtitle="Fleet readiness, booking eligibility, and activation queue. Uses server readiness truth only."
      />
      <SupplyBackendBanner />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Draft / onboarding FOs appear as <strong>Blocked (config)</strong> until supply is
          complete; use row links for guided setup.
        </p>
        <Link
          to={ADMIN_ROUTES.foSupplyNew}
          className="inline-flex shrink-0 items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          data-testid="fo-supply-fleet-new-link"
        >
          New franchise owner
        </Link>
      </div>
      <section className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              tab === t.key
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </section>
      <section className="rounded-2xl border bg-white p-4">
        {items.length === 0 ? (
          <AdminEmptyState
            title="No franchise owners"
            description="No rows match this filter."
          />
        ) : (
          <FoSupplyFleetOverviewTable items={items} />
        )}
      </section>
    </div>
  );
}
