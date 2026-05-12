"use client";

import Link from "next/link";
import { useMemo } from "react";
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

function humanizeToken(raw: string): string {
  return raw
    .replace(/_v\d+$/i, "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function payloadField(
  payload: unknown,
  key: string,
): string | number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

export type AdminOperationalTacticalContinuityStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalTacticalContinuityStrip(
  props: AdminOperationalTacticalContinuityStripProps,
) {
  const graph = props.dashboard?.persistedOperationalEntityGraph;
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const categoryByNodeId = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) m.set(n.id, n.entityCategory);
    return m;
  }, [nodes]);

  const sortedChronology = useMemo(() => {
    const frames = [...(graph?.chronologyFrames ?? [])];
    frames.sort((a, b) => {
      const ia = payloadField(a.payloadJson, "sequenceIndex");
      const ib = payloadField(b.payloadJson, "sequenceIndex");
      const na = typeof ia === "number" ? ia : 0;
      const nb = typeof ib === "number" ? ib : 0;
      return na - nb;
    });
    return frames;
  }, [graph?.chronologyFrames]);

  const zones = useMemo(() => {
    const z = new Map<string, number>();
    for (const n of nodes) {
      z.set(n.entityCategory, (z.get(n.entityCategory) ?? 0) + 1);
    }
    return [...z.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [nodes]);

  const navigationHints = useMemo(() => {
    return edges.filter((e) =>
      e.edgeCategory.includes("admin_navigation_hint"),
    );
  }, [edges]);

  if (props.loading) {
    return (
      <section
        id="operational-tactical-continuity-strip"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.tacticalContinuityTitle}
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
        id="operational-tactical-continuity-strip"
        aria-label={COMMAND_CENTER_UX.tacticalContinuityTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (nodes.length === 0 && sortedChronology.length === 0) {
    return (
      <section
        id="operational-tactical-continuity-strip"
        aria-label={COMMAND_CENTER_UX.tacticalContinuityTitle}
        className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.tacticalEmptyGraph}
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-tactical-continuity-strip"
      aria-label={COMMAND_CENTER_UX.tacticalContinuityTitle}
      className="rounded-2xl border border-cyan-400/15 bg-cyan-950/15 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
            {COMMAND_CENTER_UX.tacticalContinuityTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            {COMMAND_CENTER_UX.tacticalContinuitySubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          Graph batch{" "}
          <span className="font-medium text-slate-300">
            {fmtWhen(graph?.refreshedAt ?? null)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.tacticalGovernanceNote}
      </p>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/35 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {COMMAND_CENTER_UX.tacticalBreadcrumbLead}
        </p>
        <p className="mt-2 text-sm text-slate-200">
          {COMMAND_CENTER_UX.tacticalBreadcrumbTrail}
        </p>
      </div>

      {sortedChronology.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">
            {COMMAND_CENTER_UX.tacticalChronologyTitle}
          </h3>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {sortedChronology.map((frame, i) => {
              const labelRaw = payloadField(frame.payloadJson, "label");
              const label =
                labelRaw != null
                  ? String(labelRaw)
                  : humanizeToken(frame.chronologyCategory);
              const explain = payloadField(
                frame.payloadJson,
                "explainabilityRef",
              );
              const seq = payloadField(frame.payloadJson, "sequenceIndex");
              return (
                <li
                  key={`${frame.chronologyCategory}-${i}`}
                  className="rounded-lg border border-white/10 bg-slate-900/50 p-3 text-xs text-slate-300"
                >
                  <span className="font-mono text-[10px] text-slate-500">
                    {typeof seq === "number" ? seq : i}
                  </span>
                  <p className="mt-1 font-medium text-slate-100">{label}</p>
                  {explain != null ? (
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {String(explain)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {zones.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">
            {COMMAND_CENTER_UX.tacticalGraphZonesTitle}
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {zones.map(([cat, count]) => (
              <li
                key={cat}
                className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-300"
              >
                {humanizeToken(cat)}{" "}
                <span className="text-slate-500">×{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {navigationHints.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">
            {COMMAND_CENTER_UX.tacticalNavigationHintsTitle}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {navigationHints.map((e, i) => {
              const p =
                e.payloadJson && typeof e.payloadJson === "object"
                  ? (e.payloadJson as Record<string, unknown>)
                  : {};
              const path =
                typeof p.routePath === "string" ? p.routePath : "/admin/ops";
              const landmark =
                typeof p.routeLandmarkId === "string"
                  ? p.routeLandmarkId
                  : "";
              const href = `${path}${landmark ? `#${landmark}` : ""}`;
              return (
                <Link
                  key={`${e.id}-${i}`}
                  href={href}
                  className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15"
                >
                  Jump to {path}
                  {landmark ? ` (#${landmark})` : ""}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-100">
          {COMMAND_CENTER_UX.tacticalEdgesTitle}
        </h3>
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-xs text-slate-400">
          {edges.map((e) => {
            const src =
              categoryByNodeId.get(e.sourceNodeId) ??
              e.sourceNodeId.slice(0, 8);
            const tgt =
              categoryByNodeId.get(e.targetNodeId) ??
              e.targetNodeId.slice(0, 8);
            return (
              <li key={e.id}>
                <span className="text-slate-300">
                  {humanizeToken(String(src))}
                </span>
                <span className="mx-1 text-slate-600">→</span>
                <span className="text-slate-300">
                  {humanizeToken(String(tgt))}
                </span>
                <span className="ml-2 font-mono text-[10px] text-slate-600">
                  ({humanizeToken(e.edgeCategory)})
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {COMMAND_CENTER_UX.tacticalSampleWorkflowLabel}
          </h4>
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            {nodes
              .filter((n) =>
                n.entityCategory.includes("workflow_execution_observation"),
              )
              .map((n) => {
                const wfId = payloadField(
                  n.payloadJson,
                  "workflowExecutionId",
                );
                const wfType = payloadField(n.payloadJson, "workflowType");
                return (
                  <li key={n.id}>
                    <Link
                      href="/admin/workflow-executions"
                      className="text-cyan-200/90 underline-offset-2 hover:underline"
                    >
                      {wfId ? `${String(wfId).slice(0, 10)}…` : "Execution"}
                    </Link>
                    {wfType != null ? (
                      <span className="ml-2 text-slate-600">
                        {String(wfType)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {COMMAND_CENTER_UX.tacticalSampleIncidentLabel}
          </h4>
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            {nodes
              .filter((n) =>
                n.entityCategory.includes(
                  "operational_incident_coordination",
                ),
              )
              .map((n) => {
                const cat = payloadField(n.payloadJson, "incidentCategory");
                return (
                  <li key={n.id}>
                    <Link
                      href="#operational-incident-command-rail"
                      className="text-cyan-200/90 underline-offset-2 hover:underline"
                    >
                      {cat ? humanizeToken(String(cat)) : "Incident"}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </section>
  );
}
