"use client";

import Link from "next/link";
import type { SystemTestFailureFamilySummary } from "@/types/systemTests";

type Props = {
  family: SystemTestFailureFamilySummary;
  /** When set, show how many groups in the current list share this family. */
  siblingCountInRun?: number;
  className?: string;
};

export function SystemTestsFailureFamilyInline(props: Props) {
  const { family, siblingCountInRun, className = "" } = props;

  return (
    <div
      className={`rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90 ${className}`}
    >
      <p className="font-semibold uppercase tracking-wide text-cyan-200/70">Root-cause family</p>
      <p className="mt-1 text-sm text-white/90">{family.displayTitle}</p>
      <p className="mt-1 text-white/55">
        {family.recurrenceLine} · trend {family.trendKind} · status {family.status}
      </p>
      {siblingCountInRun != null && siblingCountInRun > 1 ?
        <p className="mt-1 text-white/45">
          {siblingCountInRun} groups in this run map to this family.
        </p>
      : null}
      <Link
        href={`/admin/system-tests/families/${family.familyId}`}
        className="mt-2 inline-block text-cyan-300 hover:text-cyan-200"
      >
        Open family detail
      </Link>
    </div>
  );
}
