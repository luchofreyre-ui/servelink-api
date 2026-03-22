import { useState, useMemo, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { ActivityFilters } from "../../../features/activity/components/ActivityFilters";
import { ActivityFeedTable } from "../../../features/activity/components/ActivityFeedTable";
import { useActivityList } from "../../../features/activity/hooks/useActivity";
import type { ActivityFiltersState } from "../../../features/activity/components/ActivityFilters";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

const DEFAULT_LIMIT = 50;
const LOAD_MORE_STEP = 50;

export function ActivityPage() {
  useEffect(() => {
    setAdminDocumentTitle("Activity");
  }, []);

  const [filters, setFilters] = useState<ActivityFiltersState>({
    limit: String(DEFAULT_LIMIT),
    entityType: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const limitNum = useMemo(() => {
    const n = parseInt(filters.limit, 10);
    return Number.isFinite(n) && n >= 1 && n <= 100 ? n : DEFAULT_LIMIT;
  }, [filters.limit]);

  const params = useMemo(() => ({
    limit: limitNum,
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [limitNum, filters.entityType, filters.dateFrom, filters.dateTo, filters.search]);

  const { data, isLoading, isError, error, refetch } = useActivityList(params);
  const items = data?.items ?? [];
  const hasMore = items.length >= limitNum;

  const handleLoadMore = () => {
    const next = Math.min(100, limitNum + LOAD_MORE_STEP);
    setFilters((f) => ({ ...f, limit: String(next) }));
  };

  if (isLoading) {
    return <AdminLoadingState message="Loading activity…" />;
  }

  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load activity."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Activity"
        subtitle="Admin audit and event feed. Booking and dispatch actions."
      />

      <div className="mb-4">
        <ActivityFilters filters={filters} onChange={setFilters} />
      </div>

      <section className="rounded-2xl border bg-white p-4">
        {items.length === 0 ? (
          <AdminEmptyState title="No activity" description="No activity in this window." />
        ) : (
          <>
            <ActivityFeedTable items={items} />
            {hasMore && limitNum < 100 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={handleLoadMore}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
