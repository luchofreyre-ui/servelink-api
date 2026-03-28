"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  addSystemTestIncidentNote,
  assignToMeSystemTestIncident,
  fetchSystemTestIncidentActionDetail,
  updateSystemTestIncidentOwner,
  updateSystemTestIncidentPriority,
  updateSystemTestIncidentStatus,
  updateSystemTestIncidentStep,
} from "@/lib/api/systemTestIncidentActions";
import {
  fetchAdminSystemTestIncidentDetail,
  type SystemTestIncidentDetailApi,
} from "@/lib/api/systemTestIncidents";
import { getStoredAccessToken } from "@/lib/auth";
import { readJwtUserId } from "@/lib/jwt-payload";
import type {
  SystemTestIncidentActionDetail,
  SystemTestIncidentActionPriority,
  SystemTestIncidentActionStatus,
  SystemTestIncidentStepExecutionStatus,
} from "@/types/systemTestIncidentActions";
import { SystemTestIncidentFixChecklist } from "./SystemTestIncidentFixChecklist";
import { SystemTestIncidentNotesPanel } from "./SystemTestIncidentNotesPanel";
import { SystemTestIncidentOwnerControl } from "./SystemTestIncidentOwnerControl";
import { SystemTestIncidentPriorityControl } from "./SystemTestIncidentPriorityControl";
import { SystemTestIncidentStatusControl } from "./SystemTestIncidentStatusControl";
import { SystemTestIncidentTimeline } from "./SystemTestIncidentTimeline";
import { SystemTestIncidentValidationBadge } from "./SystemTestIncidentValidationBadge";
import { SystemTestsIncidentFixTrackCard } from "./SystemTestsIncidentFixTrackCard";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusPill(status: string) {
  return (
    <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
      {status}
    </span>
  );
}

