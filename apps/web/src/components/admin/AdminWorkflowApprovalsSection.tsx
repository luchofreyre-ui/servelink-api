"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { WEB_ENV } from "@/lib/env";

type ApprovalAuditPreview = {
  id: string;
  actionType: string;
  createdAt: string;
  result: string | null;
};

type EscalationPreview = {
  id: string;
  escalationCategory: string;
  escalationState: string;
  triggeredAt: string;
};

type ApprovalRow = {
  id: string;
  approvalType: string;
  approvalState: string;
  workflowExecutionId: string;
  requestedAt: string;
  expiresAt: string | null;
  payloadJson: unknown;
  metadataJson: unknown;
  execution?: {
    id: string;
    workflowType: string;
    state: string;
    executionStage: string;
    approvalState: string | null;
  };
  audits?: ApprovalAuditPreview[];
  escalations?: EscalationPreview[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: ApprovalRow[] };

function formatIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type Props = {
  bookingId: string;
};

/**
 * Approval queue for workflow-linked bookings — explicit approve/deny; guarded mutation invoke only after approve + env flag.
 */
export function AdminWorkflowApprovalsSection({ bookingId }: Props) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setState({ status: "error", message: "Not signed in." });
      return;
    }

    setState({ status: "loading" });
    const url = `${WEB_ENV.apiBaseUrl}/admin/workflow-approvals?bookingId=${encodeURIComponent(bookingId)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      items?: ApprovalRow[];
    } | null;

    if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
      setState({
        status: "error",
        message: !res.ok ? `HTTP ${res.status}` : "Unexpected response",
      });
      return;
    }

    setState({ status: "ok", items: body.items });
  }, [bookingId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function postJson(path: string, jsonBody?: unknown) {
    const token = getStoredAccessToken();
    if (!token) throw new Error("Not signed in.");
    const res = await fetch(`${WEB_ENV.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: jsonBody ? JSON.stringify(jsonBody) : undefined,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(errBody || `HTTP ${res.status}`);
    }
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      await postJson(`/admin/workflow-approvals/${encodeURIComponent(id)}/approve`);
      await reload();
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Approve failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function deny(id: string) {
    setBusyId(id);
    try {
      await postJson(`/admin/workflow-approvals/${encodeURIComponent(id)}/deny`, {});
      await reload();
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Deny failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function invokeBookingTransition(id: string) {
    setBusyId(id);
    try {
      await postJson(`/admin/orchestration/booking-transition/invoke`, {
        workflowApprovalId: id,
      });
      await reload();
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Invoke failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function flagEscalation(id: string) {
    const note =
      typeof window !== "undefined"
        ? window.prompt(
            "Escalation note (optional — recorded for governance visibility only):",
            "",
          )
        : null;
    if (note === null) return;
    setBusyId(id);
    try {
      await postJson(`/admin/workflow-approvals/${encodeURIComponent(id)}/escalations`, {
        escalationCategory: "operator_review",
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      await reload();
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Escalation record failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      data-testid="admin-workflow-approvals-queue"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Workflow approvals</h2>
        <p className="mt-1 text-sm text-white/60">
          Queue scoped to this booking — approve/deny is durable and audited. Booking transitions invoke only after approval and{" "}
          <code className="rounded bg-black/50 px-1">
            ENABLE_ORCHESTRATION_BOOKING_TRANSITION_INVOCATION=true
          </code>
          .
        </p>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-white/55">Loading approvals…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {state.message}
        </p>
      ) : null}

      {state.status === "ok" && state.items.length === 0 ? (
        <p className="text-sm text-white/55">No approvals for this booking yet.</p>
      ) : null}

      {state.status === "ok" && state.items.length > 0 ? (
        <ul className="space-y-3">
          {state.items.map((row) => {
            const meta = row.metadataJson as {
              bookingTransitionInvokedAt?: string;
              bookingTransitionSimulated?: boolean;
            } | null;
            const canGovern =
              row.approvalState === "pending";
            const canInvokeTransition =
              row.approvalType === "booking_transition_invoke_v1" &&
              row.approvalState === "approved" &&
              !meta?.bookingTransitionInvokedAt;

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs text-white/75"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-white/45">{row.id}</span>
                  <span className="font-semibold text-white">{row.approvalType}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {row.approvalState}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-white/45">
                  Execution {row.execution?.id ?? row.workflowExecutionId} · {row.execution?.state ?? "—"} · stage{" "}
                  {row.execution?.executionStage ?? "—"}
                </div>
                <div className="mt-1 text-[10px] text-white/45">
                  Requested {formatIso(row.requestedAt)} · Expires {formatIso(row.expiresAt)}
                </div>

                {row.escalations && row.escalations.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-50/90">
                    <span className="font-semibold uppercase tracking-wide text-amber-100/80">
                      Escalations on file
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {row.escalations.slice(0, 4).map((es) => (
                        <li key={es.id}>
                          {es.escalationCategory} · {es.escalationState} ·{" "}
                          {formatIso(es.triggeredAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {canGovern ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className="rounded-full bg-emerald-600/80 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
                        onClick={() => void approve(row.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/15 disabled:opacity-40"
                        onClick={() => void deny(row.id)}
                      >
                        Deny
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className="rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-50 hover:bg-amber-500/25 disabled:opacity-40"
                        title="Records an escalation signal — does not approve or invoke transitions."
                        onClick={() => void flagEscalation(row.id)}
                      >
                        Flag escalation
                      </button>
                    </>
                  ) : null}

                  {canInvokeTransition ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full bg-sky-600/80 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600 disabled:opacity-40"
                      onClick={() => void invokeBookingTransition(row.id)}
                    >
                      Invoke booking transition
                    </button>
                  ) : null}
                </div>

                {row.audits && row.audits.length > 0 ? (
                  <ul className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/45">
                    {row.audits.slice(0, 6).map((a) => (
                      <li key={a.id}>
                        {a.actionType} · {formatIso(a.createdAt)} · {a.result ?? "—"}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
