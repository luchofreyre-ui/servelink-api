"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchAdminActivityPage,
  type AdminActivityApiItem,
} from "@/lib/api/adminActivity";
import { ADMIN_ACTIVITY_REFRESH_EVENT } from "@/lib/adminActivityRefresh";
import { workflowStateFromActivityType } from "@/components/admin/operations/adminOperationsLabels";

export type AdminActivityRowModel = {
  id: string;
  title: string;
  summary: string | null;
  type: string;
  createdAt: string;
  bookingId: string | null;
  anomalyId: string | null;
  detailPath: string | null;
  bookingStatus: string | null;
  workflowState: string | null;
};

function normalizeActivityRow(raw: AdminActivityApiItem): AdminActivityRowModel {
  const summary =
    raw.summary != null && String(raw.summary).trim()
      ? String(raw.summary)
      : raw.description != null && String(raw.description).trim()
        ? String(raw.description)
        : null;

  return {
    id: raw.id,
    title: raw.title?.trim() || raw.type,
    summary,
    type: raw.type,
    createdAt: raw.createdAt,
    bookingId: raw.bookingId ?? null,
    anomalyId: raw.anomalyId ?? null,
    detailPath: raw.detailPath ?? null,
    bookingStatus: null,
    workflowState: workflowStateFromActivityType(raw.type),
  };
}

export function useAdminActivityFeed() {
  const pathname = usePathname();
  const [items, setItems] = useState<AdminActivityRowModel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (append: boolean, cursor: string | null) => {
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
      const res = await fetchAdminActivityPage({
        token,
        limit: 40,
        cursor: append ? cursor : null,
      });
      const normalized = res.items.map(normalizeActivityRow);
      setItems((prev) => (append ? [...prev, ...normalized] : normalized));
      setNextCursor(res.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity.");
      if (!append) setItems([]);
      setNextCursor(null);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/admin/activity") {
      return;
    }
    void loadPage(false, null);
  }, [pathname, loadPage]);

  useEffect(() => {
    const handler = () => {
      void loadPage(false, null);
    };
    window.addEventListener(ADMIN_ACTIVITY_REFRESH_EVENT, handler);
    return () => window.removeEventListener(ADMIN_ACTIVITY_REFRESH_EVENT, handler);
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
