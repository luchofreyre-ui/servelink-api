"use client";

import Link from "next/link";
import type { SystemTestIncidentSummary } from "@/types/systemTests";

type Props = {
  incident: SystemTestIncidentSummary;
  /** When this group’s family is the incident lead family. */
  isLeadFamily?: boolean;
};

export function SystemTestsIncidentInline(props: Props) {
  const { incident, isLeadFamily } = props;
  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-xs text-cyan-100/90">
      <p className="font-semibold uppercase tracking-wide text-cyan-200/70">Incident</p>
      <p className="mt-0.5">
        <Link
          href={`/admin/system-tests/incidents/${encodeURIComponent(incident.incidentKey)}`}
          className="text-cyan-200 underline decoration-cyan-500/40 hover:decoration-cyan-200"
        >
          {incident.displayTitle}
        </Link>
      </p>
      <p className="mt-1 text-cyan-100/75">
        Severity: <span className="text-white/90">{incident.severity}</span>
        {" · "}
        Status: <span className="text-white/90">{incident.status}</span>
        {isLeadFamily ?
          <span className="ml-2 text-amber-200/90">Lead incident family</span>
        : null}
      </p>
    </div>
  );
}
