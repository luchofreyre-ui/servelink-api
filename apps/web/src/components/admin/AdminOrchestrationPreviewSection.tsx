"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRecommendationAcceptances,
  postOrchestrationDryRun,
  postRecommendationAcceptance,
  postRevokeRecommendationAcceptance,
  type WorkflowRecommendationAcceptanceRow,
} from "@/lib/api/adminOrchestrationPreview";
import {
  WORKFLOW_SIMULATION_SCENARIO_CATEGORY_WEB,
  fetchOperationalSafetyEvaluations,
  fetchOrchestrationSimulationScenarios,
  postOrchestrationSimulationRun,
  type OperationalSafetyEvaluationRow,
  type WorkflowSimulationScenarioRow,
} from "@/lib/api/adminOrchestrationSimulation";
import {
  fetchOrchestrationActivations,
  GUIDED_ACTIVATION_CATEGORY_BOOKING_TRANSITION,
  GUIDED_ACTIVATION_RECOMMENDATION_KEY_APPROVED_INVOKE,
  postOrchestrationActivationApprove,
  postOrchestrationActivationCancel,
  postOrchestrationActivationInvoke,
  postOrchestrationActivationRegister,
  type WorkflowExecutionActivationRow,
} from "@/lib/api/adminOrchestrationActivation";
import { WEB_ENV } from "@/lib/env";
import { ORCHESTRATION_UX } from "@/lib/operational/orchestrationVocabulary";
import { getAuthUser } from "@/lib/auth/authClient";
import { getStoredAccessToken } from "@/lib/auth";

type WorkflowExecutionLite = {
  id: string;
  workflowType: string;
  state: string;
};

type Props = {
  bookingId: string;
};

