"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getMyRecurringPlans } from "@/components/marketing/precision-luxury/booking/bookingRecurringApi";

type PlanListRow = {
  id: string;
  status: string;
  cadence: string;
  serviceType: string;
  nextAnchorAt: string;
  lastGeneratedAt: string | null;
  hasUpcomingBookedOccurrence?: boolean;
  latestOccurrence?: {
    id: string;
    status: string;
    sequenceNumber: number;
    targetDate: string;
    bookingId: string | null;
  } | null;
};

function isPlanListRow(x: unknown): x is PlanListRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.status === "string" &&
    typeof o.cadence === "string" &&
    typeof o.serviceType === "string" &&
    typeof o.nextAnchorAt === "string"
  );
}

export function RecurringPlansPageClient() {
  const [items, setItems] = useState<PlanListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void getMyRecurringPlans()
      .then((res) => {
        const rows = Array.isArray(res.items)
          ? res.items.filter(isPlanListRow)
          : [];
        setItems(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load plans.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recurring plans</h1>
          <p className="mt-1 text-sm text-slate-600">
            View cadence, status, and manage each plan.
          </p>
        </div>
        <Link
          href="/customer"
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          ← Back to bookings
        </Link>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-amber-800">{error}</p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-slate-600">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 p-6 text-slate-600">
          No recurring plans yet. Complete a recurring booking to create one.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((p) => {
            const latestSt = p.latestOccurrence?.status ?? "";
            const showWarning =
              (p.status === "canceled" && p.hasUpcomingBookedOccurrence === true) ||
              latestSt === "needs_review";
            return (
            <li key={p.id}>
              <Link
                href={`/customer/recurring/${encodeURIComponent(p.id)}`}
                className="block rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{p.serviceType}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Cadence: <span className="capitalize">{p.cadence}</span> ·
                      Plan: <span className="capitalize">{p.status}</span>
                      {latestSt ? (
                        <>
                          {" "}
                          · Latest visit:{" "}
                          <span className="capitalize">{latestSt.replace(/_/g, " ")}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {showWarning ? (
                      <span
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900"
                        title="Needs attention"
                      >
                        Attention
                      </span>
                    ) : null}
                    <span className="text-sm font-medium text-teal-700">Manage →</span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Next anchor
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-slate-800">
                      {new Date(p.nextAnchorAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Last generated
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-slate-800">
                      {p.lastGeneratedAt
                        ? new Date(p.lastGeneratedAt).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
