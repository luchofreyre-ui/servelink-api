"use client";

import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchDispatchConfigReadBundle,
  type DispatchConfigReadBundle,
} from "@/lib/api/adminDispatchConfig";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickConfigSummary(cfg: unknown) {
  if (!isRecord(cfg)) return null;
  return {
    id: cfg.id,
    version: cfg.version,
    status: cfg.status,
    label: cfg.label,
    offerExpiryMinutes: cfg.offerExpiryMinutes,
    assignedStartGraceMinutes: cfg.assignedStartGraceMinutes,
    acceptancePenaltyWeight: cfg.acceptancePenaltyWeight,
    completionPenaltyWeight: cfg.completionPenaltyWeight,
    multiPassPenaltyStep: cfg.multiPassPenaltyStep,
    enableResponseSpeedWeighting: cfg.enableResponseSpeedWeighting,
    enableReliabilityWeighting: cfg.enableReliabilityWeighting,
    allowReofferAfterExpiry: cfg.allowReofferAfterExpiry,
    updatedAt: cfg.updatedAt,
    publishedAt: cfg.publishedAt,
  };
}

export default function AdminDispatchConfigPage() {
  const [data, setData] = useState<DispatchConfigReadBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth (dispatch.read permission required).");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bundle = await fetchDispatchConfigReadBundle(token);
        if (!cancelled) setData(bundle);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dispatch config.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const compare = data?.compare && isRecord(data.compare) ? data.compare : null;
  const diffs = compare && Array.isArray(compare.diffs) ? compare.diffs : [];
  const summary =
    compare && isRecord(compare.summary) ? compare.summary : null;

  return (
    <div className="min-h-screen space-y-6 bg-neutral-950 px-6 py-10 text-white">
      <div>
        <h1 className="text-xl font-semibold">Dispatch config</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          Read-only view of active and draft dispatch scoring configuration. Data from{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
            /api/v1/admin/dispatch-config/*
          </code>
          . Editing and publish remain API-driven (dispatch.write / dispatch.publish).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-white/60">Loading configuration…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {data && !loading ? (
        <>
          {compare ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-200/90">
                Draft vs active
              </h2>
              <dl className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                <div>
                  <dt className="text-white/50">Has changes</dt>
                  <dd>{String(compare.hasChanges ?? false)}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Change count</dt>
                  <dd>{String(summary?.changeCount ?? diffs.length)}</dd>
                </div>
                <div>
                  <dt className="text-white/50">High-impact changes</dt>
                  <dd>{String(summary?.highImpactChangeCount ?? "—")}</dd>
                </div>
              </dl>
              {diffs.length > 0 ? (
                <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-xs text-white/75">
                  {diffs.slice(0, 40).map((d, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    >
                      {isRecord(d) ? (
                        <>
                          <span className="font-medium text-white/90">
                            {String(d.field ?? "field")}
                          </span>
                          <span className="text-white/50"> · </span>
                          <span>{String(d.message ?? "")}</span>
                        </>
                      ) : (
                        JSON.stringify(d)
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/55">No diff rows returned.</p>
              )}
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-cyan-200/90">Active</h2>
              <pre className="mt-3 max-h-80 overflow-auto text-xs text-white/70">
                {JSON.stringify(pickConfigSummary(data.active), null, 2)}
              </pre>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-cyan-200/90">Draft</h2>
              <pre className="mt-3 max-h-80 overflow-auto text-xs text-white/70">
                {JSON.stringify(pickConfigSummary(data.draft), null, 2)}
              </pre>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
