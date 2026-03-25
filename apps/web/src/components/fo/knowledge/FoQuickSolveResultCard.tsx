import { KnowledgeQuickSolveResult } from "@/types/knowledge";

interface FoQuickSolveResultCardProps {
  result: KnowledgeQuickSolveResult;
}

function renderList(items: string[]) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FoQuickSolveResultCard({ result }: FoQuickSolveResultCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="fo-quick-solve-result">
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {result.surface.label}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {result.problem.label}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {result.input.severity}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{result.scenario.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.scenario.summary}</p>
        </div>

        <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Recommended approach
          </h3>
          <p className="text-base font-semibold text-slate-900">{result.method.label}</p>
          <p className="text-sm leading-6 text-slate-700">{result.method.shortWhyItWorks}</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Tools needed
          </h3>
          <div className="grid gap-3">
            {result.tools.map((tool) => (
              <div key={tool.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{tool.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{tool.purpose}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Chemical guidance
          </h3>
          <div className="grid gap-3">
            {result.chemicals.map((chemical) => (
              <div key={chemical.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{chemical.label}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    {chemical.category}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{chemical.shortWhyItWorks}</p>
                {chemical.safetyNotes.length > 0 ? (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">
                      Safety notes
                    </p>
                    {renderList(chemical.safetyNotes)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Step-by-step
          </h3>
          <ol className="space-y-3">
            {result.scenario.steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-900">
              Warnings
            </h3>
            {renderList(result.scenario.warnings)}
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-900">
              Common mistakes
            </h3>
            {renderList(result.scenario.commonMistakes)}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Escalation guidance
            </h3>
            {renderList(result.scenario.whenToEscalate)}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Estimated time
            </h3>
            <p className="text-sm leading-6 text-slate-700">
              {result.scenario.estimatedMinutesMin}–{result.scenario.estimatedMinutesMax} minutes
            </p>

            {result.scenario.foNotes.length > 0 ? (
              <>
                <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">
                  FO notes
                </h4>
                {renderList(result.scenario.foNotes)}
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
