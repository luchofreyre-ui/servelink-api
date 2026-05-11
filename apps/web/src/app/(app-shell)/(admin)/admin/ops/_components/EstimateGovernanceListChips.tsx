"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const chipBase =
  "inline-flex max-w-full rounded border border-gray-200 bg-white px-2 py-0.5 text-xs leading-tight text-gray-800 hover:bg-gray-50";

function Chip({
  href,
  children,
  title,
}: {
  href: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link href={href} className={chipBase} title={title}>
      {children}
    </Link>
  );
}

export function EstimateGovernanceListChips(props: {
  bookingId: string;
  governanceSummary: unknown;
}) {
  const g = props.governanceSummary;
  if (!g || typeof g !== "object" || Array.isArray(g)) {
    return null;
  }
  const summary = g as Record<string, unknown>;
  const anchorRaw = summary.bookingDetailAnchor;
  const anchor =
    typeof anchorRaw === "string" && anchorRaw.startsWith("#")
      ? anchorRaw
      : "#estimate-governance";
  const href = `/admin/bookings/${encodeURIComponent(props.bookingId)}${anchor}`;

  const escalationLevel =
    typeof summary.escalationLevel === "string"
      ? summary.escalationLevel.trim()
      : "";
  const severityScore =
    typeof summary.severityScore === "number" &&
    Number.isFinite(summary.severityScore)
      ? Math.round(summary.severityScore)
      : null;

  const humanEsc =
    escalationLevel.length > 0
      ? escalationLevel.replace(/_/g, " ")
      : "governance";

  const recurring = summary.hasRecurringInstability === true;
  const sparse = summary.hasSparseIntakeSignal === true;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {escalationLevel && escalationLevel !== "none" ? (
        <Chip href={href} title="Estimate governance (escalation)">
          Esc: {humanEsc}
        </Chip>
      ) : null}
      {severityScore != null ? (
        <Chip href={href} title="Estimate governance (severity)">
          Sev {severityScore}
        </Chip>
      ) : null}
      {escalationLevel === "review" ? (
        <Chip href={href} title="Estimate governance">
          Review required
        </Chip>
      ) : null}
      {escalationLevel === "intervention_required" ? (
        <Chip href={href} title="Estimate governance">
          Intervention (advisory)
        </Chip>
      ) : null}
      {escalationLevel === "hard_block" ? (
        <Chip href={href} title="Advisory governance signal — not enforced">
          Hard block (advisory)
        </Chip>
      ) : null}
      {recurring ? (
        <Chip href={href} title="Estimate governance">
          Recurring instability
        </Chip>
      ) : null}
      {sparse ? (
        <Chip href={href} title="Estimate governance">
          Sparse intake
        </Chip>
      ) : null}
    </div>
  );
}
