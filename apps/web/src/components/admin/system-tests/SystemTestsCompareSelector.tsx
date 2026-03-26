"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SystemTestsRunsResponse } from "@/types/systemTests";
import { formatDateTime } from "./systemTestsFormatting";

type Props = {
  runs: SystemTestsRunsResponse;
  baseRunId?: string;
  targetRunId?: string;
};

export function SystemTestsCompareSelector(props: Props) {
  const { runs, baseRunId: baseFromUrl, targetRunId: targetFromUrl } = props;
  const router = useRouter();
  const [base, setBase] = useState(baseFromUrl ?? "");
  const [target, setTarget] = useState(targetFromUrl ?? "");

  const ids = useMemo(() => runs.items.map((r) => r.id), [runs.items]);

  const valid =
    base &&
    target &&
    base !== target &&
    ids.includes(base) &&
    ids.includes(target);

  useEffect(() => {
    if (baseFromUrl) setBase(baseFromUrl);
    if (targetFromUrl) setTarget(targetFromUrl);
  }, [baseFromUrl, targetFromUrl]);

  const onCompare = () => {
    if (!valid) return;
    router.push(
      `/admin/system-tests/compare?baseRunId=${encodeURIComponent(base)}&targetRunId=${encodeURIComponent(target)}`,
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-medium text-white">Compare two runs</p>
      <p className="mt-1 text-xs text-white/45">Choose a base (older) and target (newer) run.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-white/50">
          Base run
          <select
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
          >
            <option value="">Select…</option>
            {runs.items.map((r) => (
              <option key={r.id} value={r.id}>
                {formatDateTime(r.createdAt)} · {r.source} · {r.status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs text-white/50">
          Target run
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
          >
            <option value="">Select…</option>
            {runs.items.map((r) => (
              <option key={r.id} value={r.id}>
                {formatDateTime(r.createdAt)} · {r.source} · {r.status}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!valid}
          onClick={onCompare}
          className="rounded-lg border border-sky-500/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
