import { useState, useMemo, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AnomaliesFilters } from "../../../features/anomalies/components/AnomaliesFilters";
import { AnomaliesTable } from "../../../features/anomalies/components/AnomaliesTable";
import { AnomalyDetailDrawer } from "../../../features/anomalies/components/AnomalyDetailDrawer";
import {
  useOpsAnomalies,
  useAcknowledgeOpsAnomaly,
  useResolveOpsAnomaly,
} from "../../../features/anomalies/hooks/useAnomalies";
import type { AnomaliesFiltersState } from "../../../features/anomalies/components/AnomaliesFilters";
import type { OpsAnomalyItem } from "../../../features/anomalies/api/types";

export function AnomaliesPage() {
  useEffect(() => {
    setAdminDocumentTitle("Anomalies");
  }, []);
  const [filters, setFilters] = useState<AnomaliesFiltersState>({
    opsStatus: "",
    severity: "",
    limit: "50",
    sinceHours: "168",
  });
  const [drawerItem, setDrawerItem] = useState<OpsAnomalyItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useMemo(() => {
    const sinceHours = parseInt(filters.sinceHours, 10);
    const limit = parseInt(filters.limit, 10);
    return {
      sinceHours: Number.isFinite(sinceHours) && sinceHours > 0 ? sinceHours : 168,
      limit: Number.isFinite(limit) && limit >= 1 && limit <= 200 ? limit : 50,
      opsStatus: filters.opsStatus || undefined,
      severity: filters.severity || undefined,
      groupBy: "fingerprint" as const,
    };
  }, [filters]);

  const { data, isLoading, isError, error, refetch } = useOpsAnomalies(params);
  const ack = useAcknowledgeOpsAnomaly();
  const resolve = useResolveOpsAnomaly();

  const items = data?.anomalies ?? [];
  const nextCursor = data?.page?.nextCursor;

  const handleAck = (item: OpsAnomalyItem) => {
    ack.mutate(
      { eventId: item.id, fingerprint: item.fingerprint ?? undefined },
      { onSuccess: () => setDrawerOpen(false) },
    );
  };

  const handleResolve = (item: OpsAnomalyItem) => {
    resolve.mutate(
      { eventId: item.id, fingerprint: item.fingerprint ?? undefined },
      { onSuccess: () => setDrawerOpen(false) },
    );
  };

  const handleOpenDrawer = (item: OpsAnomalyItem) => {
    setDrawerItem(item);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return <AdminLoadingState message="Loading anomalies…" />;
  }

  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load anomalies."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Anomalies"
        subtitle="Operational anomalies requiring attention. Ack or resolve from the table or detail."
      />

      <div className="mb-4">
        <AnomaliesFilters filters={filters} onChange={setFilters} />
      </div>

      <section className="rounded-2xl border bg-white p-4">
        {items.length === 0 ? (
          <AdminEmptyState title="No anomalies" description="No anomalies match the current filters." />
        ) : (
          <>
            <AnomaliesTable
              items={items}
              onAck={handleAck}
              onResolve={handleResolve}
              onOpenDrawer={handleOpenDrawer}
              isAcking={
                ack.isPending && ack.variables
                  ? (ack.variables.eventId ?? ack.variables.fingerprint ?? "")
                  : undefined
              }
              isResolving={
                resolve.isPending && resolve.variables
                  ? (resolve.variables.eventId ?? resolve.variables.fingerprint ?? "")
                  : undefined
              }
            />
            {nextCursor && (
              <p className="mt-3 text-center text-sm text-gray-500">
                More available (cursor-based pagination).
              </p>
            )}
          </>
        )}
      </section>

      <AnomalyDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={drawerItem}
      />
    </div>
  );
}
