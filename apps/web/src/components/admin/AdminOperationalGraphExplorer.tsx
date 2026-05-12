"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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

function payloadField(
  payload: unknown,
  key: string,
): string | number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

export type AdminOperationalGraphExplorerProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
  coordinatedSelectedNodeId?: string | null;
  onCoordinatedSelectedNodeIdChange?: (id: string | null) => void;
};

export function AdminOperationalGraphExplorer(
  props: AdminOperationalGraphExplorerProps,
) {
  const graph = props.dashboard?.persistedOperationalEntityGraph;
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const chronology = graph?.chronologyFrames ?? [];

  const [filter, setFilter] = useState("");

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

  const filteredNodes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(q) ||
        n.entityCategory.toLowerCase().includes(q) ||
        (n.idempotencyKey?.toLowerCase().includes(q) ?? false),
    );
  }, [nodes, filter]);

  const categoryById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) m.set(n.id, n.entityCategory);
    return m;
  }, [nodes]);

  const neighborhood = useMemo(() => {
    if (!selectedId) return [];
    return edges.filter(
      (e) => e.sourceNodeId === selectedId || e.targetNodeId === selectedId,
    );
  }, [edges, selectedId]);

  const sortedChronology = useMemo(() => {
    return [...chronology].sort((a, b) => {
      const ia = payloadField(a.payloadJson, "sequenceIndex");
      const ib = payloadField(b.payloadJson, "sequenceIndex");
      const na = typeof ia === "number" ? ia : 0;
      const nb = typeof ib === "number" ? ib : 0;
      return na - nb;
    });
  }, [chronology]);

  if (props.loading) {
    return (
      <section
        id="operational-graph-native-explorer"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.graphExplorerTitle}
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
        id="operational-graph-native-explorer"
        aria-label={COMMAND_CENTER_UX.graphExplorerTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (nodes.length === 0) {
    return (
      <section
        id="operational-graph-native-explorer"
        aria-label={COMMAND_CENTER_UX.graphExplorerTitle}
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
      id="operational-graph-native-explorer"
      aria-label={COMMAND_CENTER_UX.graphExplorerTitle}
      className="rounded-2xl border border-indigo-400/18 bg-indigo-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/90">
          {COMMAND_CENTER_UX.graphExplorerTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.graphExplorerSubtitle}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.graphExplorerGovernanceNote}
      </p>

      <div className="mt-4 flex flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={COMMAND_CENTER_UX.graphExplorerSearchPlaceholder}
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.graphExplorerNodesHeading}
            </p>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 p-2 text-xs">
              {filteredNodes.length === 0 ?
                <li className="text-slate-500">
                  {COMMAND_CENTER_UX.graphExplorerEmptyNodes}
                </li>
              : filteredNodes.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(n.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left hover:bg-white/[0.06] ${
                        selectedId === n.id ?
                          "bg-indigo-500/15 text-indigo-50 ring-1 ring-indigo-400/25"
                        : "text-slate-300"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-500">
                        {n.id.slice(0, 10)}…
                      </span>
                      <span className="ml-2">
                        {humanizeToken(n.entityCategory)}
                      </span>
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.graphExplorerNeighborhoodHeading}
            </p>
            {!selectedNode ?
              <p className="mt-2 text-xs text-slate-500">
                {COMMAND_CENTER_UX.graphExplorerSelectPrompt}
              </p>
            : <>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {humanizeToken(selectedNode.entityCategory)}
                </p>
                <p className="font-mono text-[10px] text-slate-600">
                  {selectedNode.id}
                </p>
                <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto font-mono text-[11px] text-slate-400">
                  {neighborhood.length === 0 ?
                    <li>—</li>
                  : neighborhood.slice(0, 80).map((e) => {
                      const other =
                        e.sourceNodeId === selectedNode.id ?
                          e.targetNodeId
                        : e.sourceNodeId;
                      const oc =
                        categoryById.get(other) ?? other.slice(0, 8);
                      const dir =
                        e.sourceNodeId === selectedNode.id ? "→" : "←";
                      return (
                        <li key={e.id}>
                          {dir}{" "}
                          <span className="text-slate-300">
                            {humanizeToken(oc)}
                          </span>{" "}
                          <span className="text-slate-600">
                            ({humanizeToken(e.edgeCategory)})
                          </span>
                        </li>
                      );
                    })
                  }
                </ul>
              </>
            }
            <p className="mt-4 text-[11px] text-slate-500">
              <Link
                href="#operational-replay-intelligence-suite-strip"
                className="text-indigo-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.graphReplayJumpLabel}
              </Link>
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.graphExplorerChronologyHeading}
            </p>
            <ol className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-400">
              {sortedChronology.map((f, i) => (
                <li key={`${f.chronologyCategory}-${i}`}>
                  <span className="font-mono text-[10px] text-slate-600">
                    {String(payloadField(f.payloadJson, "sequenceIndex") ?? i)}
                  </span>{" "}
                  {humanizeToken(f.chronologyCategory)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
