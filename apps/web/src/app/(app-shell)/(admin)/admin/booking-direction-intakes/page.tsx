"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { WEB_ENV } from "@/lib/env";

type IntakeRow = {
  intakeId: string;
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  frequency: string;
  preferredTime: string;
  deepCleanProgram: string | null;
  hasEstimateFactors?: boolean;
  bookingHandoff?: unknown;
  assignmentExecution?: unknown;
  customerName: string | null;
  customerEmail: string | null;
  source: string | null;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
  };
  createdAt: string;
};

function handoffSummary(h: unknown): string {
  if (h == null || typeof h !== "object") return "—";
  const o = h as Record<string, unknown>;
  const sched = o.scheduling as Record<string, unknown> | undefined;
  const mode = typeof sched?.mode === "string" ? sched.mode : "";
  const cleaner = o.cleanerPreference as Record<string, unknown> | undefined;
  const cMode = typeof cleaner?.mode === "string" ? cleaner.mode : "";
  const parts = [mode && `sched:${mode}`, cMode && `cleaner:${cMode}`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "present";
}

function schedulingSlotDetail(h: unknown): string | null {
  if (h == null || typeof h !== "object") return null;
  const sched = (h as Record<string, unknown>).scheduling as
    | Record<string, unknown>
    | undefined;
  if (!sched) return null;
  const mode = typeof sched.mode === "string" ? sched.mode : "";
  const label =
    typeof sched.selectedSlotLabel === "string" && sched.selectedSlotLabel.trim()
      ? sched.selectedSlotLabel.trim()
      : null;
  const start =
    typeof sched.selectedSlotWindowStart === "string"
      ? sched.selectedSlotWindowStart.trim()
      : "";
  const end =
    typeof sched.selectedSlotWindowEnd === "string"
      ? sched.selectedSlotWindowEnd.trim()
      : "";
  const fo =
    typeof sched.selectedSlotFoId === "string" && sched.selectedSlotFoId.trim()
      ? `fo:${sched.selectedSlotFoId.trim().slice(0, 8)}…`
      : "";
  const hold =
    typeof sched.holdId === "string" && sched.holdId.trim()
      ? `hold:${sched.holdId.trim().slice(0, 10)}…`
      : "";
  const bits = [mode, label, start && end ? `${start}→${end}` : "", fo, hold].filter(
    Boolean,
  );
  return bits.length > 1 ? bits.join(" · ") : null;
}

function assignmentEngineColumns(ex: unknown): {
  status: string;
  reasons: string;
  continuity: string;
  liveSummary: string;
  rankingSummary: string;
} {
  if (ex == null || typeof ex !== "object") {
    return {
      status: "—",
      reasons: "No evaluation stored (legacy intake or pre-engine row).",
      continuity: "—",
      liveSummary: "—",
      rankingSummary: "—",
    };
  }
  const o = ex as Record<string, unknown>;
  const ev = o.evaluation as Record<string, unknown> | undefined;
  const status = typeof ev?.status === "string" ? ev.status : "—";
  const rc = ev?.reasonCodes;
  const reasons =
    Array.isArray(rc) && rc.length ? rc.slice(0, 8).join(", ") : "(none)";
  const parts: string[] = [];
  if (ev?.matchedPreferredCleaner === true) parts.push("preferred match");
  if (ev?.recurringContinuityCandidate === true) parts.push("continuity candidate");
  return {
    status,
    reasons,
    continuity: parts.length ? parts.join(" · ") : "—",
    liveSummary: liveExecutionSummary(o, ev),
    rankingSummary: rankingExecutionSummary(ev),
  };
}

function rankingExecutionSummary(
  ev: Record<string, unknown> | undefined,
): string {
  if (!ev) return "—";
  const conf =
    typeof ev.recommendationConfidence === "string"
      ? ev.recommendationConfidence
      : "";
  const sum = ev.recommendationReasonSummary;
  const sumLine =
    Array.isArray(sum) && sum.length
      ? sum
          .slice(0, 3)
          .map((x) => String(x))
          .join(" · ")
      : "";
  const ranked = ev.rankedCandidates;
  let top = "";
  if (Array.isArray(ranked) && ranked.length) {
    top = ranked
      .slice(0, 3)
      .map((row) => {
        const r = row as Record<string, unknown>;
        const label =
          typeof r.cleanerLabel === "string" && r.cleanerLabel.trim()
            ? r.cleanerLabel.trim()
            : String(r.cleanerId ?? "");
        const score = typeof r.score === "number" ? r.score : "?";
        const pref = r.matchedPreferredCleaner === true ? "★pref" : "";
        const cont = r.recurringContinuityCandidate === true ? "★cont" : "";
        const tags = [pref, cont].filter(Boolean).join("");
        return `${label}:${score}${tags ? ` ${tags}` : ""}`;
      })
      .join(" | ");
  }
  const bits = [
    conf && `confidence ${conf}`,
    sumLine || null,
    top && `top: ${top}`,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "—";
}

function liveExecutionSummary(
  root: Record<string, unknown>,
  ev: Record<string, unknown> | undefined,
): string {
  const li = root.liveInputs as Record<string, unknown> | undefined;
  const cleaners = li?.availableCleaners;
  const n = Array.isArray(cleaners) ? cleaners.length : null;
  const rc = li?.recurringContinuityContext as
    | Record<string, unknown>
    | undefined;
  const hasPrior =
    typeof rc?.priorCleanerId === "string" && rc.priorCleanerId.trim().length > 0;
  const priorLabel =
    typeof rc?.priorCleanerLabel === "string" && rc.priorCleanerLabel.trim()
      ? rc.priorCleanerLabel.trim()
      : null;
  const parts: string[] = [];
  const recLabel =
    typeof ev?.recommendedCleanerLabel === "string"
      ? ev.recommendedCleanerLabel.trim()
      : "";
  if (recLabel) parts.push(`recommended: ${recLabel}`);
  else if (
    typeof ev?.recommendedCleanerId === "string" &&
    ev.recommendedCleanerId.trim()
  ) {
    parts.push(`recommended id: ${ev.recommendedCleanerId}`);
  }
  if (ev?.matchedPreferredCleaner === true) parts.push("preferred match: yes");
  if (ev?.recurringContinuityCandidate === true) {
    parts.push("continuity: yes");
  } else if (hasPrior) {
    parts.push(
      priorLabel
        ? `continuity: no (prior ${priorLabel})`
        : "continuity: no (prior not on roster)",
    );
  }
  if (n != null) parts.push(`available cleaners: ${n}`);
  return parts.length ? parts.join(" · ") : "—";
}

export default function AdminBookingDirectionIntakesPage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<IntakeRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${WEB_ENV.apiBaseUrl}/admin/booking-direction-intakes?limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as {
          items?: IntakeRow[];
          total?: number;
        };
        if (cancelled) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load booking intakes",
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
  }, [token, tokenChecked]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Lead intake
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Booking direction captures
            </h1>
            <p className="max-w-3xl text-sm text-white/70">
              Service request intakes from the public booking flow. These are{" "}
              <strong className="font-semibold text-white/90">
                not committed bookings
              </strong>
              — intent only, for ops follow-up.               Rows created after the live-input drop include{" "}
              <strong className="font-semibold text-white/90">assignmentExecution</strong>{" "}
              (constraints, evaluation, and a minimal{" "}
              <strong className="font-semibold text-white/90">liveInputs</strong> roster snapshot) when
              the intake bridge ran.
            </p>
          </div>
          <Link
            href="/admin"
            className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
          >
            ← Admin home
          </Link>
        </div>

        {!tokenChecked || !token ? (
          <p className="text-sm text-amber-200/90">
            Sign in via{" "}
            <Link href="/admin/auth" className="underline">
              /admin/auth
            </Link>{" "}
            to view intakes.
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400">
              Showing {items.length} of {total} total intakes (newest first).
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Received</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Deep clean</th>
                    <th className="px-4 py-3 font-medium">Estimate Q</th>
                    <th className="px-4 py-3 font-medium">Home</th>
                    <th className="px-4 py-3 font-medium">Schedule</th>
                    <th className="px-4 py-3 font-medium">Handoff</th>
                    <th className="px-4 py-3 font-medium">Assignment</th>
                    <th className="px-4 py-3 font-medium">Reason codes</th>
                    <th className="px-4 py-3 font-medium">Continuity / pref</th>
                    <th className="px-4 py-3 font-medium">Live execution</th>
                    <th className="px-4 py-3 font-medium">Ranking</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Attribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No booking direction intakes yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const ax = assignmentEngineColumns(row.assignmentExecution);
                      const slotLine = schedulingSlotDetail(row.bookingHandoff);
                      return (
                      <tr
                        key={row.intakeId}
                        className="align-top text-slate-200 hover:bg-white/[0.02]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-teal-200/90">
                          {row.serviceId}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-300">
                          {row.deepCleanProgram ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-300">
                          {row.hasEstimateFactors ? "Yes" : "—"}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-xs leading-relaxed text-slate-300">
                          {row.bedrooms} · {row.bathrooms} · {row.homeSize}
                          {row.pets ? (
                            <span className="mt-1 block text-slate-500">
                              Pets: {row.pets}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-[200px] px-4 py-3 text-xs leading-relaxed text-slate-300">
                          {row.frequency}
                          <span className="mt-1 block text-slate-500">
                            {row.preferredTime}
                          </span>
                          {slotLine ? (
                            <span className="mt-2 block rounded-md border border-teal-500/20 bg-teal-500/5 px-2 py-1 font-mono text-[10px] leading-snug text-teal-100/90">
                              {slotLine}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-[180px] px-4 py-3 text-xs leading-relaxed text-slate-400">
                          {handoffSummary(row.bookingHandoff)}
                        </td>
                        <td className="max-w-[120px] whitespace-nowrap px-4 py-3 font-mono text-[11px] text-amber-100/90">
                          {ax.status}
                        </td>
                        <td className="max-w-[200px] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
                          {ax.reasons}
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
                          {ax.continuity}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
                          {ax.liveSummary}
                        </td>
                        <td className="max-w-[240px] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
                          {ax.rankingSummary}
                        </td>
                        <td className="max-w-[200px] px-4 py-3 text-xs leading-relaxed text-slate-300">
                          {row.customerName || row.customerEmail ? (
                            <>
                              {row.customerName ? (
                                <span className="block text-slate-200">
                                  {row.customerName}
                                </span>
                              ) : null}
                              {row.customerEmail ? (
                                <span className="mt-1 block font-mono text-[11px] text-slate-400">
                                  {row.customerEmail}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="max-w-[240px] px-4 py-3 text-xs leading-relaxed text-slate-400">
                          {row.source ? (
                            <span className="text-slate-300">src: {row.source}</span>
                          ) : null}
                          {row.utm?.source || row.utm?.medium ? (
                            <span className="mt-1 block">
                              utm: {[row.utm.source, row.utm.medium]
                                .filter(Boolean)
                                .join(" / ")}
                            </span>
                          ) : null}
                          {!row.source &&
                          !row.utm?.source &&
                          !row.utm?.medium ? (
                            <span className="text-slate-600">—</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
