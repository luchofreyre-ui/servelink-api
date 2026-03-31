"use client";

import { useEffect, useState } from "react";
import {
  type ApiMigrationSummary,
  fetchMigrationSummary,
} from "@/lib/api/encyclopediaReview";

export default function ApiEncyclopediaMigrationPanel() {
  const [data, setData] = useState<ApiMigrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchMigrationSummary();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load migration summary"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Store Migration Status</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? <div className="text-sm text-neutral-500">Loading…</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total" value={data.total} />
          <Stat label="Imported" value={data.imported} />
          <Stat label="Manual" value={data.manual} />
          <Stat label="Live" value={data.live} />
          <Stat label="Approved not live" value={data.approvedNotLive} />
          <Stat label="Pending" value={data.pending} />
          <Stat label="Failed" value={data.failed} />
        </div>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
