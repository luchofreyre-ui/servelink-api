"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  fetchAdminBookingFunnelMilestones,
  type AdminBookingFunnelMilestoneRow,
} from "@/lib/api/adminBookingFunnelMilestones";

function milestoneDisplayLabel(milestone: string): string {
  const map: Record<string, string> = {
    REVIEW_VIEWED: "Review viewed",
    REVIEW_ABANDONED: "Review abandoned",
    DEPOSIT_UI_REACHED: "Deposit UI reached",
    DEPOSIT_SUBMIT_INITIATED: "Pay clicked (deposit submit)",
    DEPOSIT_SUCCEEDED: "Deposit succeeded",
    BOOKING_REENTRY: "Booking reentered",
    RECURRING_CADENCE_SELECTED: "Recurring cadence selected",
  };
  return map[milestone] ?? milestone.replace(/_/g, " ");
}

function formatCadenceHuman(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  if (raw === "every_10_days") return "Every 10 days";
  return raw
    .split(/_/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Time unknown";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Time unknown";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminBookingFunnelMilestonesSection(props: {
  bookingId: string;
}) {
  const [rows, setRows] = useState<AdminBookingFunnelMilestoneRow[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const token = getStoredAccessToken();
      if (!token) {
        if (!cancelled) {
          setError("No auth token. Sign in through /admin/auth first.");
          setRows(null);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await fetchAdminBookingFunnelMilestones(
          props.bookingId,
          token,
        );
        if (!cancelled) setRows(data.milestones ?? []);
      } catch (e) {
        if (!cancelled) {
          setRows(null);
          setError(
            e instanceof Error ? e.message : "Failed to load funnel milestones",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.bookingId]);

  const summary = useMemo(() => {
    if (!rows?.length) return null;
    return `${rows.length} event${rows.length === 1 ? "" : "s"}`;
  }, [rows]);

  return (
    <section
      role="region"
      aria-label="Booking funnel milestones"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
            Public funnel
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Booking funnel milestones
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Read-only durable echoes from{" "}
            <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
              BookingEvent
            </code>{" "}
            notes and linked intake snapshots. Not payment authority.
          </p>
        </div>
        {summary ? (
          <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-medium text-white/70">
            {summary}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-white/55">Loading milestones…</p>
      ) : error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : !rows?.length ? (
        <p className="text-sm text-white/55">
          No durable funnel milestones recorded for this booking yet. Events may
          still exist only on the linked intake before a booking id existed, or
          the customer may not have reached instrumented steps.
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={`${row.source}-${row.bookingEventId ?? row.milestone}-${index}`}
              className="flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
            >
              <div className="min-w-[140px] shrink-0 text-xs text-white/45">
                {formatWhen(row.occurredAt)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-teal-500/35 bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-teal-100">
                    {milestoneDisplayLabel(row.milestone)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                      row.source === "intake"
                        ? "border border-violet-400/30 bg-violet-500/15 text-violet-100"
                        : "border border-slate-400/25 bg-slate-500/15 text-slate-200"
                    }`}
                  >
                    {row.source === "intake" ? "Intake JSON" : "Booking event"}
                  </span>
                </div>
                <div className="text-xs leading-relaxed text-white/60">
                  {row.milestone === "RECURRING_CADENCE_SELECTED" &&
                  row.cadence ? (
                    <span className="text-white/85">
                      Cadence:{" "}
                      <strong className="font-semibold">
                        {formatCadenceHuman(row.cadence)}
                      </strong>
                    </span>
                  ) : null}
                  {row.surface ? (
                    <span className="block text-white/55">
                      Surface: {row.surface}
                    </span>
                  ) : null}
                  {row.sessionHint ? (
                    <span className="block font-mono text-[11px] text-white/45">
                      Session ref: {row.sessionHint}
                    </span>
                  ) : null}
                  {!row.surface &&
                  !row.sessionHint &&
                  !(
                    row.milestone === "RECURRING_CADENCE_SELECTED" && row.cadence
                  ) ? (
                    <span className="text-white/35">—</span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
