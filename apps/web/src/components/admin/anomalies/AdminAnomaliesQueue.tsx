"use client";

import { Suspense } from "react";
import { AdminEmptyState } from "@/components/admin/operations/AdminEmptyState";
import { AdminSectionHeader } from "@/components/admin/operations/AdminSectionHeader";
import { useAdminAnomalies } from "@/hooks/admin/useAdminAnomalies";
import { readAnomalyFiltersFromSearchParams } from "./adminAnomaliesFilterState";
import { AdminAnomaliesFilters } from "./AdminAnomaliesFilters";
import { AdminAnomalyRow } from "./AdminAnomalyRow";
import { useSearchParams } from "next/navigation";

function AdminAnomaliesQueueInner() {
  const searchParams = useSearchParams();
  const filters = readAnomalyFiltersFromSearchParams(searchParams);

  const { items, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useAdminAnomalies({
      mine: filters.mine,
      unassigned: filters.unassigned,
      sla: filters.sla,
    });

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Open anomalies"
        description="Fingerprinted ops alerts with SLA and ownership context. Jump into booking command center from any linked row."
      />

      <AdminAnomaliesFilters />

      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-white/60">Loading anomalies…</p>
      ) : items.length === 0 ? (
        <AdminEmptyState
          title="Queue is clear"
          description="No anomalies match these filters in the selected time window."
        />
      ) : (
        <ul className="space-y-3" aria-label="Admin anomalies queue">
          {items.map((row) => (
            <AdminAnomalyRow key={row.id} row={row} />
          ))}
        </ul>
      )}

      {hasNextPage ? (
        <div>
          <button
            type="button"
            className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
            disabled={isFetchingNextPage || isLoading}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminAnomaliesQueue() {
  return (
    <Suspense
      fallback={<p className="text-sm text-white/60">Loading filters…</p>}
    >
      <AdminAnomaliesQueueInner />
    </Suspense>
  );
}
