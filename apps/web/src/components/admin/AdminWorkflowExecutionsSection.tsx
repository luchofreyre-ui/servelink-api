"use client";

import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { WEB_ENV } from "@/lib/env";

type WorkflowStepRow = {
  id: string;
  stepType: string;
  stepVersion: number;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  resultJson: unknown;
  runnerKey: string | null;
  governanceOutcome: string | null;
};

type WorkflowApprovalAuditRow = {
  id: string;
  actionType: string;
  actorUserId: string | null;
  result: string | null;
  createdAt: string;
  payloadJson: unknown;
};

type WorkflowApprovalRow = {
  id: string;
  approvalType: string;
  approvalState: string;
  requestedAt: string;
  expiresAt: string | null;
  payloadJson: unknown;
  metadataJson: unknown;
  audits?: WorkflowApprovalAuditRow[];
};

export type WorkflowExecutionRow = {
  id: string;
  workflowType: string;
  workflowVersion: number;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  triggeringOutboxEventId: string | null;
  state: string;
  executionStage: string;
  executionMode: string;
  approvalState: string | null;
  payloadJson: unknown;
  metadataJson: unknown;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  steps?: WorkflowStepRow[];
  approvals?: WorkflowApprovalRow[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: WorkflowExecutionRow[] };

function formatIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncateJson(raw: unknown, max = 280): string {
  if (raw == null) return "—";
  const s =
    typeof raw === "string" ? raw.trim() : JSON.stringify(raw, null, 0);
  if (!s) return "—";
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function deriveAdminOrchestrationInterpretationBullets(
  items: WorkflowExecutionRow[],
): string[] {
  const bullets: string[] = [];
  const waiting = items.filter((w) => w.state === "waiting_approval").length;
  if (waiting > 0) {
    bullets.push(
      `${waiting} workflow run(s) paused waiting on explicit human approval — resume only through governed admin approvals.`,
    );
  }
  const gov = items.filter(
    (w) => w.state === "failed" && w.executionStage === "governance_blocked",
  ).length;
  if (gov > 0) {
    bullets.push(
      `${gov} workflow run(s) stopped at governance rails — inspect failed steps for blocked outcomes.`,
    );
  }
  const pendingApprovals = items.reduce((acc, w) => {
    const n =
      w.approvals?.filter((a) => a.approvalState === "pending").length ?? 0;
    return acc + n;
  }, 0);
  if (pendingApprovals > 0) {
    bullets.push(
      `${pendingApprovals} approval row(s) still pending — resolve via Workflow approvals with full audit trail.`,
    );
  }
  const modes = [...new Set(items.map((w) => w.executionMode))];
  bullets.push(
    `Execution modes on file: ${modes.join(", ") || "—"} — default observe-only protects bookings until ops enables approval_required.`,
  );
  return bullets.slice(0, 5);
}

type Props = {
  bookingId: string;
};

/**
 * Read-only workflow executions for this booking — no replay/edit/recovery controls.
 */
export function AdminWorkflowExecutionsSection({ bookingId }: Props) {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    const token = getStoredAccessToken();
    if (!token) {
      setState({ status: "error", message: "Not signed in." });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading" });
    const url = `${WEB_ENV.apiBaseUrl}/admin/workflow-executions?bookingId=${encodeURIComponent(bookingId)}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          items?: WorkflowExecutionRow[];
        } | null;
        if (cancelled) return;
        if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
          setState({
            status: "error",
            message: !res.ok ? `HTTP ${res.status}` : "Unexpected response",
          });
          return;
        }
        setState({ status: "ok", items: body.items });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <section
      data-testid="admin-workflow-executions-preview"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Workflow executions (preview)</h2>
        <p className="mt-1 text-sm text-white/60">
          Engine stages, execution mode, approval state, runner keys, and governance outcomes — read-only.
          Global mode env:{" "}
          <code className="rounded bg-black/50 px-1">WORKFLOW_ENGINE_EXECUTION_MODE</code>.
        </p>
      </div>

      {state.status === "ok" && state.items.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
            Orchestration interpretation (deterministic)
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 marker:text-white/40">
            {deriveAdminOrchestrationInterpretationBullets(state.items).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-white/45">
            No replay, bulk approve, or autonomous execution from this panel — visibility only.
          </p>
        </div>
      ) : null}

      {state.status === "loading" ? (
        <p className="text-sm text-white/55">Loading workflows…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {state.message}
        </p>
      ) : null}

      {state.status === "ok" && state.items.length === 0 ? (
        <p className="text-sm text-white/55">
          No workflow executions for this booking yet (created after outbox delivery completes).
        </p>
      ) : null}

      {state.status === "ok" && state.items.length > 0 ? (
        <div className="space-y-6">
          {state.items.map((wf) => (
            <div
              key={wf.id}
              className="rounded-2xl border border-white/10 bg-black/15 p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xs text-white/50">{wf.id}</span>
                <span className="text-sm font-semibold text-white">{wf.workflowType}</span>
                <span className="text-xs text-white/45">v{wf.workflowVersion}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/65">
                <span>
                  <span className="text-white/40">Mode:</span> {wf.executionMode}
                </span>
                <span>
                  <span className="text-white/40">Approval:</span>{" "}
                  {wf.approvalState ?? "—"}
                </span>
                <span>
                  <span className="text-white/40">State:</span> {wf.state}
                </span>
                <span>
                  <span className="text-white/40">Stage:</span> {wf.executionStage}
                </span>
                <span>
                  <span className="text-white/40">Correlation:</span>{" "}
                  <span className="break-all font-mono">{wf.correlationId}</span>
                </span>
                <span>
                  <span className="text-white/40">Outbox trigger:</span>{" "}
                  {wf.triggeringOutboxEventId ?? "—"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/50">
                <span>Created {formatIso(wf.createdAt)}</span>
                <span>Updated {formatIso(wf.updatedAt)}</span>
                <span>Completed {formatIso(wf.completedAt)}</span>
                {wf.failedAt ? <span className="text-red-300">Failed {formatIso(wf.failedAt)}</span> : null}
              </div>
              {wf.failureReason ? (
                <p className="mt-2 text-xs text-red-200">{wf.failureReason}</p>
              ) : null}

              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Interpretation payload
                  </div>
                  <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[11px] text-white/60">
                    {truncateJson(wf.payloadJson, 900)}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Metadata
                  </div>
                  <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[11px] text-white/60">
                    {truncateJson(wf.metadataJson, 900)}
                  </pre>
                </div>
              </div>

              {wf.steps && wf.steps.length > 0 ? (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Steps timeline
                  </div>
                  <ul className="mt-2 space-y-2">
                    {wf.steps.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/80"
                      >
                        <span className="font-semibold text-white">{s.stepType}</span>{" "}
                        v{s.stepVersion} · {s.state}
                        <span className="text-white/45">
                          {" "}
                          · start {formatIso(s.startedAt)} · done{" "}
                          {formatIso(s.completedAt)}
                          <span className="mt-1 block text-[10px] text-white/50">
                            {[s.runnerKey, s.governanceOutcome].filter(Boolean).join(" · ") ||
                              "—"}
                          </span>
                        </span>
                        <span className="mt-1 block font-mono text-[10px] text-white/45">
                          {truncateJson(s.resultJson, 200)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {wf.approvals && wf.approvals.length > 0 ? (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Approvals & audit (nested)
                  </div>
                  <ul className="mt-2 space-y-2">
                    {wf.approvals.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/80"
                      >
                        <div className="flex flex-wrap gap-2">
                          <span className="font-mono text-[10px] text-white/50">{a.id}</span>
                          <span className="font-semibold text-white">{a.approvalType}</span>
                          <span className="text-white/55">{a.approvalState}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-white/45">
                          Requested {formatIso(a.requestedAt)} · Expires {formatIso(a.expiresAt)}
                        </div>
                        <div className="mt-2 grid gap-2 lg:grid-cols-2">
                          <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[10px] text-white/55">
                            {truncateJson(a.payloadJson, 400)}
                          </pre>
                          <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[10px] text-white/55">
                            {truncateJson(a.metadataJson, 400)}
                          </pre>
                        </div>
                        {a.audits && a.audits.length > 0 ? (
                          <ul className="mt-2 space-y-1 border-t border-white/5 pt-2 text-[10px] text-white/50">
                            {a.audits.map((au) => (
                              <li key={au.id}>
                                <span className="text-white/65">{au.actionType}</span> ·{" "}
                                {formatIso(au.createdAt)} · {au.result ?? "—"}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
