"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminDispatchExceptionsPage } from "@/lib/api/adminDispatchExceptions";
import type { AdminDispatchExceptionApiItem } from "@/lib/api/adminDispatchExceptions";
import { mapAdminDispatchExceptionToUi } from "@/operations/dispatchExceptions/mapAdminDispatchExceptionApi";
import type { DispatchException } from "@/operations/dispatchExceptions/dispatchExceptionTypes";
import DispatchExceptionsTable from "@/components/operations/admin/DispatchExceptionsTable";
import DispatchExceptionDetailDrawer from "@/components/operations/admin/DispatchExceptionDetailDrawer";

export default function DispatchExceptionsPage() {
  const [rows, setRows] = useState<DispatchException[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DispatchException | null>(null);

  const load = useCallback(async (append: boolean, cursor: string | null) => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account (exceptions.read).");
      setRows([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const page = await fetchAdminDispatchExceptionsPage(token, {
        limit: 40,
        cursor: append ? cursor : null,
      });
      const mapped = page.items.map((item: AdminDispatchExceptionApiItem) =>
        mapAdminDispatchExceptionToUi(item),
      );
      setRows((prev) => (append ? [...prev, ...mapped] : mapped));
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dispatch exceptions.");
      if (!append) setRows([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(false, null);
  }, [load]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dispatch exceptions</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Live work queue from{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            GET /api/v1/admin/dispatch/exceptions
          </code>
          . Rows are derived from dispatch decision history (not the separate ops-anomaly
          fingerprint queue).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading exceptions…</p>
      ) : null}

      <DispatchExceptionsTable
        data={rows}
        onSelect={(e) => setSelected(e)}
        emptyMessage={
          error
            ? undefined
            : "No dispatch exceptions returned for the current filters. Try again later or adjust API query parameters when we expose them in the UI."
        }
      />

      {nextCursor ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void load(true, nextCursor)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}

      <p className="text-xs text-slate-500">
        Open a booking command center:{" "}
        <Link href="/admin" className="underline">
          Admin home
        </Link>
      </p>

      <DispatchExceptionDetailDrawer exception={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
