"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDispatchExceptionNote,
  assignToMeDispatchExceptionAction,
  fetchDispatchExceptionActionDetail,
  updateDispatchExceptionOwner,
  updateDispatchExceptionPriority,
  updateDispatchExceptionStatus,
} from "@/lib/api/dispatchExceptionActions";
import { getStoredAccessToken } from "@/lib/auth";
import { readJwtUserId } from "@/lib/jwt-payload";
import type {
  DispatchExceptionActionDetail,
  DispatchExceptionActionPriority,
  DispatchExceptionActionStatus,
} from "@/types/dispatchExceptionActions";
import { DispatchExceptionActionNotesPanel } from "./DispatchExceptionActionNotesPanel";
import { DispatchExceptionActionOwnerControl } from "./DispatchExceptionActionOwnerControl";
import { DispatchExceptionActionPriorityControl } from "./DispatchExceptionActionPriorityControl";
import { DispatchExceptionActionStatusControl } from "./DispatchExceptionActionStatusControl";
import { DispatchExceptionActionTimeline } from "./DispatchExceptionActionTimeline";
import { DispatchExceptionActionValidationBadge } from "./DispatchExceptionActionValidationBadge";

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

export function DispatchExceptionActionDetailWorkspace() {
  const params = useParams();
  const dispatchExceptionKey = decodeURIComponent(
    String(params?.dispatchExceptionKey ?? ""),
  );

  const [token, setToken] = useState<string | null>(null);
  const [action, setAction] = useState<DispatchExceptionActionDetail | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);
  const [assignToMeBusy, setAssignToMeBusy] = useState(false);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    if (!token || !dispatchExceptionKey) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const a = await fetchDispatchExceptionActionDetail(
          token,
          dispatchExceptionKey,
        );
        if (cancelled) return;
        setAction(a);
      } catch (e) {
        if (!cancelled) {
          setAction(null);
          setLoadError(
            e instanceof Error ? e.message : "Failed to load exception action.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, dispatchExceptionKey]);

  const updateOwner = useCallback(
    async (p: { dispatchExceptionKey: string; ownerUserId: string | null }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateDispatchExceptionOwner(token, p);
      setAction(d);
    },
    [token],
  );

  const updatePriority = useCallback(
    async (p: {
      dispatchExceptionKey: string;
      priority: DispatchExceptionActionPriority;
    }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateDispatchExceptionPriority(token, p);
      setAction(d);
    },
    [token],
  );

  const updateStatus = useCallback(
    async (p: {
      dispatchExceptionKey: string;
      status: DispatchExceptionActionStatus;
    }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await updateDispatchExceptionStatus(token, p);
      setAction(d);
    },
    [token],
  );

  const onAddNote = useCallback(
    async (p: { dispatchExceptionKey: string; text: string }) => {
      if (!token) throw new Error("Not signed in.");
      const d = await addDispatchExceptionNote(token, p);
      setAction(d);
    },
    [token],
  );

  const assignToMe = useCallback(async () => {
    if (!token) throw new Error("Not signed in.");
    setAssignToMeBusy(true);
    try {
      const d = await assignToMeDispatchExceptionAction(
        token,
        dispatchExceptionKey,
      );
      setAction(d);
    } finally {
      setAssignToMeBusy(false);
    }
  }, [token, dispatchExceptionKey]);

  const currentUserId = token ? readJwtUserId(token) : null;

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <p className="text-sm text-white/55">Checking authentication…</p>
      </main>
    );
  }

  if (!dispatchExceptionKey) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <p className="text-sm text-amber-200/90">Missing exception key.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/55">Loading exception action…</p>
        </div>
      </main>
    );
  }

  if (loadError || !action) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl space-y-4">
          <Link
            href="/admin/exceptions"
            className="text-sm text-sky-300 hover:text-sky-200"
          >
            ← Dispatch exception actions
          </Link>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {loadError ?? "Exception action not found."}
          </div>
        </div>
      </main>
    );
  }

  const title =
    action.exceptionTitle || action.exceptionSummary || "Dispatch exception";
  const summary =
    action.exceptionTitle && action.exceptionSummary ?
      action.exceptionSummary
    : null;
  const disabledMutations = !token;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link
            href="/admin/exceptions"
            className="text-sm text-sky-300 hover:text-sky-200"
          >
            ← Dispatch exception actions
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {priorityPill(action.priority)}
            {statusPill(action.status)}
            <DispatchExceptionActionValidationBadge
              status={action.status}
              validationState={action.validationState}
              isResolvedAwaitingValidation={
                action.isResolvedAwaitingValidation
              }
            />
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
          {summary ?
            <p className="mt-2 max-w-3xl text-sm text-white/70">{summary}</p>
          : null}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="font-mono text-white/70" title="Exception key">
              {action.dispatchExceptionKey}
            </span>
            <button
              type="button"
              disabled={!action.dispatchExceptionKey}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    action.dispatchExceptionKey,
                  );
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
            <span>Severity: {action.severity ?? "—"}</span>
            <span>
              Booking:{" "}
              <Link
                href={`/admin/bookings/${action.bookingId}`}
                className="font-mono text-sky-300 hover:text-sky-200"
              >
                {action.bookingId}
              </Link>
            </span>
            {action.foId ?
              <span className="font-mono text-white/60">FO {action.foId}</span>
            : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                <DispatchExceptionActionOwnerControl
                  dispatchExceptionKey={action.dispatchExceptionKey}
                  ownerUserId={action.ownerUserId}
                  disabled={disabledMutations}
                  updateOwner={updateOwner}
                  onUpdated={noopRefresh}
                />
                <DispatchExceptionActionPriorityControl
                  dispatchExceptionKey={action.dispatchExceptionKey}
                  priority={action.priority}
                  disabled={disabledMutations}
                  updatePriority={updatePriority}
                  onUpdated={noopRefresh}
                />
                <DispatchExceptionActionStatusControl
                  dispatchExceptionKey={action.dispatchExceptionKey}
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
                    JWT must include <span className="font-mono">sub</span> to
                    use quick assign.
                  </span>
                : null}
              </div>
            </div>

            <DispatchExceptionActionNotesPanel
              dispatchExceptionKey={action.dispatchExceptionKey}
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
                {!action.isOverdue &&
                !action.isDueSoon &&
                action.slaStatus ?
                  <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                    {action.slaStatus.replace(/_/g, " ")}
                  </span>
                : null}
              </div>
              <dl className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex justify-between gap-2">
                  <dt>Policy (hours)</dt>
                  <dd className="text-white/85">
                    {action.slaPolicyHours != null ?
                      String(action.slaPolicyHours)
                    : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Started</dt>
                  <dd className="text-right">
                    {formatWhen(action.slaStartedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Due</dt>
                  <dd className="text-right">{formatWhen(action.slaDueAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last evaluated</dt>
                  <dd className="text-right">
                    {formatWhen(action.slaLastEvaluatedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Escalation ready at</dt>
                  <dd className="text-right">
                    {formatWhen(action.escalationReadyAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Validation</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <DispatchExceptionActionValidationBadge
                  status={action.status}
                  validationState={action.validationState}
                  isResolvedAwaitingValidation={
                    action.isResolvedAwaitingValidation
                  }
                />
              </div>
              <dl className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex justify-between gap-2">
                  <dt>Awaiting validation</dt>
                  <dd className="text-white/85">
                    {action.isResolvedAwaitingValidation ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last checked</dt>
                  <dd className="text-right">
                    {formatWhen(action.validationLastCheckedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last passed</dt>
                  <dd className="text-right">
                    {formatWhen(action.validationLastPassedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last failed</dt>
                  <dd className="text-right">
                    {formatWhen(action.validationLastFailedAt)}
                  </dd>
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
                  <dt className="text-white/40">Latest decision</dt>
                  <dd className="mt-0.5 text-white/80">
                    {action.latestDecisionStatus ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Trigger</dt>
                  <dd className="mt-0.5 text-white/80">
                    {action.latestTrigger ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Trigger detail</dt>
                  <dd className="mt-0.5 break-words text-white/75">
                    {action.latestTriggerDetail ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Recommended action</dt>
                  <dd className="mt-0.5 text-white/80">
                    {action.recommendedAction ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Reasons</dt>
                  <dd className="mt-0.5 text-white/75">
                    {action.exceptionReasons.length ?
                      action.exceptionReasons.join(", ")
                    : "—"}
                  </dd>
                </div>
                {action.metadataSnapshot &&
                Object.keys(action.metadataSnapshot).length > 0 ?
                  <div>
                    <dt className="text-white/40">Snapshot (JSON)</dt>
                    <dd className="mt-1 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[10px] text-white/60">
                      {JSON.stringify(action.metadataSnapshot, null, 2)}
                    </dd>
                  </div>
                : null}
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Timeline</h3>
              <div className="mt-3 max-h-[32rem] overflow-y-auto pr-1">
                <DispatchExceptionActionTimeline events={action.events} />
              </div>
            </div>
          </aside>
        </div>

        <p className="text-[11px] text-white/35">
          Action updated {formatWhen(action.updatedAt)} · Created{" "}
          {formatWhen(action.createdAt)}
        </p>
      </div>
    </main>
  );
}
