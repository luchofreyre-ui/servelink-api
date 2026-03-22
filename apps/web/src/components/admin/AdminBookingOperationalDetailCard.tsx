"use client";

import { useEffect, useState } from "react";
import { getAdminBookingOperationalDetail } from "@/lib/api/payments";
import { getStoredAccessToken } from "@/lib/auth";
import type { AdminBookingOperationalDetail } from "@/types/payments";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function AdminBookingOperationalDetailCard(props: {
  bookingId: string;
}) {
  const [data, setData] = useState<AdminBookingOperationalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const token = getStoredAccessToken();
      if (!token) {
        if (!cancelled) {
          setError("No auth token. Sign in through /admin/auth first.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const next = await getAdminBookingOperationalDetail(props.bookingId, token);
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load operational detail",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [props.bookingId]);

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Loading operational detail...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {error ?? "Operational detail unavailable"}
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
          Booking operations
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white">
          Commercial and payment detail
        </h3>
        <p className="mt-1 text-sm text-white/55">
          From{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
            GET /api/v1/admin/bookings/:id/operational-detail
          </code>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Status</p>
          <p className="mt-2 text-sm font-semibold text-white">{data.status}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Payment</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {data.paymentStatus ?? "none"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Quoted Total</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMoney(data.quotedTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Intent ID</p>
          <p className="mt-2 break-all text-xs text-white/75">
            {data.paymentIntentId ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h4 className="text-sm font-semibold text-white">Payments</h4>
          <div className="mt-3 space-y-3">
            {data.payments.length ? (
              data.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-lg border border-white/10 bg-neutral-950/60 p-3"
                >
                  <p className="text-sm font-medium text-white">
                    {formatMoney(payment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">{payment.status}</p>
                  <p className="mt-1 text-xs text-white/40">{payment.externalRef ?? "—"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No payments recorded.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h4 className="text-sm font-semibold text-white">Trust events</h4>
          <div className="mt-3 space-y-3">
            {data.trustEvents.length ? (
              data.trustEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-white/10 bg-neutral-950/60 p-3"
                >
                  <p className="text-sm font-medium text-white">{event.type}</p>
                  <p className="mt-1 text-xs text-white/50">{event.createdAt}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No trust events recorded.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h4 className="text-sm font-semibold text-white">Ops anomalies</h4>
          <div className="mt-3 space-y-3">
            {data.opsAnomalies.length ? (
              data.opsAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="rounded-lg border border-white/10 bg-neutral-950/60 p-3"
                >
                  <p className="text-sm font-medium text-white">{anomaly.title}</p>
                  <p className="mt-1 text-xs text-white/50">{anomaly.type}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {anomaly.detail ?? "No detail"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No anomalies recorded.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
