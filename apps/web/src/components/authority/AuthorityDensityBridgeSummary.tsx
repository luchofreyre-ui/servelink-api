import { getAuthorityDensityBridge } from "@/authority/data/authorityDensityBridgeSelectors";

type AuthorityDensityBridgeSummaryProps = {
  surfaceSlug: string;
  problemSlug: string;
};

function formatDensityLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuthorityDensityBridgeSummary({
  surfaceSlug,
  problemSlug,
}: AuthorityDensityBridgeSummaryProps) {
  const bridge = getAuthorityDensityBridge({ surfaceSlug, problemSlug });

  if (
    !bridge.canonicalSurfaceSlug ||
    !bridge.canonicalProblemSlug ||
    !bridge.surfaceScience ||
    !bridge.problemScience
  ) {
    return null;
  }

  const workflowStages = bridge.recommendedWorkflowStages.slice(0, 3);

  return (
    <div
      aria-label="Authority density summary"
      className="mt-2 flex flex-wrap gap-2 text-xs leading-5 text-[#64748B]"
    >
      <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5">
        Severity: {formatDensityLabel(bridge.normalizedSeverity)}
      </span>
      <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5">
        Confidence: {formatDensityLabel(bridge.normalizedConfidence)}
      </span>
      {bridge.normalizedEscalation.length ? (
        <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5">
          Escalation: {bridge.normalizedEscalation.map(formatDensityLabel).join(", ")}
        </span>
      ) : null}
      {workflowStages.length ? (
        <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5">
          Workflow: {workflowStages.map(formatDensityLabel).join(", ")}
        </span>
      ) : null}
    </div>
  );
}
