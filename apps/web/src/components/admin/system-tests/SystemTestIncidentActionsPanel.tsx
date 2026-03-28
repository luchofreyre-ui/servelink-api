"use client";

import Link from "next/link";
import type { SystemTestIncidentActionListItem } from "@/types/systemTestIncidentActions";
import { SystemTestIncidentValidationBadge } from "./SystemTestIncidentValidationBadge";

function statusPill(status: string) {
  return (
    <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
      {status}
    </span>
  );
}

function priorityPill(priority: string) {
  const hot = priority === "critical" || priority === "high";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        hot ?
          "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : "border-white/15 bg-white/[0.06] text-white/65"
      }`}
    >
      {priority}
    </span>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  items: SystemTestIncidentActionListItem[];
  loading: boolean;
  error: string | null;
  emptyLabel: string;
  viewAllHref: string;
};

export function SystemTestIncidentActionsPanel({
  title,
  subtitle,
  items,
  loading,
  error,
  emptyLabel,
  viewAllHref,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ?
            <p className="mt-1 text-xs text-white/45">{subtitle}</p>
          : null}
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-teal-300 hover:text-teal-200"
        >
          View all →
        </Link>
      </div>
      {error ?
        <p className="mt-3 text-xs text-red-300">{error}</p>
      : null}
      {loading ?
        <p className="mt-4 text-sm text-white/45">Loading…</p>
      : items.length === 0 ?
        <p className="mt-4 text-sm text-white/45">{emptyLabel}</p>
      : (
        <ul className="mt-4 divide-y divide-white/10">
          {items.map((row) => (
            <li key={row.incidentKey}>
              <Link
                href={`/admin/system-tests/incidents/${encodeURIComponent(row.incidentKey)}`}
                className="block py-3 transition hover:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {priorityPill(row.priority)}
                  {statusPill(row.status)}
                  <SystemTestIncidentValidationBadge
                    status={row.status}
                    validationState={row.validationState}
                    compact
                  />
                </div>
                <p className="mt-1 font-medium text-white">
                  {row.title || row.summary || "Untitled"}
                </p>
                {row.summary && row.title ?
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/45">{row.summary}</p>
                : null}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/45">
                  <span>Owner: {row.ownerName || row.ownerUserId || "—"}</span>
                  <span>
                    Steps: {row.completedSteps}/{row.totalSteps}
                  </span>
                  <span className="font-mono">
                    Last run: {row.lastSeenRunId?.slice(0, 8) ?? "—"}…
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
