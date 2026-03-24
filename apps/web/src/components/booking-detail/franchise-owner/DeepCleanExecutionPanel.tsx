"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  completeDeepCleanVisit,
  startDeepCleanVisit,
} from "@/lib/api/bookings";
import type { DeepCleanExecutionDisplay } from "@/types/deepCleanProgram";

function statusLabel(
  s: "not_started" | "in_progress" | "completed",
): string {
  if (s === "completed") return "Completed";
  if (s === "in_progress") return "In progress";
  return "Not started";
}

function programStatusBadge(
  s: "not_started" | "in_progress" | "completed",
): string {
  if (s === "completed") return "Program: Completed";
  if (s === "in_progress") return "Program: In progress";
  return "Program: Not started";
}

type DeepCleanExecutionPanelProps = {
  bookingId: string;
  execution: DeepCleanExecutionDisplay;
};

export function DeepCleanExecutionPanel({
  bookingId,
  execution,
}: DeepCleanExecutionPanelProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationDraft, setDurationDraft] = useState<Record<number, string>>(
    {},
  );
  const [noteDraft, setNoteDraft] = useState<Record<number, string>>({});

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const onStart = async (visitNumber: number) => {
    const key = `start-${visitNumber}`;
    setError(null);
    setBusyKey(key);
    try {
      await startDeepCleanVisit(bookingId, visitNumber);
      refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not start visit.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const onComplete = async (visitNumber: number) => {
    const key = `complete-${visitNumber}`;
    setError(null);
    setBusyKey(key);
    const raw = (durationDraft[visitNumber] ?? "").trim();
    let actualDurationMinutes: number | null = null;
    if (raw !== "") {
      const n = parseInt(raw, 10);
      actualDurationMinutes = Number.isFinite(n) ? Math.max(0, n) : null;
    }
    const operatorNote =
      (noteDraft[visitNumber] ?? "").trim() || null;
    try {
      await completeDeepCleanVisit(bookingId, visitNumber, {
        actualDurationMinutes,
        operatorNote,
      });
      refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not complete visit.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const progressLine = useMemo(
    () =>
      `${execution.completedVisits} / ${execution.totalVisits} visits completed`,
    [execution.completedVisits, execution.totalVisits],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">
        Deep clean execution
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Visit units for on-site work. No dispatch automation or schedule locks
        are applied here.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
          {programStatusBadge(execution.programStatus)}
        </span>
        <span className="text-sm text-slate-600">{progressLine}</span>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <ul className="mt-5 space-y-4">
        {execution.visits.map((v) => {
          const busy =
            busyKey === `start-${v.visitNumber}` ||
            busyKey === `complete-${v.visitNumber}`;
          return (
            <li
              key={v.visitNumber}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Visit {v.visitNumber}
                  </p>
                  <p className="text-sm text-slate-800">{v.programLabel}</p>
                  {v.programDescription ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {v.programDescription}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Status: {statusLabel(v.status)}
                </span>
              </div>

              {v.taskBundleLabel ? (
                <p className="mt-2 text-xs text-slate-500">
                  Task bundle: {v.taskBundleLabel}
                </p>
              ) : null}

              {v.tasks.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-700">
                  {v.tasks.map((t) => (
                    <li key={t.taskId}>{t.label}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Task checklist unavailable for this visit.
                </p>
              )}

              <dl className="mt-3 grid gap-1 text-xs text-slate-600">
                {v.startedAt ? (
                  <div>
                    <dt className="inline font-medium text-slate-700">
                      Started:{" "}
                    </dt>
                    <dd className="inline">{v.startedAt}</dd>
                  </div>
                ) : null}
                {v.completedAt ? (
                  <div>
                    <dt className="inline font-medium text-slate-700">
                      Completed:{" "}
                    </dt>
                    <dd className="inline">{v.completedAt}</dd>
                  </div>
                ) : null}
                {v.actualDurationMinutes != null ? (
                  <div>
                    <dt className="inline font-medium text-slate-700">
                      Actual duration (minutes):{" "}
                    </dt>
                    <dd className="inline">{v.actualDurationMinutes}</dd>
                  </div>
                ) : null}
                {v.operatorNote ? (
                  <div>
                    <dt className="inline font-medium text-slate-700">
                      Operator note:{" "}
                    </dt>
                    <dd className="inline">{v.operatorNote}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex flex-col gap-3">
                {v.status === "not_started" ? (
                  <button
                    type="button"
                    disabled={busy || !bookingId}
                    onClick={() => void onStart(v.visitNumber)}
                    className="w-full max-w-xs rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busy ? "Working…" : "Start visit"}
                  </button>
                ) : null}

                {v.status === "in_progress" ? (
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-medium text-slate-700"
                      htmlFor={`deep-clean-duration-${v.visitNumber}`}
                    >
                      Actual duration (minutes)
                      <input
                        id={`deep-clean-duration-${v.visitNumber}`}
                        type="number"
                        min={0}
                        className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        value={durationDraft[v.visitNumber] ?? ""}
                        onChange={(e) =>
                          setDurationDraft((d) => ({
                            ...d,
                            [v.visitNumber]: e.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label
                      className="block text-xs font-medium text-slate-700"
                      htmlFor={`deep-clean-note-${v.visitNumber}`}
                    >
                      Operator note
                      <textarea
                        id={`deep-clean-note-${v.visitNumber}`}
                        className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        rows={2}
                        value={noteDraft[v.visitNumber] ?? ""}
                        onChange={(e) =>
                          setNoteDraft((d) => ({
                            ...d,
                            [v.visitNumber]: e.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || !bookingId}
                      onClick={() => void onComplete(v.visitNumber)}
                      className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {busy ? "Working…" : "Complete visit"}
                    </button>
                  </div>
                ) : null}

                {v.status === "completed" ? (
                  <p className="text-xs font-medium text-emerald-800">
                    Visit completed
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
