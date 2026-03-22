"use client";

import { useEffect, useState } from "react";
import { WEB_ENV } from "@/lib/env";

interface StoredEvent {
  event: string;
  payload: Record<string, unknown>;
  at: string;
}

export function BookingUiTelemetryCard() {
  const [items, setItems] = useState<StoredEvent[]>([]);

  useEffect(() => {
    if (!WEB_ENV.enableBookingUiTelemetry) return;

    try {
      const raw = window.localStorage.getItem("servelink_booking_ui_events");
      const parsed = raw ? (JSON.parse(raw) as StoredEvent[]) : [];
      setItems(parsed.slice().reverse().slice(0, 20));
    } catch {
      setItems([]);
    }
  }, []);

  if (!WEB_ENV.enableBookingUiTelemetry) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Booking UI telemetry
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-50">
        Recent customer-side events
      </h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${item.event}-${item.at}-${index}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <p className="text-sm font-medium text-slate-100">{item.event}</p>
              <p className="mt-1 text-xs text-slate-400">{item.at}</p>
              <pre className="mt-2 overflow-auto text-xs text-slate-500">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            No telemetry events captured yet.
          </div>
        )}
      </div>
    </section>
  );
}
