"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchAdminAnomaliesPage,
  type AdminAnomalyApiItem,
  type AdminAnomalySlaState,
} from "@/lib/api/adminAnomalies";
import { formatAnomalyRowTitle } from "@/components/admin/operations/adminOperationsLabels";

export type AdminAnomalyRowModel = {
  id: string;
  title: string;
  status: string;
  reviewState: string | null;
  assigneeLabel: string | null;
  slaState: AdminAnomalySlaState | null;
  bookingId: string | null;
  bookingStatus: string | null;
  bookingWorkflowState: string | null;
  detailPath: string | null;
  lastSeenAt: string | null;
};

function assigneeLabelFromRow(
  assignedToAdminId: string | null | undefined,
): string | null {
  if (assignedToAdminId == null || assignedToAdminId === "") {
    return "Unassigned";
  }
  return "Assigned";
}

function normalizeAnomalyRow(raw: AdminAnomalyApiItem): AdminAnomalyRowModel {
  const status = String(raw.opsStatus ?? raw.status ?? "open");
  const lastSeen = raw.lastSeenAt ?? raw.createdAt ?? null;

  return {
    id: String(raw.id),
    title: formatAnomalyRowTitle(raw.anomalyType, raw.bookingId ?? null),
    status,
    reviewState: raw.reviewState ?? null,
    assigneeLabel: assigneeLabelFromRow(raw.assignedToAdminId),
    slaState: raw.slaState ?? null,
    bookingId: raw.bookingId ?? null,
    bookingStatus: raw.bookingStatus ?? null,
    bookingWorkflowState: raw.bookingWorkflowState ?? null,
    detailPath: raw.detailPath ?? null,
    lastSeenAt: lastSeen,
  };
}

export type AdminAnomaliesQuery = {
  mine: boolean;
  unassigned: boolean;
  sla: AdminAnomalySlaState | "";
};

export function useAdminAnomalies(query: AdminAnomaliesQuery) {
  const [items, setItems] = useState<AdminAnomalyRowModel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (append: boolean, cursor: string | null) => {
      const token = getStoredAccessToken();
      if (!token) {
        setError("Sign in required.");
        setIsLoading(false);
        setIsFetchingNextPage(false);
        return;
      }

      if (append) setIsFetchingNextPage(true);
      else setIsLoading(true);
      setError(null);

      try {
        const res = await fetchAdminAnomaliesPage({
          token,
          limit: 50,
          cursor: append ? cursor : null,
          mine: query.mine,
          unassigned: query.unassigned,
          sla: query.sla || null,
        });
        const normalized = res.anomalies.map(normalizeAnomalyRow);
        setItems((prev) => (append ? [...prev, ...normalized] : normalized));
        setNextCursor(res.page?.nextCursor ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load anomalies.");
        if (!append) setItems([]);
        setNextCursor(null);
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [query.mine, query.unassigned, query.sla],
  );

  useEffect(() => {
    void loadPage(false, null);
  }, [loadPage]);

  const fetchNextPage = useCallback(() => {
    if (!nextCursor || isFetchingNextPage || isLoading) return;
    void loadPage(true, nextCursor);
  }, [loadPage, nextCursor, isFetchingNextPage, isLoading]);

  return {
    items,
    isLoading,
    hasNextPage: Boolean(nextCursor),
    fetchNextPage,
    isFetchingNextPage,
    error,
    reload: () => loadPage(false, null),
  };
}
