import { buildSystemTestResolutionSummary } from "@/lib/systemTests/resolution";
import type { SystemTestResolution } from "@/types/systemTestResolution";
import { SystemTestsDiagnosisPanel } from "./SystemTestsDiagnosisPanel";
import { SystemTestsFixRecommendationsPanel } from "./SystemTestsFixRecommendationsPanel";

interface SystemTestsResolutionWorkspaceProps {
  resolution: SystemTestResolution;
}

export function SystemTestsResolutionWorkspace({
  resolution,
}: SystemTestsResolutionWorkspaceProps) {
  return (
    <section className="space-y-6" data-testid="system-tests-resolution-workspace">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
          Resolution intelligence
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Diagnosis and fix plan
        </h2>
        <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-6 text-slate-200">
          {buildSystemTestResolutionSummary(resolution)}
        </p>
      </div>

      <SystemTestsDiagnosisPanel diagnosis={resolution.diagnosis} />
      <SystemTestsFixRecommendationsPanel recommendations={resolution.recommendations} />
    </section>
  );
}
