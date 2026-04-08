"use client";

import { useEffect, useState } from "react";
import { WEB_ENV } from "@/lib/env";

interface ReadinessResponse {
  ok: boolean;
  database: string;
  stripeConfigured: boolean;
  webBaseUrl: string | null;
  timestamp: string;
}

export function AdminLaunchReadinessCard() {
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `${WEB_ENV.apiBaseUrl}/system/readiness`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Readiness failed: ${response.status}`);
        }

        const next = (await response.json()) as ReadinessResponse;
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load readiness",
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-slate-300">
        Loading launch readiness...
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Launch readiness
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-50">
        Production readiness snapshot
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Database</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{data.database}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stripe</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {data.stripeConfigured ? "Configured" : "Missing"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Web base URL</p>
          <p className="mt-2 break-all text-sm text-slate-300">
            {data.webBaseUrl ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
