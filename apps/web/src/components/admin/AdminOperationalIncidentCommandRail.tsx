"use client";

import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function humanizeIncidentCategory(category: string): string {
  const stripped = category.replace(/_v\d+$/i, "");
  return stripped
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function payloadStr(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function payloadNum(payload: unknown, key: string): number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function payloadBool(payload: unknown, key: string): boolean | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "boolean" ? v : null;
}

/** Compact deterministic metric lines from incident payload (known keys only). */
function incidentMetricLines(payload: unknown): string[] {
  const lines: string[] = [];
  const pairs: Array<[string, string]> = [];
  const n = (k: string, label: string) => {
    const v = payloadNum(payload, k);
    if (v != null) pairs.push([label, String(v)]);
  };
  n("workflowsGovernanceBlocked", "Governance-blocked workflows");
  n("overdueWorkflowTimers", "Overdue workflow timers");
  n("governanceStepsBlocked7d", "Governance-blocked steps (7d)");
  n("waitingApprovalWorkflowsAged72hPlus", "Waiting approval ≥72h");
  n("openEscalations", "Open escalations");
  n("pendingApprovals", "Pending approvals");
  const escRatio = payloadNum(payload, "escalationOpenPerPendingApprox");
  if (escRatio != null) {
    pairs.push(["Escalations per pending (approx)", escRatio.toFixed(2)]);
  }
  n("balancingAttentionRows", "Balancing attention rows");
  n("congestionAttentionRows", "Congestion attention rows");
  const attempts = payloadNum(payload, "deliveryAttempts24h");
  const successes = payloadNum(payload, "deliverySuccess24h");
  if (attempts != null && successes != null) {
    pairs.push(["Delivery 24h success rate", `${successes}/${attempts}`]);
  }
  n("safetyEvaluationsAttentionLast24h", "Safety eval attention (24h)");
  n("dryRunsFailedLast24h", "Dry runs failed (24h)");
  n("simulationsCompletedLast24h", "Simulations completed (24h)");
  n("validityCertificationsObserved", "Validity certifications observed");
  const aligned = payloadBool(payload, "policyEngineAligned");
  if (aligned != null) {
    pairs.push(["Policy engine aligned", aligned ? "yes" : "no"]);
  }
  n("policyAttentionEvaluations", "Policy attention evaluations");
  for (const [label, val] of pairs) {
    lines.push(`${label}: ${val}`);
  }
  return lines;
}

export type AdminOperationalIncidentCommandRailProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalIncidentCommandRail(
  props: AdminOperationalIncidentCommandRailProps,
) {
  const cmd = props.dashboard?.persistedOperationalIncidentCommand;
  const incidents = cmd?.incidents ?? [];

  if (props.loading) {
    return (
      <section
        id="operational-incident-command-rail"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.incidentCommandRailTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.coordinatedLoading}
        </p>
      </section>
    );
  }

  if (props.error) {
    return (
      <section
        id="operational-incident-command-rail"
        aria-label={COMMAND_CENTER_UX.incidentCommandRailTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  return (
    <section
      id="operational-incident-command-rail"
      aria-label={COMMAND_CENTER_UX.incidentCommandRailTitle}
      className="rounded-2xl border border-indigo-400/20 bg-indigo-950/20 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/90">
            {COMMAND_CENTER_UX.incidentCommandRailTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            {COMMAND_CENTER_UX.incidentCommandRailSubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          Batch refreshed{" "}
          <span className="font-medium text-slate-300">
            {fmtWhen(cmd?.refreshedAt ?? null)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.incidentCommandGovernanceNote}
      </p>

      {incidents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          {COMMAND_CENTER_UX.incidentCommandEmpty}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {incidents.map((inc) => {
            const explain = payloadStr(inc.payloadJson, "explainabilityRef");
            const metrics = incidentMetricLines(inc.payloadJson);
            const trailGraph = inc.trails.find((t) =>
              t.trailCategory.includes("investigation_graph"),
            );
            const edgeCount =
              trailGraph && typeof trailGraph.payloadJson === "object"
                ? (trailGraph.payloadJson as Record<string, unknown>)
                    .drilldownEdgeCount
                : null;

            return (
              <li
                key={inc.id}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-50">
                      {humanizeIncidentCategory(inc.incidentCategory)}
                    </h3>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                      {inc.incidentState.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={
                      inc.severity === "attention"
                        ? "rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-100"
                        : "rounded-full border border-slate-500/40 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-300"
                    }
                  >
                    {inc.severity === "attention"
                      ? COMMAND_CENTER_UX.severityAttentionLabel
                      : COMMAND_CENTER_UX.severityInfoLabel}
                  </span>
                </div>

                {explain ? (
                  <p className="mt-2 font-mono text-[11px] text-slate-500">
                    {explain}
                  </p>
                ) : null}

                {metrics.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    {metrics.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}

                {typeof edgeCount === "number" ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Investigation graph edges (disclosed routes): {edgeCount}
                  </p>
                ) : null}

                {inc.links.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inc.links.map((lnk, idx) => {
                      const lpayload =
                        typeof lnk.payloadJson === "object" &&
                        lnk.payloadJson &&
                        !Array.isArray(lnk.payloadJson)
                          ? (lnk.payloadJson as Record<string, unknown>)
                          : {};
                      const label =
                        typeof lpayload.routeLabel === "string"
                          ? lpayload.routeLabel
                          : "Drilldown";
                      const anchor =
                        typeof lpayload.routeAnchor === "string"
                          ? lpayload.routeAnchor
                          : null;
                      const href = `${lnk.linkedObjectId}${anchor ? `#${anchor}` : ""}`;
                      return (
                        <Link
                          key={`${lnk.linkedObjectId}-${idx}-${label}`}
                          href={href}
                          className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/20"
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
