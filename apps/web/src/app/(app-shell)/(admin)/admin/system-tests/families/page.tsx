"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestFamilies } from "@/lib/api/systemTestFamilies";
import { SystemTestsFamiliesTable } from "@/components/admin/system-tests/SystemTestsFamiliesTable";

export default function AdminSystemTestFamiliesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminSystemTestFamilies>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminSystemTestFamilies(token, { limit: 80 });
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load families.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Failure families</h1>
            <p className="mt-1 text-sm text-white/55">
              Cross-run root-cause clusters (deterministic signatures).{" "}
              <Link href="/admin/system-tests" className="text-sky-300 hover:text-sky-200">
                ← System tests
              </Link>
            </p>
          </div>
        </div>

        {loading ? <p className="text-sm text-white/55">Loading…</p> : null}
        {error ? <p className="text-sm text-amber-200/90">{error}</p> : null}
        {!loading && !error ? <SystemTestsFamiliesTable items={items} /> : null}
      </div>
    </main>
  );
}
