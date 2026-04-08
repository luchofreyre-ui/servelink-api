"use client";

import { useEffect, useState } from "react";
import {
  acknowledgeAdminPrismaOpsAnomaly,
  getAdminOpenPrismaOpsAnomalies,
  resolveAdminPrismaOpsAnomaly,
} from "@/lib/api/payments";
import { getStoredAccessToken } from "@/lib/auth";
import type { AdminPrismaOpsAnomalyItem } from "@/types/payments";

export function AdminOpsAnomaliesPanel() {
  const [items, setItems] = useState<AdminPrismaOpsAnomalyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    const token = getStoredAccessToken();
    if (!token) {
      setError("No auth token. Sign in through /admin/auth first.");
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const next = await getAdminOpenPrismaOpsAnomalies();
      setItems(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load anomalies");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAck(id: string) {
    const token = getStoredAccessToken();
    if (!token) return;
    setBusyId(id);
    try {
      await acknowledgeAdminPrismaOpsAnomaly(id, token);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(id: string) {
    const token = getStoredAccessToken();
    if (!token) return;
    setBusyId(id);
    try {
      await resolveAdminPrismaOpsAnomaly(id, token);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Loading payment & ops records…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 p-5">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
          Prisma ops anomalies
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white">
          Open payment & operational exceptions
        </h3>
        <p className="mt-1 text-sm text-white/60">
          Live records from{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-white/80">
            GET /api/v1/admin/anomalies
          </code>{" "}
          (e.g. payment failures, intent mismatches). Separate from the fingerprinted ops queue
          at <code className="text-xs text-white/70">/api/v1/admin/ops/anomalies</code>.
          Acknowledge or resolve to clear this list.
        </p>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/50">{item.type}</p>
                  <p className="mt-2 text-sm text-white/75">
                    {item.detail ?? "No detail provided"}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Booking: {item.booking?.id ?? "—"} · FO:{" "}
                    {item.fo?.displayName ?? "—"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAck(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Ack
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
            No open Prisma ops anomalies.
          </div>
        )}
      </div>
    </section>
  );
}
