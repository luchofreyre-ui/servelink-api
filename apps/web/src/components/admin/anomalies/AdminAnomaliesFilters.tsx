"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mergeAnomalyFiltersIntoSearchParams,
  readAnomalyFiltersFromSearchParams,
  type ParsedAnomaliesFilters,
} from "./adminAnomaliesFilterState";
import type { AdminAnomalySlaState } from "@/lib/api/adminAnomalies";

export function AdminAnomaliesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spKey = searchParams?.toString() ?? "";

  const urlFilters = useMemo(
    () => readAnomalyFiltersFromSearchParams(new URLSearchParams(spKey)),
    [spKey],
  );

  const [override, setOverride] = useState<Partial<ParsedAnomaliesFilters>>({});

  const filters = useMemo(
    () => ({ ...urlFilters, ...override }),
    [urlFilters, override],
  );

  useEffect(() => {
    setOverride((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      if (next.mine !== undefined && next.mine === urlFilters.mine) {
        delete next.mine;
      }
      if (next.unassigned !== undefined && next.unassigned === urlFilters.unassigned) {
        delete next.unassigned;
      }
      if (next.sla !== undefined && next.sla === urlFilters.sla) {
        delete next.sla;
      }
      return Object.keys(next).length ? next : {};
    });
  }, [urlFilters.mine, urlFilters.unassigned, urlFilters.sla]);

  const pushPatch = useCallback(
    (patch: Partial<ParsedAnomaliesFilters>) => {
      setOverride((o) => ({ ...o, ...patch }));
      const next = mergeAnomalyFiltersIntoSearchParams(new URLSearchParams(spKey), patch);
      const qs = next.toString();
      const base = pathname ?? "/admin/anomalies";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [pathname, router, spKey],
  );

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:flex-wrap sm:items-center"
      role="toolbar"
      aria-label="Anomaly filters"
    >
      <div className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
        <input
          id="anomaly-filter-mine"
          type="checkbox"
          className="h-4 w-4 rounded border-white/30 bg-transparent"
          checked={filters.mine}
          aria-label="Mine"
          onChange={(e) => pushPatch({ mine: e.target.checked })}
        />
        <label htmlFor="anomaly-filter-mine" className="cursor-pointer select-none">
          Mine
        </label>
      </div>
      <div className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
        <input
          id="anomaly-filter-unassigned"
          type="checkbox"
          className="h-4 w-4 rounded border-white/30 bg-transparent"
          checked={filters.unassigned}
          aria-label="Unassigned"
          onChange={(e) => pushPatch({ unassigned: e.target.checked })}
        />
        <label htmlFor="anomaly-filter-unassigned" className="cursor-pointer select-none">
          Unassigned
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/85">
        <span className="text-white/50">SLA</span>
        <select
          aria-label="SLA filter"
          className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm text-white"
          value={filters.sla}
          onChange={(e) =>
            pushPatch({
              sla: (e.target.value || "") as AdminAnomalySlaState | "",
            })
          }
        >
          <option value="">All</option>
          <option value="dueSoon">Due Soon</option>
          <option value="overdue">Overdue</option>
          <option value="breached">Breached</option>
        </select>
      </label>
    </div>
  );
}
