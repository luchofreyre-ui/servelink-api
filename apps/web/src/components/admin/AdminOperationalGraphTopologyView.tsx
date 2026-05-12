"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function stableUint(seed: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function hslForCategory(category: string): string {
  const h = stableUint(category, 17) % 360;
  const s = 42 + (stableUint(category, 91) % 25);
  const l = 52 + (stableUint(category, 53) % 12);
  return `hsl(${h} ${s}% ${l}%)`;
}

export type AdminOperationalGraphTopologyViewProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
  coordinatedSelectedNodeId?: string | null;
  onCoordinatedSelectedNodeIdChange?: (id: string | null) => void;
};

type EdgeFilterMode = "all" | "escalation" | "workflow" | "intervention";
type LayoutMode = "circular" | "cluster";

export function AdminOperationalGraphTopologyView(
  props: AdminOperationalGraphTopologyViewProps,
) {
  const graph = props.dashboard?.persistedOperationalEntityGraph;
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const [edgeFilter, setEdgeFilter] = useState<EdgeFilterMode>("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("circular");
  const [emphasizeEscalationRoutes, setEmphasizeEscalationRoutes] =
    useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null,
  );
  const selectedId =
    props.coordinatedSelectedNodeId !== undefined ?
      props.coordinatedSelectedNodeId
    : internalSelectedId;

  const setSelectedId = useCallback(
    (next: string | null) => {
      props.onCoordinatedSelectedNodeIdChange?.(next);
      if (props.coordinatedSelectedNodeId === undefined) {
        setInternalSelectedId(next);
      }
    },
    [
      props.coordinatedSelectedNodeId,
      props.onCoordinatedSelectedNodeIdChange,
    ],
  );

  const positions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    if (layoutMode === "circular") {
      nodes.forEach((n, i) => {
        const u = stableUint(n.id, 41);
        const angle = ((u % 360) / 360) * Math.PI * 2 + i * 0.0007;
        const radius = 118 + (stableUint(n.entityCategory, 3) % 48);
        m.set(n.id, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      });
      return m;
    }

    const categories = [...new Set(nodes.map((n) => n.entityCategory))].sort(
      (a, b) => a.localeCompare(b),
    );
    const sweep =
      categories.length > 0 ? (2 * Math.PI) / categories.length : 2 * Math.PI;

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci]!;
      const mid = ci * sweep + sweep / 2 - Math.PI / 2;
      const inCat = nodes.filter((n) => n.entityCategory === cat);
      inCat.sort((a, b) => a.id.localeCompare(b.id));
      const innerSweep =
        inCat.length > 1 ? Math.min(sweep * 0.82, (Math.PI * 5) / 6) : 0;
      inCat.forEach((n, j) => {
        const t =
          inCat.length === 1 ? 0
          : (j / (inCat.length - 1 || 1)) * innerSweep - innerSweep / 2;
        const angle = mid + t;
        const radius = 92 + (stableUint(n.id, 71) % 56);
        m.set(n.id, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      });
    }
    return m;
  }, [nodes, layoutMode]);

  const filteredEdges = useMemo(() => {
    const base =
      edgeFilter === "all" ? edges
      : edges.filter((e) => {
          const c = e.edgeCategory.toLowerCase();
          if (edgeFilter === "escalation") return c.includes("escalat");
          if (edgeFilter === "workflow") return c.includes("workflow");
          return (
            c.includes("interven") ||
            c.includes("validity") ||
            c.includes("cohort")
          );
        });
    return base.slice(0, 170);
  }, [edges, edgeFilter]);

  const neighborhoodContext = useMemo(() => {
    if (!selectedId) return [];
    return edges.filter(
      (e) => e.sourceNodeId === selectedId || e.targetNodeId === selectedId,
    );
  }, [edges, selectedId]);

  const legendCategories = useMemo(() => {
    const s = new Set<string>();
    for (const n of nodes) s.add(n.entityCategory);
    return [...s].slice(0, 14);
  }, [nodes]);

  const cx = 280;
  const cy = 240;

  if (props.loading) {
    return (
      <section
        id="operational-graph-topology-view"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.graphTopologyTitle}
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
        id="operational-graph-topology-view"
        aria-label={COMMAND_CENTER_UX.graphTopologyTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (nodes.length === 0) {
    return (
      <section
        id="operational-graph-topology-view"
        aria-label={COMMAND_CENTER_UX.graphTopologyTitle}
        className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.graphRelationshipRailEmpty}
        </p>
      </section>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <section
      id="operational-graph-topology-view"
      aria-label={COMMAND_CENTER_UX.graphTopologyTitle}
      className="motion-safe:transition-shadow motion-safe:duration-300 rounded-2xl border border-violet-400/18 bg-violet-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
          {COMMAND_CENTER_UX.graphTopologyTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.graphTopologySubtitle}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.graphTopologyGovernanceNote}
      </p>

      <div className="mt-4 flex flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[11px] text-slate-500">
              {COMMAND_CENTER_UX.graphTopologyEdgeFilterLabel}
              <select
                value={edgeFilter}
                onChange={(e) =>
                  setEdgeFilter(e.target.value as EdgeFilterMode)
                }
                className="ml-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-100"
              >
                <option value="all">{COMMAND_CENTER_UX.graphTopologyFilterAll}</option>
                <option value="escalation">
                  {COMMAND_CENTER_UX.graphTopologyFilterEscalation}
                </option>
                <option value="workflow">
                  {COMMAND_CENTER_UX.graphTopologyFilterWorkflow}
                </option>
                <option value="intervention">
                  {COMMAND_CENTER_UX.graphTopologyFilterIntervention}
                </option>
              </select>
            </label>
            <label className="text-[11px] text-slate-500">
              {COMMAND_CENTER_UX.graphTopologyLayoutLabel}
              <select
                value={layoutMode}
                onChange={(e) =>
                  setLayoutMode(e.target.value as LayoutMode)
                }
                className="ml-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-100"
              >
                <option value="circular">
                  {COMMAND_CENTER_UX.graphTopologyLayoutCircular}
                </option>
                <option value="cluster">
                  {COMMAND_CENTER_UX.graphTopologyLayoutCluster}
                </option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
              <input
                type="checkbox"
                checked={emphasizeEscalationRoutes}
                onChange={(e) =>
                  setEmphasizeEscalationRoutes(e.target.checked)
                }
                className="rounded border-white/20 bg-slate-950"
              />
              {COMMAND_CENTER_UX.graphTopologyEscalationEmphasisToggle}
            </label>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
            <svg
              viewBox="0 0 560 480"
              className="h-auto w-full max-h-[420px]"
              role="img"
              aria-label={COMMAND_CENTER_UX.graphTopologySvgAria}
            >
              <defs>
                <linearGradient
                  id="graphBackdropGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgb(15 23 42)" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="rgb(2 6 23)" stopOpacity="0.96" />
                </linearGradient>
              </defs>
              <rect
                width="560"
                height="480"
                fill="url(#graphBackdropGradient)"
                rx="12"
              />
              <g transform={`translate(${cx},${cy})`}>
                {filteredEdges.map((e) => {
                  const p1 = positions.get(e.sourceNodeId);
                  const p2 = positions.get(e.targetNodeId);
                  if (!p1 || !p2) return null;
                  const catLow = e.edgeCategory.toLowerCase();
                  const isEsc = catLow.includes("escalat");
                  const emphasized =
                    selectedId === e.sourceNodeId ||
                    selectedId === e.targetNodeId;
                  let strokeWidth = 1.25;
                  let stroke = "rgba(148,163,184,0.22)";
                  if (emphasized) {
                    strokeWidth = 2.4;
                    stroke = "rgba(167,139,250,0.55)";
                  }
                  if (emphasizeEscalationRoutes && isEsc) {
                    strokeWidth = Math.max(strokeWidth, 2.8);
                    stroke = emphasized ?
                        "rgba(253,224,71,0.72)"
                      : "rgba(251,191,36,0.42)";
                  }
                  return (
                    <line
                      key={e.id}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      className="motion-safe:transition-[stroke,stroke-width] motion-safe:duration-300"
                    />
                  );
                })}
                {nodes.map((n) => {
                  const p = positions.get(n.id);
                  if (!p) return null;
                  const fill = hslForCategory(n.entityCategory);
                  const r =
                    selectedId === n.id ? 7 : 5 + (stableUint(n.id, 2) % 2);
                  const stroke =
                    selectedId === n.id ? "white" : "rgba(15,23,42,0.85)";
                  return (
                    <g key={n.id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r + 6}
                        fill="transparent"
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`Select node ${n.entityCategory}`}
                        onClick={() => setSelectedId(n.id)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setSelectedId(n.id);
                          }
                        }}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={selectedId === n.id ? 2 : 1}
                        pointerEvents="none"
                        className="motion-safe:transition-[r,stroke-width] motion-safe:duration-200"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
            <p className="mt-2 text-[10px] text-slate-500">
              {COMMAND_CENTER_UX.graphTopologyLayoutNotePhaseE}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.graphTopologyLegendHeading}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {legendCategories.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-white/10 px-2 py-0.5 motion-safe:transition-colors motion-safe:duration-200"
                  style={{
                    borderColor: `${hslForCategory(c)}`,
                    color: hslForCategory(c),
                  }}
                >
                  {c.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.graphTopologySelectionHeading}
            </p>
            {!selectedNode ?
              <p className="mt-2 text-xs text-slate-500">
                {COMMAND_CENTER_UX.graphExplorerSelectPrompt}
              </p>
            : <>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {selectedNode.entityCategory.replace(/_/g, " ")}
                </p>
                <p className="font-mono text-[10px] text-slate-600">
                  {selectedNode.id}
                </p>
              </>
            }

            {selectedNode && neighborhoodContext.length > 0 ?
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {COMMAND_CENTER_UX.graphTopologyEdgeContextHeading}
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-slate-400">
                  {neighborhoodContext.slice(0, 36).map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md bg-black/20 px-2 py-1 text-left"
                    >
                      <span className="text-violet-200/90">
                        {e.edgeCategory.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-600">
                        {" "}
                        {e.sourceNodeId === selectedNode.id ? "→" : "←"}{" "}
                      </span>
                      <span className="text-slate-500">
                        {e.sourceNodeId === selectedNode.id ?
                          e.targetNodeId.slice(0, 10)
                        : e.sourceNodeId.slice(0, 10)}
                        …
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            : null}

            <p className="mt-4 text-[11px] text-slate-500">
              <Link
                href="#operational-graph-native-explorer"
                className="text-violet-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.graphTopologyExplorerJump}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