function priorityPill(priority: string) {
  const hot = priority === "critical" || priority === "high";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        hot ?
          "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : "border-white/15 bg-white/[0.06] text-white/65"
      }`}
    >
      {priority}
    </span>
  );
}

const noopRefresh = async () => {};

export function SystemTestIncidentDetailWorkspace() {
  const params = useParams();
  const searchParams = useSearchParams();
  const incidentKey = String(params?.incidentKey ?? "");
  const runIdFromQuery = searchParams?.get("runId") ?? undefined;

  const [token, setToken] = useState<string | null>(null);
  const [action, setAction] = useState<SystemTestIncidentActionDetail | null>(null);
  const [intel, setIntel] = useState<SystemTestIncidentDetailApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);
  const [assignToMeBusy, setAssignToMeBusy] = useState(false);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    if (!token || !incidentKey) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const actionPromise = fetchSystemTestIncidentActionDetail(token, incidentKey);
        const intelPromise = fetchAdminSystemTestIncidentDetail(token, incidentKey, {
          runId: runIdFromQuery,
        }).catch(() => null);

        const [a, i] = await Promise.all([actionPromise, intelPromise]);
        if (cancelled) return;
        setAction(a);
        setIntel(i);
      } catch (e) {
        if (!cancelled) {
          setAction(null);
          setIntel(null);
          setLoadError(e instanceof Error ? e.message : "Failed to load incident action.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, incidentKey, runIdFromQuery]);

  const updateOwner = useCallback(
    async (p: { incidentKey: string; ownerUserId: string | null }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateSystemTestIncidentOwner(token, p);
      setAction(d);
    },
    [token],
  );

  const updatePriority = useCallback(
    async (p: { incidentKey: string; priority: SystemTestIncidentActionPriority }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateSystemTestIncidentPriority(token, p);
      setAction(d);
    },
    [token],
  );

  const updateStatus = useCallback(
    async (p: { incidentKey: string; status: SystemTestIncidentActionStatus }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateSystemTestIncidentStatus(token, p);
      setAction(d);
    },
    [token],
  );

  const updateStep = useCallback(
    async (p: {
      incidentKey: string;
      stepIndex: number;
      status: SystemTestIncidentStepExecutionStatus;
      notes?: string;
    }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateSystemTestIncidentStep(token, p);
      setAction(d);
    },
    [token],
  );

  const onAddNote = useCallback(
    async (p: { incidentKey: string; text: string }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await addSystemTestIncidentNote(token, p);
      setAction(d);
    },
    [token],
  );

  const assignToMe = useCallback(async () => {
    if (!token) throw new Error("Not signed in.");
    setAssignToMeBusy(true);
    try {
      const d = await assignToMeSystemTestIncident(token, incidentKey);
      setAction(d);
    } finally {
      setAssignToMeBusy(false);
    }
  }, [token, incidentKey]);

  const currentUserId = token ? readJwtUserId(token) : null;

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <p className="text-sm text-white/55">Checking authentication…</p>
      </main>
    );
  }

  if (!incidentKey) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <p className="text-sm text-amber-200/90">Missing incident key.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/55">Loading incident…</p>
        </div>
      </main>
    );
  }

  if (loadError || !action) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl space-y-4">
          <Link href="/admin/system-tests/incidents" className="text-sm text-sky-300 hover:text-sky-200">
            ← Incident actions
          </Link>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {loadError ?? "Incident action not found."}
          </div>
        </div>
      </main>
    );
  }

  const title = action.incidentTitle || intel?.displayTitle || "Incident";
  const summary = action.incidentSummary || intel?.summary || null;
  const severity = action.incidentSeverity || intel?.severity || "—";
  const disabledMutations = !token;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link href="/admin/system-tests/incidents" className="text-sm text-sky-300 hover:text-sky-200">
            ← Incident actions
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {priorityPill(action.priority)}
            {statusPill(action.status)}
            <SystemTestIncidentValidationBadge
              status={action.status}
              validationState={action.validationState}
              isResolvedAwaitingValidation={action.isResolvedAwaitingValidation}
            />
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
          {summary ?
            <p className="mt-2 max-w-3xl text-sm text-white/70">{summary}</p>
          : null}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="font-mono text-white/70" title="Incident key">
              {action.incidentKey}
            </span>
            <button
              type="button"
              disabled={!action.incidentKey}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(action.incidentKey);
                  setCopyDone(true);
                  setTimeout(() => setCopyDone(false), 2000);
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              {copyDone ? "Copied" : "Copy key"}
            </button>
            <span>Severity: {severity}</span>
            <span>
              Current run:{" "}
              <span className="font-mono text-white/75">{action.currentRunId ?? "—"}</span>
            </span>
            <span>
              Last seen run:{" "}
              <span className="font-mono text-white/75">{action.lastSeenRunId ?? "—"}</span>
            </span>
            {intel?.leadFamilyId ?
              <Link
                href={`/admin/system-tests/families/${intel.leadFamilyId}`}
                className="text-sky-300 hover:text-sky-200"
              >
                Lead family →
              </Link>
            : null}
            <Link href="/admin/system-tests/compare" className="text-sky-300 hover:text-sky-200">
              Open compare
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                <SystemTestIncidentOwnerControl
                  incidentKey={action.incidentKey}
                  ownerUserId={action.ownerUserId}
                  disabled={disabledMutations}
                  updateOwner={updateOwner}
                  onUpdated={noopRefresh}
                />
                <SystemTestIncidentPriorityControl
                  incidentKey={action.incidentKey}
                  priority={action.priority}
                  disabled={disabledMutations}
                  updatePriority={updatePriority}
                  onUpdated={noopRefresh}
                />
                <SystemTestIncidentStatusControl
                  incidentKey={action.incidentKey}
                  status={action.status}
                  disabled={disabledMutations}
                  updateStatus={updateStatus}
                  onUpdated={noopRefresh}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    disabledMutations || !currentUserId || assignToMeBusy
                  }
                  onClick={() => void assignToMe().catch(() => {})}
                  className="rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-1.5 text-xs font-medium text-teal-100 hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    !currentUserId ?
                      "Sign in with a user id in the token (sub) to assign."
                    : undefined
                  }
                >
                  {assignToMeBusy ? "Assigning…" : "Assign to me"}
                </button>
                {!currentUserId ?
                  <span className="text-[11px] text-white/40">
                    JWT must include <span className="font-mono">sub</span> to use quick assign.
                  </span>
                : null}
              </div>
            </div>

            <SystemTestIncidentFixChecklist
              incidentKey={action.incidentKey}
              recommendedSteps={action.recommendedSteps}
              validationSteps={action.validationSteps}
              stepExecutions={action.stepExecutions}
              disabled={disabledMutations}
              updateStep={updateStep}
              onStepSaved={noopRefresh}
            />

            <SystemTestIncidentNotesPanel
              incidentKey={action.incidentKey}
              notes={action.notes}
              disabled={disabledMutations}
              onAddNote={onAddNote}
            />
          </div>

          <aside className="min-w-0 space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">SLA</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {action.isOverdue ?
                  <span className="inline-flex rounded-md border border-rose-400/35 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                    Overdue
                  </span>
                : null}
                {action.isDueSoon && !action.isOverdue ?
                  <span className="inline-flex rounded-md border border-orange-400/35 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-100">
                    Due soon
                  </span>
                : null}
                {!action.isOverdue && !action.isDueSoon && action.slaStatus ?
                  <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                    {action.slaStatus.replace(/_/g, " ")}
                  </span>
                : null}
              </div>
              <dl className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex justify-between gap-2">
                  <dt>Policy (hours)</dt>
                  <dd className="text-white/85">
                    {action.slaPolicyHours != null ? String(action.slaPolicyHours) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Started</dt>
                  <dd className="text-right">{formatWhen(action.slaStartedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Due</dt>
                  <dd className="text-right">{formatWhen(action.slaDueAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last evaluated</dt>
                  <dd className="text-right">{formatWhen(action.slaLastEvaluatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Escalation ready at</dt>
                  <dd className="text-right">{formatWhen(action.escalationReadyAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Validation</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <SystemTestIncidentValidationBadge
                  status={action.status}
                  validationState={action.validationState}
                  isResolvedAwaitingValidation={action.isResolvedAwaitingValidation}
                />
              </div>
              <dl className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex justify-between gap-2">
                  <dt>Awaiting validation</dt>
                  <dd className="text-white/85">{action.isResolvedAwaitingValidation ? "Yes" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last checked</dt>
                  <dd className="text-right">{formatWhen(action.validationLastCheckedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last passed</dt>
                  <dd className="text-right">{formatWhen(action.validationLastPassedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last failed</dt>
                  <dd className="text-right">{formatWhen(action.validationLastFailedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Reopen count</dt>
                  <dd className="text-white/85">{action.reopenCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Reopened at</dt>
                  <dd className="text-right">{formatWhen(action.reopenedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Resolved at</dt>
                  <dd className="text-right">{formatWhen(action.resolvedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Metadata</h3>
              <dl className="mt-3 space-y-2 text-xs text-white/60">
                <div>
                  <dt className="text-white/40">Primary area</dt>
                  <dd className="mt-0.5 text-white/80">{action.fixTrackPrimaryArea ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Incident key</dt>
                  <dd className="mt-0.5 break-all font-mono text-[11px] text-white/75">{action.incidentKey}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Severity</dt>
                  <dd className="mt-0.5 text-white/80">{severity}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Current run id</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-white/75">{action.currentRunId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Last seen run id</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-white/75">{action.lastSeenRunId ?? "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Timeline</h3>
              <div className="mt-3 max-h-[32rem] overflow-y-auto pr-1">
                <SystemTestIncidentTimeline events={action.events} />
              </div>
            </div>
          </aside>
        </div>

        {intel?.fixTrack ?
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Synthesis fix track</h2>
            <p className="text-xs text-white/45">
              Read-only context from incident synthesis (action checklist above is the operator surface).
            </p>
            <SystemTestsIncidentFixTrackCard fixTrack={intel.fixTrack} />
          </section>
        : null}

        {intel?.members?.length ?
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Cluster members</h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Family</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Match basis</th>
                    <th className="px-4 py-3 font-semibold">Family status</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80">
                  {intel.members.map((m) => (
                    <tr key={m.familyId}>
                      <td className="max-w-sm px-4 py-3 text-xs">{m.displayTitle}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{m.role}</td>
                      <td className="max-w-xs px-4 py-3 font-mono text-[10px] text-white/55">
                        {m.matchBasis}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{m.familyStatus}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/system-tests/families/${m.familyId}`}
                          className="text-sky-300 hover:text-sky-200"
                        >
                          Family
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        : null}

        <p className="text-[11px] text-white/35">
          Action updated {formatWhen(action.updatedAt)} · Created {formatWhen(action.createdAt)}
        </p>
      </div>
    </main>
  );
}
