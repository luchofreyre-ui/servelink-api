"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getRecurringManifest,
  type RecurringHttpProbeResult,
  type RecurringManifest,
} from "@/components/marketing/precision-luxury/booking/bookingRecurringApi";

function ProbeCard(props: {
  title: string;
  subtitle: string;
  result: RecurringHttpProbeResult | null;
  loading: boolean;
  error: string | null;
}) {
  const tone = props.error
    ? "border-amber-300 bg-amber-50 text-amber-950"
    : props.result?.ok
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : props.result
        ? "border-rose-200 bg-rose-50 text-rose-950"
        : "border-gray-200 bg-white text-gray-900";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        {props.title}
      </p>
      <p className="mt-1 text-sm text-gray-600">{props.subtitle}</p>
      {props.loading ? (
        <p className="mt-3 text-sm">Loading…</p>
      ) : props.error ? (
        <p className="mt-3 text-sm font-medium">{props.error}</p>
      ) : props.result ? (
        <div className="mt-3 space-y-1 text-sm">
          <p>
            HTTP <span className="font-mono tabular-nums">{props.result.status}</span>{" "}
            — {props.result.ok ? "OK" : "failed"}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm">No data.</p>
      )}
    </div>
  );
}

type Props = {
  /** When false, ops summary failed server-side (often missing admin session). */
  opsSummaryLoaded: boolean;
  opsError: string | null;
};

export function AdminRecurringOperationsPanel(props: Props) {
  const [manifest, setManifest] = useState<RecurringManifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void getRecurringManifest({ includeLiveProbes: true })
      .then(setManifest)
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load manifest.");
        setManifest(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const root = manifest?.liveProbes?.root ?? null;
  const debug = manifest?.liveProbes?.debugRoutes ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProbeCard
          title="Recurring root"
          subtitle="GET /api/v1/recurring"
          result={root}
          loading={loading}
          error={loadError}
        />
        <ProbeCard
          title="Debug routes"
          subtitle="GET /api/v1/recurring/debug/routes"
          result={debug}
          loading={loading}
          error={loadError}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Ops summary
          </p>
          <p className="mt-1 text-sm text-gray-600">GET /api/v1/recurring/ops/summary</p>
          {props.opsError ? (
            <p className="mt-3 text-sm text-amber-900">{props.opsError}</p>
          ) : props.opsSummaryLoaded ? (
            <p className="mt-3 text-sm text-emerald-800">Loaded on this page request.</p>
          ) : (
            <p className="mt-3 text-sm text-gray-600">Not loaded.</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Customer plans
          </p>
          <p className="mt-1 text-sm text-gray-600">GET /api/v1/recurring/plans/me</p>
          <p className="mt-3 text-sm text-gray-700">
            Customer JWT only; not probed here from an admin session.
          </p>
          <Link
            href="/customer/recurring"
            className="mt-3 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Open customer recurring UI →
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Live manifest (static routes + probes)</h3>
        <p className="mt-1 text-xs text-gray-600">
          Operators see the same route objects the frontend is allowed to call; live probes reflect
          the browser session cookie / bearer token.
        </p>
        <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
          {loading && !manifest
            ? "…"
            : JSON.stringify(
                manifest ?? { documentedRoutes: [], error: loadError },
                null,
                2,
              )}
        </pre>
        <button
          type="button"
          onClick={() => load()}
          className="mt-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100"
        >
          Refresh probes
        </button>
      </section>
    </div>
  );
}
