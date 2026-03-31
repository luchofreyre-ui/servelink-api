import type { SystemTestFixRecommendation } from "@/types/systemTestResolution";
import { SystemTestsCopyResolutionButton } from "./SystemTestsCopyResolutionButton";

interface SystemTestsFixRecommendationsPanelProps {
  recommendations: SystemTestFixRecommendation[];
}

export function SystemTestsFixRecommendationsPanel({
  recommendations,
}: SystemTestsFixRecommendationsPanelProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="system-tests-fix-recommendations-panel"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Fix recommendations
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Suggested next actions
          </h2>
        </div>
      </div>

      {recommendations.length ? (
        <div className="space-y-5">
          {recommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.familyId}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              data-testid="system-tests-fix-recommendation-card"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {recommendation.title}
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
                    {recommendation.explanation}
                  </p>
                </div>

                <SystemTestsCopyResolutionButton recommendation={recommendation} />
              </div>

              <div className="space-y-3">
                {recommendation.actions.map((action, actionIndex) => (
                  <div
                    key={`${recommendation.familyId}-${index}-${actionIndex}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                    data-testid="system-tests-fix-action"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {action.type.replace(/_/g, " ")}
                      </span>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {action.file}
                      </code>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Instruction
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                          {action.instruction}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reason
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {action.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No fix recommendations were generated for this family.</p>
      )}
    </section>
  );
}
