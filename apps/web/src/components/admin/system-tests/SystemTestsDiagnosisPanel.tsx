import { formatDiagnosisConfidence, getDiagnosisCategoryLabel, getDiagnosisToneClasses, sortDiagnosisSignals } from "@/lib/systemTests/resolution";
import type { SystemTestDiagnosis } from "@/types/systemTestResolution";

interface SystemTestsDiagnosisPanelProps {
  diagnosis: SystemTestDiagnosis;
}

export function SystemTestsDiagnosisPanel({
  diagnosis,
}: SystemTestsDiagnosisPanelProps) {
  const toneClasses = getDiagnosisToneClasses(diagnosis.category);
  const signals = sortDiagnosisSignals(diagnosis);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="system-tests-diagnosis-panel"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Diagnosis
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {getDiagnosisCategoryLabel(diagnosis.category)}
          </h2>
        </div>

        <div
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${toneClasses}`}
          data-testid="system-tests-diagnosis-badge"
        >
          {formatDiagnosisConfidence(diagnosis.confidence)} confidence
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Root cause</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {diagnosis.rootCause}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Summary</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {diagnosis.summary}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Matched signals</p>

          {signals.length ? (
            <div className="mt-3 space-y-3">
              {signals.map((signal, index) => (
                <div
                  key={`${signal.code}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  data-testid="system-tests-diagnosis-signal"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{signal.label}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {signal.code}
                    </span>
                  </div>

                  {signal.matchedText ? (
                    <p className="mt-2 break-words text-xs leading-5 text-slate-600">
                      {signal.matchedText}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No signals were captured for this diagnosis.</p>
          )}
        </div>
      </div>
    </section>
  );
}
