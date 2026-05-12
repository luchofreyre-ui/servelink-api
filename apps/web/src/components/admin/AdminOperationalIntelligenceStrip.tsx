"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminOperationalIntelligenceDashboard,
  postOperationalAnalyticsRefreshSnapshots,
  type AdminOperationalIntelligenceDashboard,
} from "@/lib/api/operationalIntelligence";
import { ORCHESTRATION_UX } from "@/lib/operational/orchestrationVocabulary";
import { getStoredAccessToken } from "@/lib/auth";

function fmtPct(num: number): string {
  if (!Number.isFinite(num)) return "—";
  return `${(num * 100).toFixed(1)}%`;
}

function payloadField(
  payloadJson: unknown,
  key: string,
): string | number | null {
  if (!payloadJson || typeof payloadJson !== "object") return null;
  const v = (payloadJson as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

export type AdminOperationalIntelligenceStripProps = {
  /** Command center coordinates one dashboard fetch when reload handler is provided. */
  coordinatedDashboard?: AdminOperationalIntelligenceDashboard | null;
  coordinatedLoading?: boolean;
  coordinatedError?: string | null;
  onCoordinatedReload?: () => Promise<void>;
};

/**
 * Admin operational intelligence — live deterministic metrics + latest persisted warehouse batch.
 */
export function AdminOperationalIntelligenceStrip(
  props: AdminOperationalIntelligenceStripProps = {},
) {
  const coordinated = typeof props.onCoordinatedReload === "function";

  const [internalDash, setInternalDash] =
    useState<AdminOperationalIntelligenceDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coordinatedRefreshError, setCoordinatedRefreshError] = useState<
    string | null
  >(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (coordinated) return;
    if (!getStoredAccessToken()?.trim()) {
      setInternalDash(null);
      return;
    }
    try {
      const d = await fetchAdminOperationalIntelligenceDashboard();
      setInternalDash(d);
      setError(null);
    } catch {
      setInternalDash(null);
      setError("Operational intelligence unavailable.");
    }
  }, [coordinated]);

  useEffect(() => {
    if (coordinated) return;
    void load();
  }, [load, coordinated]);

  async function onRefreshWarehouse() {
    setBusy(true);
    try {
      setCoordinatedRefreshError(null);
      await postOperationalAnalyticsRefreshSnapshots();
      if (coordinated) {
        await props.onCoordinatedReload?.();
      } else {
        await load();
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Snapshot refresh failed.";
      if (coordinated) {
        setCoordinatedRefreshError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  const effectiveDash = coordinated ?
      props.coordinatedDashboard ?? null
    : internalDash;
  const effectiveError = coordinated ?
      props.coordinatedError ?? null
    : error;
  const coordinatedLoading =
    coordinated && props.coordinatedLoading && !effectiveDash;

  if (effectiveError && !effectiveDash) {
    return (
      <section
        aria-label="Operational intelligence"
        className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
      >
        {effectiveError}
      </section>
    );
  }

  if (coordinatedLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Operational intelligence"
        className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-xs text-slate-400"
      >
        Loading operational intelligence substrate…
      </section>
    );
  }

  if (!effectiveDash) return null;

  const dash = effectiveDash;
  const { live, persisted } = dash;
  const os = live.portfolio.orchestrationSafety;
  const del = live.delivery24h;
  const delRate = del.attempts > 0 ? del.successes / del.attempts : null;
  const hints = dash.deterministicIntelligenceHints ?? [];
  const drift = dash.persistedVsLiveDrift ?? [];
  const candidates = dash.safeOrchestrationActivationCandidates ?? [];
  const persistedBalancing = dash.persistedBalancing ?? {
    refreshedAt: null,
    aggregateWindow: dash.persisted.aggregateWindow,
    balancingSnapshots: [],
    congestionSnapshots: [],
  };
  const prioritizationSignals = dash.deterministicPrioritizationSignals ?? [];
  const closedLoop = dash.persistedClosedLoopOperationalIntelligence ?? {
    refreshedAt: null,
    aggregateWindow: dash.persisted.aggregateWindow,
    workflowOutcomeSamples: [],
    simulationAccuracySnapshots: [],
    operationalDriftSnapshots: [],
  };
  const experimentation = dash.persistedOperationalExperimentation ?? {
    refreshedAt: null,
    aggregateWindow: dash.persisted.aggregateWindow,
    experimentSnapshots: [],
    benchmarkScenarios: [],
  };
  const simulationLab = dash.persistedOperationalSimulationLab ?? {
    refreshedAt: null,
    aggregateWindow: dash.persisted.aggregateWindow,
    labRuns: [],
    certifications: [],
    causalSnapshots: [],
  };
  const longitudinalIntel = dash.persistedLongitudinalOperationalIntelligence ?? {
    refreshedAt: null,
    aggregateWindow: dash.persisted.aggregateWindow,
    experimentLineage: [],
    counterfactualSnapshots: [],
    replayAlignments: [],
  };
  const operationalScience =
    dash.persistedOperationalScience ?? {
      refreshedAt: null,
      aggregateWindow: dash.persisted.aggregateWindow,
      cohortSnapshots: [],
      interventionSandboxes: [],
      interventionEvaluations: [],
    };
  const operationalValidity =
    dash.persistedOperationalInterventionValidity ?? {
      refreshedAt: null,
      aggregateWindow: dash.persisted.aggregateWindow,
      interventionAssignments: [],
      controlCohortSnapshots: [],
      validityCertifications: [],
    };

  return (
    <section
      id="operational-intelligence-coordinated-strip"
      aria-label="Operational intelligence"
      className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 text-slate-200"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {ORCHESTRATION_UX.operationalIntelligenceStripTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {ORCHESTRATION_UX.operationalIntelligenceStripSubtitle}
          </p>
          <p className="mt-2 text-[10px] text-slate-500">
            Analytics engine {dash.analyticsEngineVersion} · Governance doc{" "}
            {dash.analyticsGovernanceVersion}
            {dash.policyEngineAlignment.aligned ? (
              <span className="text-emerald-400/90"> · Policy versions aligned</span>
            ) : (
              <span className="text-amber-200/90"> · Policy version mismatch — review analytics refs</span>
            )}
          </p>
          <p className="mt-2 text-[10px] text-slate-500">
            {ORCHESTRATION_UX.operationalLoadBalancingStripSubtitle}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          title="Recomputes analytics warehouse rows — explicit human-triggered refresh only."
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/[0.14] disabled:opacity-40"
          onClick={() => void onRefreshWarehouse()}
        >
          {busy ? "Refreshing…" : "Refresh warehouse snapshots"}
        </button>
      </div>

      {coordinatedRefreshError ? (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
          {coordinatedRefreshError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-semibold text-slate-300">Delivery reliability (24h)</p>
          <p className="mt-2 text-slate-400">
            Attempts <span className="font-mono text-slate-200">{del.attempts}</span>
          </p>
          <p className="text-slate-400">
            Successes <span className="font-mono text-slate-200">{del.successes}</span>
          </p>
          <p className="mt-1 text-slate-500">
            Success ratio (attempts denom.){" "}
            <span className="font-mono text-slate-200">
              {delRate == null ? "—" : fmtPct(delRate)}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-semibold text-slate-300">Governance & escalation</p>
          <p className="mt-2 text-slate-400">
            Steps governance-blocked (7d){" "}
            <span className="font-mono text-slate-200">
              {live.governanceStepsBlocked7d}
            </span>
          </p>
          <p className="text-slate-400">
            Open escalations / pending approvals (approx.){" "}
            <span className="font-mono text-slate-200">
              {live.escalationDensity.open} /{" "}
              {live.portfolio.pendingApprovals}
            </span>
          </p>
          <p className="mt-2 border-t border-white/10 pt-2 font-semibold text-slate-300">
            Orchestration safety pressure (24h mirrors)
          </p>
          <p className="mt-1 text-slate-400">
            Registered / approved-for-invoke / failed activations{" "}
            <span className="font-mono text-slate-200">
              {os.activationsRegistered} / {os.activationsApprovedForInvoke} /{" "}
              {os.activationsFailed}
            </span>
          </p>
          <p className="text-slate-400">
            Dry-runs failed / safety attention evals / simulations completed{" "}
            <span className="font-mono text-slate-200">
              {os.dryRunsFailedLast24h} / {os.safetyEvaluationsAttentionLast24h} /{" "}
              {os.simulationsCompletedLast24h}
            </span>
          </p>
          {os.deliveryAttemptsLast24h != null &&
          os.deliverySuccessesLast24h != null ? (
            <p className="text-slate-400">
              Delivery attempts / successes (portfolio rollup){" "}
              <span className="font-mono text-slate-200">
                {os.deliveryAttemptsLast24h} / {os.deliverySuccessesLast24h}
              </span>
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-semibold text-slate-300">Lifecycle signals</p>
          <p className="mt-2 text-slate-400">
            Payment-attention bookings{" "}
            <span className="font-mono text-slate-200">
              {live.paymentAttentionBookings}
            </span>
          </p>
          <p className="text-slate-400">
            Bookings with recurring plan{" "}
            <span className="font-mono text-slate-200">
              {live.bookingsWithRecurringPlan}
            </span>
          </p>
        </div>
      </div>

      {prioritizationSignals.length > 0 ? (
        <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-500/5 p-3 text-xs">
          <p className="font-semibold text-slate-200">
            {ORCHESTRATION_UX.prioritizationSignalsCardTitle}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {ORCHESTRATION_UX.prioritizationSignalsCardSubtitle}
          </p>
          <ul className="mt-3 space-y-2">
            {prioritizationSignals.map((s) => (
              <li
                key={s.id}
                className={`rounded-lg border px-3 py-2 leading-5 ${
                  s.severity === "attention"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-50"
                    : "border-white/10 bg-black/25 text-slate-300"
                }`}
              >
                <span className="font-semibold">{s.title}</span>
                <span className="mt-1 block font-mono text-[10px] text-slate-400">
                  sortKey {s.sortKey}
                </span>
                <span className="mt-1 block text-[11px] opacity-90">{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(persistedBalancing.balancingSnapshots.length > 0 ||
        persistedBalancing.congestionSnapshots.length > 0) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
            <p className="font-semibold text-slate-300">
              {ORCHESTRATION_UX.persistedBalancingCardTitle}
            </p>
            <p className="mt-1 font-mono text-[10px] text-slate-500">
              {persistedBalancing.refreshedAt ?? "never — refresh warehouse"}
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {persistedBalancing.balancingSnapshots.map((row) => (
                <li key={row.balancingCategory}>
                  {row.balancingCategory} · {row.severity}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
            <p className="font-semibold text-slate-300">
              {ORCHESTRATION_UX.workflowCongestionCardTitle}
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {persistedBalancing.congestionSnapshots.length === 0 ? (
                <li className="text-slate-500">No backlog rows persisted.</li>
              ) : (
                persistedBalancing.congestionSnapshots.map((row) => (
                  <li key={`${row.workflowType}:${row.congestionCategory}`}>
                    {row.workflowType} · {row.severity}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.closedLoopOperationalIntelligenceCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.closedLoopOperationalIntelligenceCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{closedLoop.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{closedLoop.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Activation outcome samples</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {closedLoop.workflowOutcomeSamples.length === 0 ? (
                <li className="text-slate-500">No rows yet — refresh warehouse.</li>
              ) : (
                closedLoop.workflowOutcomeSamples.slice(0, 12).map((row) => (
                  <li key={`${row.workflowExecutionId}:${row.activationId ?? "na"}`}>
                    score {row.effectivenessScore} · {row.evaluationResult.slice(0, 28)}
                    …
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Simulation accuracy mirrors</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {closedLoop.simulationAccuracySnapshots.length === 0 ? (
                <li className="text-slate-500">No rows yet — refresh warehouse.</li>
              ) : (
                closedLoop.simulationAccuracySnapshots.slice(0, 10).map((row) => (
                  <li key={row.simulationScenarioId}>
                    align{" "}
                    <span className="text-slate-200">
                      {String(payloadField(row.payloadJson, "alignment") ?? "—")}
                    </span>{" "}
                    · wf {row.workflowExecutionId.slice(0, 8)}…
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Warehouse refresh drift</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {closedLoop.operationalDriftSnapshots.length === 0 ? (
                <li className="text-slate-500">
                  No consecutive deltas yet (first refresh baselines the next comparison).
                </li>
              ) : (
                closedLoop.operationalDriftSnapshots.slice(0, 12).map((row, i) => (
                  <li key={`${String(payloadField(row.payloadJson, "metricKey"))}:${i}`}>
                    {String(payloadField(row.payloadJson, "metricKey") ?? row.driftCategory)} · Δ{" "}
                    {String(payloadField(row.payloadJson, "delta") ?? "—")} · {row.severity}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-teal-400/20 bg-teal-500/5 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.operationalExperimentationCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.operationalExperimentationCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{experimentation.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{experimentation.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Experiment snapshots</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {experimentation.experimentSnapshots.length === 0 ? (
                <li className="text-slate-500">No experiment rows yet — refresh warehouse.</li>
              ) : (
                experimentation.experimentSnapshots.map((row) => (
                  <li key={row.experimentCategory}>
                    {row.experimentCategory} · {row.evaluationResult}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Benchmark anchors (simulation)</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {experimentation.benchmarkScenarios.length === 0 ? (
                <li className="text-slate-500">
                  No benchmark rows yet — requires simulation accuracy batch from refresh.
                </li>
              ) : (
                experimentation.benchmarkScenarios.slice(0, 14).map((row) => (
                  <li key={`${row.simulationScenarioId ?? "na"}:${row.workflowExecutionId}`}>
                    align{" "}
                    <span className="text-slate-200">
                      {String(payloadField(row.resultJson, "alignment") ?? "—")}
                    </span>{" "}
                    · {row.benchmarkState}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.operationalSimulationLabCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.operationalSimulationLabCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{simulationLab.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{simulationLab.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Lab runs (benchmark frames)</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {simulationLab.labRuns.length === 0 ? (
                <li className="text-slate-500">No lab frames yet — refresh after benchmarks exist.</li>
              ) : (
                simulationLab.labRuns.slice(0, 12).map((row, i) => (
                  <li key={`${row.benchmarkScenarioId ?? i}`}>
                    {row.simulationCategory} · {row.simulationState}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Experiment certifications</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {simulationLab.certifications.length === 0 ? (
                <li className="text-slate-500">No certification rows yet.</li>
              ) : (
                simulationLab.certifications.map((row) => (
                  <li key={row.experimentCategory}>
                    {row.experimentCategory} · {row.certificationState}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Associative attribution</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {simulationLab.causalSnapshots.length === 0 ? (
                <li className="text-slate-500">No attribution rows yet.</li>
              ) : (
                simulationLab.causalSnapshots.map((row, i) => (
                  <li key={`${row.attributionCategory}:${row.attributionResult}:${i}`}>
                    {row.attributionCategory}
                    <span className="block text-slate-500">→ {row.attributionResult}</span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              Labels describe batch-local co-occurrence gates — not causal inference.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-950/40 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.longitudinalOperationalIntelligenceCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.longitudinalOperationalIntelligenceCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{longitudinalIntel.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{longitudinalIntel.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Experiment lineage</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {longitudinalIntel.experimentLineage.length === 0 ? (
                <li className="text-slate-500">
                  No lineage pairs yet — requires two consecutive warehouse refreshes with experiments.
                </li>
              ) : (
                longitudinalIntel.experimentLineage.slice(0, 14).map((row, i) => (
                  <li key={`${row.lineageCategory}:${i}`}>
                    {row.lineageCategory}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Counterfactual-safe scaffold</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {longitudinalIntel.counterfactualSnapshots.length === 0 ? (
                <li className="text-slate-500">No scaffold rows yet.</li>
              ) : (
                longitudinalIntel.counterfactualSnapshots.map((row, i) => (
                  <li key={`${row.evaluationCategory}:${i}`}>
                    {row.evaluationCategory}
                    <span className="block truncate text-slate-500" title={row.comparisonWindow}>
                      {row.comparisonWindow.slice(0, 48)}
                      {row.comparisonWindow.length > 48 ? "…" : ""}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Replay alignment</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {longitudinalIntel.replayAlignments.length === 0 ? (
                <li className="text-slate-500">No replay alignment rows yet.</li>
              ) : (
                longitudinalIntel.replayAlignments.map((row, i) => (
                  <li key={`${row.replayCategory}:${i}`}>
                    {row.replayCategory} · {row.replayState}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-950/35 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.operationalScienceCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.operationalScienceCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{operationalScience.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{operationalScience.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Cohort mirrors</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalScience.cohortSnapshots.length === 0 ? (
                <li className="text-slate-500">No cohort rows yet — refresh after outcomes/balancing/replay batches exist.</li>
              ) : (
                operationalScience.cohortSnapshots.map((row) => (
                  <li key={row.cohortCategory}>{row.cohortCategory}</li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Intervention sandbox frames</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalScience.interventionSandboxes.length === 0 ? (
                <li className="text-slate-500">No observation frames yet.</li>
              ) : (
                operationalScience.interventionSandboxes.slice(0, 14).map((row, i) => (
                  <li key={`${row.workflowExecutionId}:${row.activationId ?? i}`}>
                    {row.sandboxCategory} · {row.workflowExecutionId.slice(0, 8)}…
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              Observation-only rows — they never invoke workflows or customer operations.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Deterministic evaluations</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalScience.interventionEvaluations.length === 0 ? (
                <li className="text-slate-500">No evaluation labels yet.</li>
              ) : (
                operationalScience.interventionEvaluations.map((row) => (
                  <li key={row.evaluationCategory}>
                    {row.evaluationCategory}
                    <span className="block text-slate-500">→ {row.evaluationResult}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-fuchsia-400/20 bg-fuchsia-950/30 p-3 text-xs">
        <p className="font-semibold text-slate-200">
          {ORCHESTRATION_UX.operationalInterventionValidityCardTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {ORCHESTRATION_UX.operationalInterventionValidityCardSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Batch{" "}
          <span className="text-slate-400">{operationalValidity.refreshedAt ?? "none"}</span> · window{" "}
          <span className="text-slate-400">{operationalValidity.aggregateWindow}</span>
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Assignment labels</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalValidity.interventionAssignments.length === 0 ? (
                <li className="text-slate-500">No assignments yet — requires sandbox frames in the same refresh batch.</li>
              ) : (
                operationalValidity.interventionAssignments.slice(0, 14).map((row, i) => (
                  <li key={`${row.workflowExecutionId}:${row.activationId ?? i}`}>
                    {row.cohortType} · {row.workflowExecutionId.slice(0, 8)}…
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              Labels partition sandbox inventory — they do not invoke interventions.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Control / mirror inventories</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalValidity.controlCohortSnapshots.length === 0 ? (
                <li className="text-slate-500">No control cohort summaries yet.</li>
              ) : (
                operationalValidity.controlCohortSnapshots.map((row) => (
                  <li key={row.cohortCategory}>{row.cohortCategory}</li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
            <p className="font-semibold text-slate-300">Validity certifications</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[10px] text-slate-400">
              {operationalValidity.validityCertifications.length === 0 ? (
                <li className="text-slate-500">No certification rows yet.</li>
              ) : (
                operationalValidity.validityCertifications.map((row) => (
                  <li key={row.certificationCategory}>
                    {row.certificationCategory}
                    <span className="block text-slate-500">→ {row.certificationState}</span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              Balance checks are deterministic gates — not causal validity of interventions.
            </p>
          </div>
        </div>
      </div>

      {hints.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-semibold text-slate-300">Deterministic posture hints</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Rule-based signals only — not rankings or automated actions.
          </p>
          <ul className="mt-3 space-y-2">
            {hints.map((h) => (
              <li
                key={h.id}
                className={`rounded-lg border px-3 py-2 leading-5 ${
                  h.severity === "attention"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-50"
                    : "border-white/10 bg-white/[0.04] text-slate-300"
                }`}
              >
                <span className="font-semibold">{h.title}</span>
                <span className="mt-1 block text-[11px] opacity-90">{h.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drift.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
          <p className="font-semibold text-slate-300">Warehouse vs live drift</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Largest absolute deltas first — refresh warehouse when you need aligned snapshots.
          </p>
          <ul className="mt-2 max-h-32 overflow-auto font-mono text-[10px] text-slate-400">
            {drift.slice(0, 10).map((d) => (
              <li key={d.metricKey} className="py-0.5">
                {d.metricKey}: persisted {d.persistedValue} · live {d.liveValue} · Δ {d.delta}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs">
          <p className="font-semibold text-slate-200">Human-governed activation seams</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Copy-only routing hints — nothing below runs automatically from this UI.
          </p>
          <ul className="mt-3 space-y-3">
            {candidates.map((c) => (
              <li key={c.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <p className="font-semibold text-slate-200">{c.title}</p>
                <p className="mt-1 text-[11px] text-slate-400">{c.detail}</p>
                <ul className="mt-2 space-y-1 font-mono text-[10px] text-slate-500">
                  {c.suggestedAdminHints.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3 text-xs">
        <p className="font-semibold text-slate-300">Workflow posture (live by state)</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {Object.entries(live.workflowByState).map(([state, n]) => (
            <li
              key={state}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px]"
            >
              {state}: {typeof n === "number" ? n : String(n)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/40 p-3 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Persisted warehouse batch</p>
        <p className="mt-1">
          Window <span className="font-mono">{persisted.aggregateWindow}</span> · Last refresh{" "}
          <span className="font-mono">
            {persisted.refreshedAt ?? "never — use refresh button"}
          </span>
        </p>
        {persisted.snapshots.length > 0 ? (
          <ul className="mt-2 max-h-28 overflow-auto space-y-0.5 font-mono text-[10px] text-slate-500">
            {persisted.snapshots.slice(0, 12).map(
              (s: {
                metricCategory: string;
                metricKey: string;
                metricValue: number;
              }) => (
              <li key={`${s.metricCategory}:${s.metricKey}`}>
                {s.metricKey} = {s.metricValue}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-500">No snapshots persisted yet for this window.</p>
        )}
      </div>
    </section>
  );
}
