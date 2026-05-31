import { getAuthorityDensityBridge } from "@/authority/data/authorityDensityBridgeSelectors";
import { getAuthorityDensityPresentation } from "@/authority/data/authorityDensityPresentationSelectors";

type AuthorityDensityBridgeSummaryProps = {
  surfaceSlug: string;
  problemSlug: string;
};

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

  const presentation = getAuthorityDensityPresentation(bridge);
  const actionLabels = presentation.actionLabels.slice(0, 3);

  return (
    <div
      aria-label="Authority density summary"
      className="mt-2 space-y-1 text-xs leading-5 text-[#64748B]"
    >
      <div className="font-medium text-[#475569]">
        {presentation.riskLabel} <span aria-hidden="true">·</span> {presentation.confidenceLabel}
      </div>
      {actionLabels.length ? (
        <div>{actionLabels.join(" · ")}</div>
      ) : null}
    </div>
  );
}
