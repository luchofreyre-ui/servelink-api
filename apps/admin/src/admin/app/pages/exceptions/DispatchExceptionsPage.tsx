import { useMemo, useState, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminMetricCard } from "../../components/cards/AdminMetricCard";
import { DispatchExceptionsFilters } from "../../../features/dispatch-exceptions/components/DispatchExceptionsFilters";
import { DispatchExceptionsTable } from "../../../features/dispatch-exceptions/components/DispatchExceptionsTable";
import { useDispatchExceptions, useAcknowledgeDispatchException, useResolveDispatchException } from "../../../features/dispatch-exceptions/hooks/useDispatchExceptions";
import type { DispatchExceptionsParams } from "../../../features/dispatch-exceptions/api/types";

const DEFAULT_FILTERS: DispatchExceptionsParams = {
  sortBy: "priority",
  sortOrder: "desc",
  limit: 25,
};

export function DispatchExceptionsPage() {
  useEffect(() => {
    setAdminDocumentTitle("Dispatch Exceptions");
  }, []);
  const [filters, setFilters] = useState<DispatchExceptionsParams>(DEFAULT_FILTERS);

  const { data, isLoading, isError, error, refetch } = useDispatchExceptions(filters);
  const acknowledge = useAcknowledgeDispatchException();
  const resolve = useResolveDispatchException();

  const items = useMemo(() => {
    const list = data?.items ?? [];
    const search = (filters.search ?? "").trim().toLowerCase();
    if (!search) return list;
    return list.filter((i) => i.bookingId.toLowerCase().includes(search));
  }, [data?.items, filters.search]);

  const stats = useMemo(() => {
    const list = data?.items ?? [];
    const open = list.filter((i) => !i.hasManualIntervention && i.requiresFollowUp !== true).length;
    const critical = list.filter((i) => i.priorityBucket === "urgent" || i.severity === "high").length;
    const acknowledged = list.filter((i) => i.hasManualIntervention).length;
    const resolvedToday = 0;
    return { open, critical, acknowledged, resolvedToday };
  }, [data?.items]);

  return (
    <div>
      <AdminPageHeader
        title="Dispatch Exceptions"
        subtitle="Bookings that need manual dispatch attention."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard title="Open" value={stats.open} />
        <AdminMetricCard title="Critical" value={stats.critical} />
        <AdminMetricCard title="Acknowledged" value={stats.acknowledged} />
        <AdminMetricCard title="Resolved today" value={stats.resolvedToday} />
      </div>

      <DispatchExceptionsFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <AdminLoadingState message="Loading exceptions…" />
      ) : isError ? (
        <AdminErrorState
          message={error instanceof Error ? error.message : "Failed to load exceptions."}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <AdminEmptyState
          title="No exceptions match the current filters."
          description="Try adjusting filters or check back later."
        />
      ) : (
        <DispatchExceptionsTable
          items={items}
          onAcknowledge={(id) => acknowledge.mutate(id)}
          onResolve={(id) => resolve.mutate(id)}
        />
      )}

      {data?.nextCursor && items.length > 0 ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="rounded-xl border bg-white px-4 py-2 text-sm"
            onClick={() => setFilters((f) => ({ ...f, cursor: data.nextCursor ?? undefined }))}
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
