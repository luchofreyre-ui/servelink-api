"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestFamilies } from "@/lib/api/systemTestFamilies";
import { SystemTestsFamiliesTable } from "@/components/admin/system-tests/SystemTestsFamiliesTable";
import { SystemTestsListResolutionFilters } from "@/components/admin/system-tests/SystemTestsListResolutionFilters";
import {
  parseSortCombo,
  SYSTEM_TEST_FAMILIES_SORT_OPTIONS,
  SYSTEM_TEST_LIFECYCLE_FILTER_OPTIONS,
} from "@/lib/system-tests/diagnosisCategoryFilterOptions";

export default function AdminSystemTestFamiliesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminSystemTestFamilies>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [confidenceTier, setConfidenceTier] = useState("");
  const [sortCombo, setSortCombo] = useState("recent:desc");
  const [showDismissed, setShowDismissed] = useState(false);
  const [lifecycleFilter, setLifecycleFilter] = useState("");
  const [includeDormant, setIncludeDormant] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);

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
        const { sortBy, sortDirection } = parseSortCombo(sortCombo);
        const data = await fetchAdminSystemTestFamilies(token, {
          limit: 80,
          diagnosisCategory: category || undefined,
          confidenceTier:
            confidenceTier === "high" || confidenceTier === "medium" || confidenceTier === "low" ?
              confidenceTier
            : undefined,
          sortBy,
          sortDirection,
          showDismissed,
          lifecycleState: lifecycleFilter || undefined,
          includeDormant,
          includeResolved,
        });
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
  }, [token, category, confidenceTier, sortCombo, showDismissed, lifecycleFilter, includeDormant, includeResolved]);

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

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white">Resolution filters</h2>
          <p className="mt-1 text-xs text-white/45">
            Filter and sort by Phase 10A diagnosis preview. Uses the same query params as the families API.
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-white/10"
                checked={showDismissed}
                onChange={(e) => setShowDismissed(e.target.checked)}
                data-testid="families-show-dismissed-toggle"
              />
              Show dismissed
            </label>
            <label className="block text-xs text-white/45">
              Lifecycle state
              <select
                value={lifecycleFilter}
                onChange={(e) => setLifecycleFilter(e.target.value)}
                className="mt-1 w-full max-w-xs rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                data-testid="families-lifecycle-filter"
              >
                {SYSTEM_TEST_LIFECYCLE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-white/10"
                checked={includeDormant}
                onChange={(e) => setIncludeDormant(e.target.checked)}
                data-testid="families-include-dormant-toggle"
              />
              Include dormant
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-white/10"
                checked={includeResolved}
                onChange={(e) => setIncludeResolved(e.target.checked)}
                data-testid="families-include-resolved-toggle"
              />
              Include resolved
            </label>
            <SystemTestsListResolutionFilters
              sortOptions={SYSTEM_TEST_FAMILIES_SORT_OPTIONS}
              category={category}
              confidenceTier={confidenceTier}
              sortCombo={sortCombo}
              onCategoryChange={setCategory}
              onConfidenceChange={setConfidenceTier}
              onSortComboChange={setSortCombo}
              disabled={!token || loading}
            />
          </div>
        </div>

        {loading ? <p className="text-sm text-white/55">Loading…</p> : null}
        {error ? <p className="text-sm text-amber-200/90">{error}</p> : null}
        {!loading && !error ?
          <SystemTestsFamiliesTable
            items={items}
            onFamilyOperatorStateUpdated={(familyId, next) => {
              setItems((prev) =>
                prev.map((r) => (r.id === familyId ? { ...r, operatorState: next } : r)),
              );
            }}
          />
        : null}
      </div>
    </main>
  );
}
