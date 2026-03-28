"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  SystemTestIncidentStepExecution,
  SystemTestIncidentStepExecutionStatus,
} from "@/types/systemTestIncidentActions";

const STEP_STATUSES: SystemTestIncidentStepExecutionStatus[] = [
  "pending",
  "in_progress",
  "completed",
];

type Props = {
  incidentKey: string;
  recommendedSteps: string[];
  validationSteps: string[];
  stepExecutions: SystemTestIncidentStepExecution[];
  disabled?: boolean;
  onStepSaved: () => Promise<void> | void;
  updateStep: (params: {
    incidentKey: string;
    stepIndex: number;
    status: SystemTestIncidentStepExecutionStatus;
    notes?: string;
  }) => Promise<void>;
};

function executionForIndex(
  executions: SystemTestIncidentStepExecution[],
  index: number,
): SystemTestIncidentStepExecution | undefined {
  return executions.find((s) => s.stepIndex === index);
}

export function SystemTestIncidentFixChecklist({
  incidentKey,
  recommendedSteps,
  validationSteps,
  stepExecutions,
  disabled,
  onStepSaved,
  updateStep,
}: Props) {
  const completedCount = useMemo(
    () => stepExecutions.filter((s) => s.status === "completed").length,
    [stepExecutions],
  );
  const totalTracked = recommendedSteps.length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Fix-track checklist</h3>
        <p className="text-xs text-white/50">
          {completedCount} of {totalTracked} recommended steps completed
        </p>
      </div>
      <ul className="mt-4 space-y-4">
        {recommendedSteps.map((label, index) => (
          <FixStepRow
            key={`${index}-${label.slice(0, 20)}`}
            incidentKey={incidentKey}
            stepIndex={index}
            label={label}
            execution={executionForIndex(stepExecutions, index)}
            disabled={disabled}
            onStepSaved={onStepSaved}
            updateStep={updateStep}
          />
        ))}
      </ul>
      {validationSteps.length > 0 ?
        <div className="mt-6 border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">
            Validation steps (reference)
          </h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/65">
            {validationSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      : null}
    </div>
  );
}

function FixStepRow({
  incidentKey,
  stepIndex,
  label,
  execution,
  disabled,
  onStepSaved,
  updateStep,
}: {
  incidentKey: string;
  stepIndex: number;
  label: string;
  execution: SystemTestIncidentStepExecution | undefined;
  disabled?: boolean;
  onStepSaved: () => Promise<void> | void;
  updateStep: (params: {
    incidentKey: string;
    stepIndex: number;
    status: SystemTestIncidentStepExecutionStatus;
    notes?: string;
  }) => Promise<void>;
}) {
  const [status, setStatus] = useState<SystemTestIncidentStepExecutionStatus>(
    execution?.status ?? "pending",
  );
  const [notes, setNotes] = useState(execution?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(execution?.status ?? "pending");
    setNotes(execution?.notes ?? "");
  }, [execution?.status, execution?.notes, execution?.updatedAt]);

  const dirty =
    status !== (execution?.status ?? "pending") || notes !== (execution?.notes ?? "");

  return (
    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs font-medium text-white/45">Step {stepIndex + 1}</div>
      <p className="mt-1 text-sm text-white/90">{label}</p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={status}
          disabled={disabled || saving}
          onChange={(e) =>
            setStatus(e.target.value as SystemTestIncidentStepExecutionStatus)
          }
          className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
        >
          {STEP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Step notes (optional)"
          disabled={disabled || saving}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-white/35"
        />
        <button
          type="button"
          disabled={disabled || saving || !dirty}
          onClick={async () => {
            setError(null);
            setSaving(true);
            try {
              await updateStep({
                incidentKey,
                stepIndex,
                status,
                notes: notes.trim() || undefined,
              });
              await onStepSaved();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-lg border border-teal-400/40 bg-teal-500/20 px-3 py-1.5 text-xs font-medium text-teal-100 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </li>
  );
}
