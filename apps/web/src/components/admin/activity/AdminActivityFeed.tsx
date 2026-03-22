"use client";

import { AdminEmptyState } from "@/components/admin/operations/AdminEmptyState";
import { AdminSectionHeader } from "@/components/admin/operations/AdminSectionHeader";
import { useAdminActivityFeed } from "@/hooks/admin/useAdminActivityFeed";
import { AdminActivityRow } from "./AdminActivityRow";

export function AdminActivityFeed() {
  const { items, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useAdminActivityFeed();

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Live feed"
        description="Newest admin actions across bookings—dispatch, command center, and anomaly handling."
      />

      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-white/60">Loading activity…</p>
      ) : items.length === 0 ? (
        <AdminEmptyState
          title="No activity yet"
          description="When admins publish config, add notes, or use the command center, entries appear here."
        />
      ) : (
        <ul className="space-y-3" aria-label="Admin activity feed">
          {items.map((row) => (
            <AdminActivityRow key={row.id} row={row} />
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
