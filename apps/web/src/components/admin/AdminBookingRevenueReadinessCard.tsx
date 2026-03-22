"use client";

import { useEffect, useState } from "react";
import { getAdminOpenOpsAnomalies } from "@/lib/api/payments";
import { getStoredAccessToken } from "@/lib/auth";

export function AdminBookingRevenueReadinessCard() {
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [paymentRelatedCount, setPaymentRelatedCount] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getStoredAccessToken();
      if (!token) {
        if (!cancelled) {
          setError("Sign in required.");
          setOpenCount(null);
          setPaymentRelatedCount(null);
        }
        return;
      }

      try {
        const anomalies = await getAdminOpenOpsAnomalies(token);
        if (cancelled) return;

        setOpenCount(anomalies.length);
        setPaymentRelatedCount(
          anomalies.filter(
            (item) =>
              item.type === "payment_missing" ||
              item.type === "payment_mismatch",
          ).length,
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load revenue readiness",
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

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Revenue readiness
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-50">
        Payment operations snapshot
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Open anomalies
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {openCount ?? "—"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Payment-related
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {paymentRelatedCount ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
