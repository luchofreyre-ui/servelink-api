import { useState, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { ShipmentPlannerFilters } from "../../../features/supply/components/ShipmentPlannerFilters";
import { ShipmentPlannerTable } from "../../../features/supply/components/ShipmentPlannerTable";
import { ShipmentPlannerDrawer } from "../../../features/supply/components/ShipmentPlannerDrawer";
import { useShipmentPlanner } from "../../../features/supply/hooks/useSupply";
import type { ShipmentPlannerItem } from "../../../features/supply/api/types";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

export function ShipmentPlannerPage() {
  const [drawerItem, setDrawerItem] = useState<ShipmentPlannerItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<{ riskLevel: string; shipWindow: string; search: string }>({
    riskLevel: "",
    shipWindow: "",
    search: "",
  });

  useEffect(() => {
    setAdminDocumentTitle("Shipment Planner");
  }, []);

  const params =
    filters.riskLevel || filters.shipWindow || filters.search
      ? {
          riskLevel: filters.riskLevel || undefined,
          shipWindow: filters.shipWindow || undefined,
          search: filters.search || undefined,
        }
      : undefined;

  const { data, isLoading, isError, error, refetch } = useShipmentPlanner(params);
  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;
  const items = data?.items ?? [];

  if (isLoading) {
    return <AdminLoadingState message="Loading shipment planner…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader
          title="Shipment Planner"
          subtitle="Suggested refill shipments by FO."
        />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply/shipment-planner" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load shipment planner."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Shipment Planner"
        subtitle="Suggested refill shipments by FO. Risk and priority SKUs."
      />
      <SupplyBackendBanner />
      <div className="mb-4">
        <ShipmentPlannerFilters filters={filters} onChange={setFilters} />
      </div>
      <section className="rounded-2xl border bg-white p-4">
        {items.length === 0 ? (
          <AdminEmptyState
            title="No shipment suggestions"
            description="No suggested shipments for the current filters."
          />
        ) : (
          <ShipmentPlannerTable
            items={items}
            onRowClick={(item) => {
              setDrawerItem(item);
              setDrawerOpen(true);
            }}
          />
        )}
      </section>
      <ShipmentPlannerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={drawerItem}
      />
    </div>
  );
}
