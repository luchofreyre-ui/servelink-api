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
  recurringEconomicsSummary?: unknown;
}) {
  const g = props.governanceSummary;
  const hasGov =
    g != null && typeof g === "object" && !Array.isArray(g);
  const recRaw = props.recurringEconomicsSummary;
  const hasRec =
    recRaw != null &&
    typeof recRaw === "object" &&
    !Array.isArray(recRaw);
  if (!hasGov && !hasRec) return null;

  const summary = (hasGov ? g : {}) as Record<string, unknown>;
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
      {hasGov && escalationLevel && escalationLevel !== "none" ? (
        <Chip href={href} title="Estimate governance (escalation)">
          Esc: {humanEsc}
        </Chip>
      ) : null}
      {hasGov && severityScore != null ? (
        <Chip href={href} title="Estimate governance (severity)">
          Sev {severityScore}
        </Chip>
      ) : null}
      {hasGov && escalationLevel === "review" ? (
        <Chip href={href} title="Estimate governance">
          Review required
        </Chip>
      ) : null}
      {hasGov && escalationLevel === "intervention_required" ? (
        <Chip href={href} title="Estimate governance">
          Intervention (advisory)
        </Chip>
      ) : null}
      {hasGov && escalationLevel === "hard_block" ? (
        <Chip href={href} title="Advisory governance signal — not enforced">
          Hard block (advisory)
        </Chip>
      ) : null}
      {hasGov && recurring ? (
        <Chip href={href} title="Estimate governance">
          Recurring instability
        </Chip>
      ) : null}
      {hasGov && sparse ? (
        <Chip href={href} title="Estimate governance">
          Sparse intake
        </Chip>
      ) : null}
      <RecurringEconomicsOpsChips
        bookingId={props.bookingId}
        recurring={props.recurringEconomicsSummary}
      />
    </div>
  );
}

function RecurringEconomicsOpsChips(props: {
  bookingId: string;
  recurring: unknown;
}) {
  const r = props.recurring;
  if (!r || typeof r !== "object" || Array.isArray(r)) {
    return null;
  }
  const summary = r as Record<string, unknown>;
  const anchorRaw = summary.bookingDetailAnchor;
  const anchor =
    typeof anchorRaw === "string" && anchorRaw.startsWith("#")
      ? anchorRaw
      : "#estimate-governance";
  const href = `/admin/bookings/${encodeURIComponent(props.bookingId)}${anchor}`;

  const economic =
    typeof summary.economicRiskLevel === "string"
      ? summary.economicRiskLevel.trim()
      : "";
  const maintenance =
    typeof summary.maintenanceViability === "string"
      ? summary.maintenanceViability.trim()
      : "";

  const chips: ReactNode[] = [];

  if (
    economic === "high" ||
    economic === "critical" ||
    summary.hasDiscountRisk === true
  ) {
    chips.push(
      <Chip key="rec-risk" href={href} title="Recurring economics">
        Recurring risk: {economic || "elevated"}
      </Chip>,
    );
  }

  if (summary.hasResetRisk === true) {
    chips.push(
      <Chip key="reset" href={href} title="Recurring economics">
        Reset review
      </Chip>,
    );
  }

  if (summary.hasMarginProtection === true) {
    chips.push(
      <Chip key="margin" href={href} title="Recurring economics">
        Margin protection
      </Chip>,
    );
  }

  if (
    maintenance === "unstable" ||
    maintenance === "reset_review_needed"
  ) {
    chips.push(
      <Chip key="maint" href={href} title="Recurring economics">
        Maintenance unstable
      </Chip>,
    );
  }

  if (chips.length === 0) return null;
  return <>{chips}</>;
}
