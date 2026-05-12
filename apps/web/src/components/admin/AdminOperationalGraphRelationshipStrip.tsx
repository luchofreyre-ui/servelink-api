"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function humanizeToken(raw: string): string {
  return raw
    .replace(/_v\d+$/i, "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type AdminOperationalGraphRelationshipStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalGraphRelationshipStrip(
  props: AdminOperationalGraphRelationshipStripProps,
) {
  const graph = props.dashboard?.persistedOperationalEntityGraph;
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const categoryByNodeId = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) m.set(n.id, n.entityCategory);
    return m;
  }, [nodes]);

  const warehouseNodeIds = useMemo(() => {
    return new Set(
      nodes
        .filter((n) =>
          n.entityCategory.toLowerCase().includes("warehouse_batch_anchor"),
        )
        .map((n) => n.id),
    );
  }, [nodes]);

  const edgeHistogram = useMemo(() => {
    const h = new Map<string, number>();
    for (const e of edges) {
      h.set(e.edgeCategory, (h.get(e.edgeCategory) ?? 0) + 1);
    }
    return [...h.entries()].sort((a, b) =>
      b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0]),
    );
  }, [edges]);

  const anchorChains = useMemo(() => {
    return edges.filter(
      (e) =>
        warehouseNodeIds.has(e.sourceNodeId) ||
        warehouseNodeIds.has(e.targetNodeId),
    );
  }, [edges, warehouseNodeIds]);

  const incidentCorrelationEdges = useMemo(() => {
    return edges.filter((e) =>
      e.edgeCategory.toLowerCase().includes("incident"),
    );
  }, [edges]);

  const escalationHints = useMemo(() => {
    return edges.filter((e) =>
      e.edgeCategory.toLowerCase().includes("navigation_hint"),
    );
  }, [edges]);

  if (props.loading) {
    return (
      <section
        id="operational-graph-relationship-rail"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.graphRelationshipRailTitle}
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
        id="operational-graph-relationship-rail"
        aria-label={COMMAND_CENTER_UX.graphRelationshipRailTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (nodes.length === 0 && edges.length === 0) {
    return (
      <section
        id="operational-graph-relationship-rail"
        aria-label={COMMAND_CENTER_UX.graphRelationshipRailTitle}
        className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.graphRelationshipRailEmpty}
        </p>
      </section>
    );
  }

  const maxHist = edgeHistogram[0]?.[1] ?? 1;

  return (
    <section
      id="operational-graph-relationship-rail"
      aria-label={COMMAND_CENTER_UX.graphRelationshipRailTitle}
      className="rounded-2xl border border-teal-400/18 bg-teal-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-200/90">
            {COMMAND_CENTER_UX.graphRelationshipRailTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            {COMMAND_CENTER_UX.graphRelationshipRailSubtitle}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.graphRelationshipRailGovernanceNote}
      </p>

      <div className="mt-4 rounded-lg border border-teal-400/18 bg-teal-950/22 px-3 py-2 motion-safe:transition-colors motion-safe:duration-200">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-200/85">
          {COMMAND_CENTER_UX.graphContinuityImmersionLead}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-slate-400">
          {COMMAND_CENTER_UX.graphContinuityImmersionExplain}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Nodes {nodes.length} · Edges {edges.length} · Edge categories{" "}
          {edgeHistogram.length}
          {edgeHistogram[0] ?
            <>
              {" "}
              · Dominant linkage{" "}
              <span className="text-slate-400">
                {humanizeToken(edgeHistogram[0][0])} ({edgeHistogram[0][1]})
              </span>
            </>
          : null}
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {COMMAND_CENTER_UX.graphEdgeCategoryHeatTitle}
          </h3>
          <ul className="mt-3 space-y-2">
            {edgeHistogram.slice(0, 10).map(([cat, count]) => (
              <li key={cat} className="text-xs text-slate-400">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-300">{humanizeToken(cat)}</span>
                  <span className="font-mono text-slate-500">{count}</span>
                </div>
                <div
                  className="mt-1 h-1.5 rounded-full bg-white/5"
                  aria-hidden
                >
                  <div
                    className="h-1.5 rounded-full bg-teal-400/40"
                    style={{
                      width: `${Math.min(100, Math.round((count / maxHist) * 100))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {COMMAND_CENTER_UX.graphWarehouseChainTitle}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {COMMAND_CENTER_UX.graphWarehouseChainSubtitle}
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[11px] text-slate-400">
              {anchorChains.length === 0 ?
                <li>{COMMAND_CENTER_UX.graphWarehouseChainEmpty}</li>
              : anchorChains.map((e) => {
                  const src =
                    categoryByNodeId.get(e.sourceNodeId) ?? e.sourceNodeId;
                  const tgt =
                    categoryByNodeId.get(e.targetNodeId) ?? e.targetNodeId;
                  return (
                    <li key={e.id}>
                      {humanizeToken(String(src))}{" "}
                      <span className="text-slate-600">→</span>{" "}
                      {humanizeToken(String(tgt))}{" "}
                      <span className="text-slate-600">
                        ({humanizeToken(e.edgeCategory)})
                      </span>
                    </li>
                  );
                })
              }
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {COMMAND_CENTER_UX.graphIncidentCorrelationTitle}
            </h3>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-slate-400">
              {incidentCorrelationEdges.length === 0 ?
                <li>{COMMAND_CENTER_UX.graphIncidentCorrelationEmpty}</li>
              : incidentCorrelationEdges.map((e) => {
                  const src =
                    categoryByNodeId.get(e.sourceNodeId) ?? e.sourceNodeId;
                  const tgt =
                    categoryByNodeId.get(e.targetNodeId) ?? e.targetNodeId;
                  return (
                    <li key={e.id}>
                      {humanizeToken(String(src))} →{" "}
                      {humanizeToken(String(tgt))}{" "}
                      <span className="font-mono text-[10px] text-slate-600">
                        {humanizeToken(e.edgeCategory)}
                      </span>
                    </li>
                  );
                })
              }
            </ul>
          </div>

          {escalationHints.length > 0 ?
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                {COMMAND_CENTER_UX.graphEscalationRouteHintsTitle}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {escalationHints.map((e) => {
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
                      key={e.id}
                      href={href}
                      className="rounded-lg border border-teal-400/25 bg-teal-500/10 px-2 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/15"
                    >
                      {humanizeToken(e.edgeCategory)}
                    </Link>
                  );
                })}
              </div>
            </div>
          : null}
        </div>
      </div>

      <p className="mt-5 text-[11px] text-slate-500">
        {COMMAND_CENTER_UX.graphDeepDiveHint}{" "}
        <Link
          href="#operational-tactical-continuity-strip"
          className="text-teal-200 underline-offset-2 hover:underline"
        >
          {COMMAND_CENTER_UX.graphDeepDiveLinkLabel}
        </Link>
      </p>
    </section>
  );
}
