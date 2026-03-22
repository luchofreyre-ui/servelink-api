import { useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { SupplyOverviewTable } from "../../../features/supply/components/SupplyOverviewTable";
import { useSupplyOverview } from "../../../features/supply/hooks/useSupply";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

export function SupplyOverviewPage() {
  useEffect(() => {
    setAdminDocumentTitle("Supply");
  }, []);

  const { data, isLoading, isError, error, refetch } = useSupplyOverview();
  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;

  if (isLoading) {
    return <AdminLoadingState message="Loading supply overview…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader
          title="Supply Intelligence"
          subtitle="Supply overview across franchise owners."
        />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load supply."}
        onRetry={() => refetch()}
      />
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div>
        <AdminPageHeader
          title="Supply Intelligence"
          subtitle="Supply overview across franchise owners."
        />
        <SupplyBackendBanner />
        <section className="rounded-2xl border bg-white p-4">
          <AdminEmptyState
            title="No supply data"
            description="No franchise owner supply data in this view."
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Supply Intelligence"
        subtitle="Supply overview across franchise owners. Risk, demand, and recommended shipments."
      />
      <SupplyBackendBanner />
      <section className="rounded-2xl border bg-white p-4">
        <SupplyOverviewTable items={items} />
      </section>
    </div>
  );
}
