import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { FoSupplySummaryCard } from "../../../features/supply/components/FoSupplySummaryCard";
import { FoSkuNeedTable } from "../../../features/supply/components/FoSkuNeedTable";
import { FoShipmentHistoryTable } from "../../../features/supply/components/FoShipmentHistoryTable";
import { useFoSupplyDetail } from "../../../features/supply/hooks/useSupply";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

export function FoSupplyDetailPage() {
  const { foId } = useParams<{ foId: string }>();

  useEffect(() => {
    setAdminDocumentTitle(foId ? `FO ${foId}` : "FO Supply Detail");
  }, [foId]);

  const { data, isLoading, isError, error, refetch } = useFoSupplyDetail(foId);
  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;

  if (!foId) {
    return <AdminErrorState message="Missing FO ID." />;
  }

  if (isLoading) {
    return <AdminLoadingState message="Loading FO supply…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader title="FO Supply Detail" subtitle={`FO ${foId}`} />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply/franchise-owners/:foId" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load FO supply."}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <AdminPageHeader
        title="FO Supply Detail"
        subtitle={`${data.foName} (${data.foId})`}
      />
      <SupplyBackendBanner />
      <div className="space-y-6">
        <FoSupplySummaryCard detail={data} />
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">SKU needs</h2>
          <FoSkuNeedTable skuNeeds={data.skuNeeds} />
        </section>
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Shipment history</h2>
          <FoShipmentHistoryTable shipmentHistory={data.shipmentHistory} />
        </section>
      </div>
    </div>
  );
}
