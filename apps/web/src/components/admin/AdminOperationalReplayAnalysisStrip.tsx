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

function narrativeLinesFromInterpretation(
  interpretationPayload: unknown,
): string[] {
  if (!interpretationPayload || typeof interpretationPayload !== "object") {
    return [];
  }
  const raw = (interpretationPayload as Record<string, unknown>)
    .narrativeLines;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function payloadRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as Record<string, unknown>;
}

function driftLinesFromSemanticAlignment(
  semanticPayload: unknown,
): string[] {
  const rec = payloadRecord(semanticPayload);
  const raw = rec?.driftInterpretationLines;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function topologyComparisonSummaryBlock(
  diffPayload: unknown,
): Record<string, unknown> | null {
  const rec = payloadRecord(diffPayload);
  const raw = rec?.topologyComparisonSummary;
  return raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) ?
    (raw as Record<string, unknown>)
  : null;
}

function multisetNonZeroCount(semanticPayload: unknown): number {
  const rec = payloadRecord(semanticPayload);
  const rows = rec?.chronologyCategoryMultisetRows;
  if (!Array.isArray(rows)) return 0;
  let n = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const dlt = (row as Record<string, unknown>).multisetDelta;
    if (typeof dlt === "number" && dlt !== 0) n += 1;
  }
  return n;
}

export type AdminOperationalReplayAnalysisStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalReplayAnalysisStrip(
  props: AdminOperationalReplayAnalysisStripProps,
) {
  const analysis = props.dashboard?.persistedOperationalReplayAnalysis;
  const diffs = analysis?.diffs ?? [];

  if (props.loading) {
    return (
      <section
        id="operational-replay-analysis-strip"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.replayAnalysisTitle}
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
        id="operational-replay-analysis-strip"
        aria-label={COMMAND_CENTER_UX.replayAnalysisTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (diffs.length === 0) {
    return (
      <section
        id="operational-replay-analysis-strip"
        aria-label={COMMAND_CENTER_UX.replayAnalysisTitle}
        className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-950/15 p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
          {COMMAND_CENTER_UX.replayAnalysisTitle}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {COMMAND_CENTER_UX.replayAnalysisEmpty}
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-replay-analysis-strip"
      aria-label={COMMAND_CENTER_UX.replayAnalysisTitle}
      className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-950/15 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
            {COMMAND_CENTER_UX.replayAnalysisTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            {COMMAND_CENTER_UX.replayAnalysisSubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          Latest diff{" "}
          <span className="font-medium text-slate-300">
            {fmtWhen(analysis?.refreshedAt ?? null)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.replayAnalysisGovernanceNote}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        Cross-reference{" "}
        <Link
          href="#operational-replay-intelligence-suite-strip"
          className="text-fuchsia-200 underline-offset-2 hover:underline"
        >
          replay intelligence rails
        </Link>
        ,{" "}
        <Link
          href="#operational-replay-timeline-strip"
          className="text-fuchsia-200 underline-offset-2 hover:underline"
        >
          replay timeline archives
        </Link>
        .
      </p>

      <ul className="mt-4 space-y-4">
        {diffs.map((d) => {
          const nodeDelta = payloadField(d.payloadJson, "nodeCountDelta");
          const edgeDelta = payloadField(d.payloadJson, "edgeCountDelta");
          const chSlots = payloadField(
            d.payloadJson,
            "chronologySlotsWithCategoryChange",
          );
          const narrativeLines =
            d.interpretation ?
              narrativeLinesFromInterpretation(d.interpretation.payloadJson)
            : [];

          const chronPayload =
            d.chronologyDeltas[0]?.payloadJson ?? null;

          const semanticDriftLines =
            driftLinesFromSemanticAlignment(d.semanticAlignment?.payloadJson);
          const topoCompare = topologyComparisonSummaryBlock(d.payloadJson);
          const semPayload = d.semanticAlignment?.payloadJson;
          const semRec = payloadRecord(semPayload);
          const lcsMetric = semRec?.chronologySequenceLcsLength;
          const ratioMetric = semRec?.chronologySequenceSimilarityRatio;
          const multisetShift = multisetNonZeroCount(semPayload);
          const showSemanticMetricCards =
            semRec &&
            (typeof lcsMetric === "number" ||
              typeof ratioMetric === "number" ||
              multisetShift > 0);

          return (
            <li
              key={d.id}
              className="rounded-xl border border-white/10 bg-slate-900/45 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  {humanizeToken(d.diffCategory)}
                </h3>
                <span className="text-xs text-slate-500">
                  {fmtWhen(d.createdAt)}
                </span>
              </div>
              <p className="mt-2 font-mono text-[10px] text-slate-600">
                source session {d.sourceReplaySessionId.slice(0, 10)}… →
                comparison {d.comparisonReplaySessionId.slice(0, 10)}…
              </p>

              {d.pairingLineage ?
                <p className="mt-2 text-xs text-slate-400">
                  Pairing lineage{" "}
                  <span className="font-medium text-slate-200">
                    {humanizeToken(d.pairingLineage.pairingCategory)}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-slate-600">
                    ({d.pairingLineage.orderedOlderReplaySessionId.slice(0, 8)}
                    …→
                    {d.pairingLineage.orderedNewerReplaySessionId.slice(0, 8)}
                    …)
                  </span>
                </p>
              : null}

              <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Node count Δ</dt>
                  <dd className="font-medium text-slate-200">
                    {nodeDelta ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Edge count Δ</dt>
                  <dd className="font-medium text-slate-200">
                    {edgeDelta ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Chronology slots changed</dt>
                  <dd className="font-medium text-slate-200">
                    {chSlots ?? "—"}
                  </dd>
                </div>
              </dl>

              {topoCompare ?
                <div className="mt-4 rounded-lg border border-white/5 bg-slate-950/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Replay topology comparison summary
                  </p>
                  <dl className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Incident cardinality Δ</dt>
                      <dd className="font-medium text-slate-200">
                        {payloadField(
                          topoCompare,
                          "incidentCardinalityDelta",
                        ) ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">
                        Orchestration posture nodes Δ
                      </dt>
                      <dd className="font-medium text-slate-200">
                        {payloadField(
                          topoCompare,
                          "postureOrchestrationDelta",
                        ) ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">
                        Approval / escalation surface nodes Δ
                      </dt>
                      <dd className="font-medium text-slate-200">
                        {payloadField(
                          topoCompare,
                          "postureApprovalEscalationDelta",
                        ) ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">
                        Intervention validity observation nodes Δ
                      </dt>
                      <dd className="font-medium text-slate-200">
                        {payloadField(
                          topoCompare,
                          "postureInterventionValidityDelta",
                        ) ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              : null}

              {d.chronologyDeltas.length > 0 ? (
                <div className="mt-4 rounded-lg border border-white/5 bg-slate-950/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.replayAnalysisChronologyHeading}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-600">
                    {humanizeToken(d.chronologyDeltas[0]?.deltaCategory ?? "")}
                  </p>
                  <p className="mt-2 max-h-24 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-500">
                    {typeof chronPayload === "object" &&
                    chronPayload !== null ?
                      JSON.stringify(chronPayload).slice(0, 480)
                    : "—"}
                    {typeof chronPayload === "object" &&
                    chronPayload !== null &&
                    JSON.stringify(chronPayload).length > 480 ?
                      "…"
                    : ""}
                  </p>
                </div>
              ) : null}

              {showSemanticMetricCards ?
                <div className="mt-4 rounded-lg border border-fuchsia-500/15 bg-fuchsia-950/15 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200/90">
                    {COMMAND_CENTER_UX.replayAnalysisSemanticCardsHeading}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Multiset deltas, LCS length, and similarity ratio are disclosed computation artifacts — not causal claims.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        LCS length
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {typeof lcsMetric === "number" ? lcsMetric : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        Sequence similarity ratio
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {typeof ratioMetric === "number" ?
                          ratioMetric.toFixed(4)
                        : "—"}
                      </p>
                      {typeof ratioMetric === "number" ?
                        <div
                          className="mt-2 h-2 rounded-full bg-white/10"
                          aria-hidden
                        >
                          <div
                            className="h-2 rounded-full bg-fuchsia-400/50"
                            style={{
                              width: `${Math.min(100, Math.round(ratioMetric * 100))}%`,
                            }}
                          />
                        </div>
                      : null}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        Multiset categories with Δ ≠ 0
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {multisetShift}
                      </p>
                    </div>
                  </div>
                </div>
              : null}

              {semanticDriftLines.length > 0 ? (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Semantic chronology alignment (deterministic)
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                    {semanticDriftLines.map((line, i) => (
                      <li key={`${d.id}-sem-${i}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {narrativeLines.length > 0 ? (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Deterministic interpretation
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                    {narrativeLines.map((line, i) => (
                      <li key={`${d.id}-nl-${i}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
