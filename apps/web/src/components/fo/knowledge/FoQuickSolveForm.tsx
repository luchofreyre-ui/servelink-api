"use client";

import { KnowledgeProblem, KnowledgeSeverity, KnowledgeSurface } from "@/types/knowledge";

export interface FoQuickSolveFormValue {
  surfaceId: string;
  problemId: string;
  severity: KnowledgeSeverity;
}

interface FoQuickSolveFormProps {
  surfaces: KnowledgeSurface[];
  problems: KnowledgeProblem[];
  value: FoQuickSolveFormValue;
  onChange: (next: FoQuickSolveFormValue) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const SEVERITY_OPTIONS: Array<{ value: KnowledgeSeverity; label: string }> = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

export function FoQuickSolveForm({
  surfaces,
  problems,
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: FoQuickSolveFormProps) {
  const canSubmit =
    !isSubmitting && value.surfaceId.trim().length > 0 && value.problemId.trim().length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="fo-quick-solve-form">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quick Solve</h2>
          <p className="mt-1 text-sm text-slate-600">
            Get the recommended approach for the exact surface and problem in front of you.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Surface</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              value={value.surfaceId}
              onChange={(event) =>
                onChange({
                  ...value,
                  surfaceId: event.target.value,
                })
              }
              disabled={isSubmitting}
              data-testid="fo-quick-solve-surface-select"
            >
              <option value="">Select a surface</option>
              {surfaces.map((surface) => (
                <option key={surface.id} value={surface.id}>
                  {surface.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Problem</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              value={value.problemId}
              onChange={(event) =>
                onChange({
                  ...value,
                  problemId: event.target.value,
                })
              }
              disabled={isSubmitting}
              data-testid="fo-quick-solve-problem-select"
            >
              <option value="">Select a problem</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-800">Severity</span>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map((option) => {
                const active = value.severity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={
                      option.value === "light"
                        ? "fo-quick-solve-severity-light"
                        : option.value === "medium"
                          ? "fo-quick-solve-severity-medium"
                          : "fo-quick-solve-severity-heavy"
                    }
                    onClick={() =>
                      onChange({
                        ...value,
                        severity: option.value,
                      })
                    }
                    disabled={isSubmitting}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          data-testid="fo-quick-solve-submit"
        >
          {isSubmitting ? "Loading recommendation..." : "Run Quick Solve"}
        </button>
      </div>
    </div>
  );
}