export function AdminOrchestrationPreviewSection({ bookingId }: Props) {
  const [executions, setExecutions] = useState<WorkflowExecutionLite[]>([]);
  const [execError, setExecError] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>("");
  const [recommendationKey, setRecommendationKey] = useState("");
  const [dryRunBusy, setDryRunBusy] = useState(false);
  const [dryRunError, setDryRunError] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<unknown>(null);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [acceptNote, setAcceptNote] = useState("");
  const [acceptances, setAcceptances] = useState<WorkflowRecommendationAcceptanceRow[]>(
    [],
  );
  const [workflowApprovalIdInput, setWorkflowApprovalIdInput] = useState("");
  const [activations, setActivations] = useState<WorkflowExecutionActivationRow[]>(
    [],
  );
  const [activationDryRunId, setActivationDryRunId] = useState("");
  const [activationRegisterAcceptanceId, setActivationRegisterAcceptanceId] =
    useState("");
  const [activationBusy, setActivationBusy] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simLatest, setSimLatest] = useState<unknown>(null);
  const [simScenarios, setSimScenarios] = useState<WorkflowSimulationScenarioRow[]>(
    [],
  );
  const [simEvaluations, setSimEvaluations] = useState<
    OperationalSafetyEvaluationRow[]
  >([]);
  const [simActivationFocusId, setSimActivationFocusId] = useState("");

  const authUserId = getAuthUser()?.id?.trim() ?? "";

  const loadExecutions = useCallback(async () => {
    if (!getStoredAccessToken()?.trim()) {
      setExecutions([]);
      return;
    }
    const url = `${WEB_ENV.apiBaseUrl}/admin/workflow-executions?bookingId=${encodeURIComponent(bookingId)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getStoredAccessToken() ?? ""}`,
      },
      credentials: "include",
    });
    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      items?: WorkflowExecutionLite[];
    } | null;
    if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
      setExecError("Could not load workflow executions for preview.");
      setExecutions([]);
      return;
    }
    setExecError(null);
    const items = body.items;
    setExecutions(items);
    setSelectedExecutionId((prev) => prev || items[0]?.id || "");
  }, [bookingId]);

  const loadAcceptances = useCallback(async () => {
    const wfId = selectedExecutionId.trim();
    if (!wfId || !getStoredAccessToken()?.trim()) {
      setAcceptances([]);
      return;
    }
    try {
      const { items } = await fetchRecommendationAcceptances({
        workflowExecutionId: wfId,
      });
      setAcceptances(items);
    } catch {
      setAcceptances([]);
    }
  }, [selectedExecutionId]);

  const loadActivations = useCallback(async () => {
    const wfId = selectedExecutionId.trim();
    if (!wfId || !getStoredAccessToken()?.trim()) {
      setActivations([]);
      return;
    }
    try {
      const { items } = await fetchOrchestrationActivations({
        workflowExecutionId: wfId,
      });
      setActivations(items);
    } catch {
      setActivations([]);
    }
  }, [selectedExecutionId]);

  const loadSimulationArtifacts = useCallback(async () => {
    const wfId = selectedExecutionId.trim();
    if (!wfId || !getStoredAccessToken()?.trim()) {
      setSimScenarios([]);
      setSimEvaluations([]);
      return;
    }
    try {
      const [sc, ev] = await Promise.all([
        fetchOrchestrationSimulationScenarios({ workflowExecutionId: wfId }),
        fetchOperationalSafetyEvaluations({ workflowExecutionId: wfId }),
      ]);
      setSimScenarios(sc.items);
      setSimEvaluations(ev.items);
    } catch {
      setSimScenarios([]);
      setSimEvaluations([]);
    }
  }, [selectedExecutionId]);

  useEffect(() => {
    void loadExecutions();
  }, [loadExecutions]);

  useEffect(() => {
    void loadAcceptances();
  }, [loadAcceptances]);

  useEffect(() => {
    void loadActivations();
  }, [loadActivations]);

  useEffect(() => {
    void loadSimulationArtifacts();
  }, [loadSimulationArtifacts]);

  async function runDryRun() {
    const wfId = selectedExecutionId.trim();
    if (!wfId) {
      setDryRunError("Select a workflow execution.");
      return;
    }
    setDryRunBusy(true);
    setDryRunError(null);
    try {
      const out = await postOrchestrationDryRun({
        workflowExecutionId: wfId,
        recommendationKey: recommendationKey.trim() || null,
      });
      setDryRunResult(out.resultJson ?? null);
    } catch (e) {
      setDryRunResult(null);
      setDryRunError(e instanceof Error ? e.message : "Dry-run failed.");
    } finally {
      setDryRunBusy(false);
    }
  }

  async function runOrchestrationSafetySimulation() {
    const wfId = selectedExecutionId.trim();
    if (!wfId) {
      setSimError("Select a workflow execution.");
      return;
    }
    setSimBusy(true);
    setSimError(null);
    try {
      const out = await postOrchestrationSimulationRun({
        workflowExecutionId: wfId,
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY_WEB.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      });
      setSimLatest(out.resultJson ?? null);
      await loadSimulationArtifacts();
    } catch (e) {
      setSimLatest(null);
      setSimError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setSimBusy(false);
    }
  }

  async function runActivationFocusSimulation() {
    const wfId = selectedExecutionId.trim();
    const aid = simActivationFocusId.trim();
    if (!wfId) {
      setSimError("Select a workflow execution.");
      return;
    }
    if (!aid) {
      setSimError("Select or paste an activation id for activation-focus simulation.");
      return;
    }
    setSimBusy(true);
    setSimError(null);
    try {
      const out = await postOrchestrationSimulationRun({
        workflowExecutionId: wfId,
        scenarioCategory: WORKFLOW_SIMULATION_SCENARIO_CATEGORY_WEB.ACTIVATION_FOCUS_V1,
        activationId: aid,
      });
      setSimLatest(out.resultJson ?? null);
      await loadSimulationArtifacts();
    } catch (e) {
      setSimLatest(null);
      setSimError(e instanceof Error ? e.message : "Activation-focus simulation failed.");
    } finally {
      setSimBusy(false);
    }
  }

  async function recordAcceptance() {
    const wfId = selectedExecutionId.trim();
    const key = recommendationKey.trim();
    if (!wfId || !key) {
      setDryRunError("Enter a recommendation key to record acceptance.");
      return;
    }
    setAcceptBusy(true);
    setDryRunError(null);
    try {
      await postRecommendationAcceptance({
        workflowExecutionId: wfId,
        recommendationKey: key,
        workflowApprovalId: workflowApprovalIdInput.trim() || null,
        note: acceptNote.trim() || null,
      });
      setAcceptNote("");
      await loadAcceptances();
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Acceptance failed.");
    } finally {
      setAcceptBusy(false);
    }
  }

  async function registerGuidedActivation() {
    const wfId = selectedExecutionId.trim();
    const accId = activationRegisterAcceptanceId.trim();
    if (!wfId || !accId) {
      setDryRunError("Select a recommendation acceptance to register activation.");
      return;
    }
    setActivationBusy(true);
    setDryRunError(null);
    try {
      await postOrchestrationActivationRegister({
        workflowExecutionId: wfId,
        recommendationAcceptanceId: accId,
        activationCategory: GUIDED_ACTIVATION_CATEGORY_BOOKING_TRANSITION,
        dryRunExecutionId: activationDryRunId.trim() || null,
      });
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Activation register failed.");
    } finally {
      setActivationBusy(false);
      void loadActivations();
    }
  }

  async function approveGuidedActivation(id: string) {
    setActivationBusy(true);
    setDryRunError(null);
    try {
      await postOrchestrationActivationApprove({ activationId: id });
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Activation approve failed.");
    } finally {
      setActivationBusy(false);
      void loadActivations();
    }
  }

  async function invokeGuidedActivation(id: string) {
    setActivationBusy(true);
    setDryRunError(null);
    try {
      await postOrchestrationActivationInvoke({ activationId: id });
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Activation invoke failed.");
    } finally {
      setActivationBusy(false);
      void loadActivations();
    }
  }

  async function cancelGuidedActivation(id: string) {
    setActivationBusy(true);
    setDryRunError(null);
    try {
      await postOrchestrationActivationCancel({ activationId: id });
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Activation cancel failed.");
    } finally {
      setActivationBusy(false);
      void loadActivations();
    }
  }

  async function revokeAcceptance(id: string) {
    setAcceptBusy(true);
    setDryRunError(null);
    try {
      await postRevokeRecommendationAcceptance({ acceptanceId: id });
      await loadAcceptances();
    } catch (e) {
      setDryRunError(e instanceof Error ? e.message : "Revoke failed.");
    } finally {
      setAcceptBusy(false);
    }
  }

  if (!getStoredAccessToken()?.trim()) return null;

  const eligibleActivationAcceptances = acceptances.filter(
    (a) =>
      a.acceptanceState === "recorded" &&
      a.recommendationKey === GUIDED_ACTIVATION_RECOMMENDATION_KEY_APPROVED_INVOKE &&
      Boolean(a.workflowApprovalId),
  );

  return (
    <section
      aria-label="Orchestration dry-run preview"
      data-testid="admin-orchestration-preview-section"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">
          {ORCHESTRATION_UX.orchestrationDryRunTitle}
        </h2>
        <p className="mt-1 text-sm text-white/60">{ORCHESTRATION_UX.orchestrationDryRunSubtitle}</p>
        <p className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {ORCHESTRATION_UX.orchestrationDryRunGovernanceRail}
        </p>
      </div>

      {execError ? (
        <p className="text-sm text-amber-200">{execError}</p>
      ) : executions.length === 0 ? (
        <p className="text-sm text-white/55">
          No workflow executions for this booking — dry-run requires an execution row.
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/50">
            Workflow execution
            <select
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              value={selectedExecutionId}
              onChange={(e) => setSelectedExecutionId(e.target.value)}
            >
              {executions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.workflowType} · {ex.state} · {ex.id.slice(0, 8)}…
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-white/50">
            Recommendation key (optional — narrows digest match + acceptance record)
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white"
              placeholder="e.g. approval_pause or policy:some_key"
              value={recommendationKey}
              onChange={(e) => setRecommendationKey(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={dryRunBusy}
              onClick={() => void runDryRun()}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {dryRunBusy ? "Simulating…" : "Run orchestration dry-run"}
            </button>
          </div>

          {dryRunError ? (
            <p className="text-sm text-amber-200">{dryRunError}</p>
          ) : null}

          {dryRunResult != null ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Latest simulation payload (read-only)
              </p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-white/75">
                {JSON.stringify(dryRunResult, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white">
              {ORCHESTRATION_UX.orchestrationDeterministicSimulationTitle}
            </h3>
            <p className="mt-1 text-xs text-white/55">
              {ORCHESTRATION_UX.orchestrationDeterministicSimulationSubtitle}
            </p>
            <p className="mt-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
              {ORCHESTRATION_UX.orchestrationDeterministicSimulationRail}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={simBusy}
                onClick={() => void runOrchestrationSafetySimulation()}
                className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/25 disabled:opacity-40"
              >
                {simBusy ? "Simulating…" : "Run safety snapshot simulation"}
              </button>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Activation for focus simulation (required for activation_focus_v1)
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={simActivationFocusId}
                onChange={(e) => setSimActivationFocusId(e.target.value)}
              >
                <option value="">Select activation…</option>
                {activations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.activationState} · {a.id.slice(0, 10)}…
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={simBusy || !simActivationFocusId.trim()}
              onClick={() => void runActivationFocusSimulation()}
              className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.14] disabled:opacity-40"
            >
              Run activation-focus simulation
            </button>

            {simError ? <p className="mt-3 text-sm text-amber-200">{simError}</p> : null}

            {simLatest != null ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  Latest persisted simulation result (read-only)
                </p>
                <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-white/75">
                  {JSON.stringify(simLatest, null, 2)}
                </pre>
              </div>
            ) : null}

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Recent scenarios (compare runs)
            </p>
            <ul className="mt-2 space-y-2">
              {simScenarios.slice(0, 8).map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/75"
                >
                  <span className="font-mono text-white/90">{s.simulationState}</span>
                  <span className="text-white/45"> · </span>
                  <span>{s.scenarioCategory}</span>
                  <span className="mt-1 block font-mono text-[10px] text-white/45">
                    {new Date(s.createdAt).toLocaleString()} · {s.id.slice(0, 12)}…
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Operational safety evaluations (latest)
            </p>
            <ul className="mt-2 space-y-2">
              {simEvaluations.slice(0, 16).map((ev) => (
                <li
                  key={ev.id}
                  className={`rounded-xl border px-3 py-2 text-xs leading-5 ${
                    ev.severity === "attention"
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-50"
                      : "border-white/10 bg-black/20 text-white/80"
                  }`}
                >
                  <span className="font-semibold">{ev.evaluationCategory}</span>
                  <span className="text-white/45"> · {ev.severity}</span>
                  <span className="mt-1 block text-[11px] opacity-95">{ev.explanation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm font-semibold text-white">Recommendation acceptance log</p>
            <p className="mt-1 text-xs text-white/55">
              Records operator intent only — does not invoke workflows, approvals, or booking transitions.
            </p>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Workflow approval id (required for guided booking-transition activation — paste approved
              booking_transition_invoke approval id)
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white"
                placeholder="cuid…"
                value={workflowApprovalIdInput}
                onChange={(e) => setWorkflowApprovalIdInput(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Note (stored on acceptance payload)
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={acceptNote}
                onChange={(e) => setAcceptNote(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={acceptBusy}
              onClick={() => void recordAcceptance()}
              className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.14] disabled:opacity-40"
            >
              {acceptBusy ? "Recording…" : "Record recommendation acceptance"}
            </button>

            <ul className="mt-4 space-y-2">
              {acceptances.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-mono text-white">{a.recommendationKey}</span>
                    <span className="text-white/45"> · {a.acceptanceState}</span>
                    {a.acceptedAt ? (
                      <span className="block text-white/45">
                        Accepted {new Date(a.acceptedAt).toLocaleString()}
                      </span>
                    ) : null}
                    {a.workflowApprovalId ? (
                      <span className="block font-mono text-[10px] text-white/45">
                        approval {a.workflowApprovalId}
                      </span>
                    ) : null}
                  </div>
                  {a.acceptanceState === "recorded" ? (
                    <button
                      type="button"
                      disabled={acceptBusy}
                      onClick={() => void revokeAcceptance(a.id)}
                      className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-40"
                    >
                      Revoke
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm font-semibold text-white">
              {ORCHESTRATION_UX.orchestrationGuidedActivationTitle}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {ORCHESTRATION_UX.orchestrationGuidedActivationSubtitle}
            </p>
            <p className="mt-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
              {ORCHESTRATION_UX.orchestrationGuidedActivationRail}
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Dry-run execution id (optional gate — must be completed if provided)
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white"
                placeholder="WorkflowDryRunExecution id"
                value={activationDryRunId}
                onChange={(e) => setActivationDryRunId(e.target.value)}
              />
            </label>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Recorded acceptance ({GUIDED_ACTIVATION_RECOMMENDATION_KEY_APPROVED_INVOKE} + approval link)
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={activationRegisterAcceptanceId}
                onChange={(e) => setActivationRegisterAcceptanceId(e.target.value)}
              >
                <option value="">Select acceptance…</option>
                {eligibleActivationAcceptances.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id.slice(0, 10)}… · approval {a.workflowApprovalId?.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={
                activationBusy ||
                !activationRegisterAcceptanceId.trim() ||
                eligibleActivationAcceptances.length === 0
              }
              onClick={() => void registerGuidedActivation()}
              className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {activationBusy ? "Working…" : "Register activation"}
            </button>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Activation audit trail
            </p>
            <ul className="mt-2 space-y-3">
              {activations.map((row) => {
                const canApprove =
                  row.activationState === "registered" &&
                  Boolean(authUserId) &&
                  authUserId !== row.requestedByUserId;
                const canInvoke =
                  row.activationState === "approved_for_invoke" &&
                  Boolean(authUserId) &&
                  authUserId === row.approvedByUserId;
                const canCancel =
                  (row.activationState === "registered" ||
                    row.activationState === "approved_for_invoke") &&
                  Boolean(authUserId) &&
                  (authUserId === row.requestedByUserId ||
                    authUserId === row.approvedByUserId);
                return (
                  <li
                    key={row.id}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/80"
                  >
                    <div className="flex flex-wrap gap-2 font-mono text-[11px] text-white/70">
                      <span>{row.id.slice(0, 12)}…</span>
                      <span className="text-white">{row.activationState}</span>
                      <span className="text-white/45">{row.activationCategory}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/45">
                      Requested {row.requestedByUserId ?? "—"} · Approved{" "}
                      {row.approvedByUserId ?? "—"}
                      {row.invokedAt ?
                        ` · Invoked ${new Date(row.invokedAt).toLocaleString()}`
                      : ""}
                    </p>
                    {(row.activationState === "invoked" || row.activationState === "failed") &&
                    row.resultJson != null ? (
                      <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-white/55">
                        {JSON.stringify(row.resultJson, null, 2)}
                      </pre>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {canApprove ? (
                        <button
                          type="button"
                          disabled={activationBusy}
                          onClick={() => void approveGuidedActivation(row.id)}
                          className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white hover:bg-white/10 disabled:opacity-40"
                        >
                          Approve activation
                        </button>
                      ) : null}
                      {canInvoke ? (
                        <button
                          type="button"
                          disabled={activationBusy}
                          onClick={() => void invokeGuidedActivation(row.id)}
                          className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-500/25 disabled:opacity-40"
                        >
                          Invoke (approver only)
                        </button>
                      ) : null}
                      {canCancel ? (
                        <button
                          type="button"
                          disabled={activationBusy}
                          onClick={() => void cancelGuidedActivation(row.id)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
