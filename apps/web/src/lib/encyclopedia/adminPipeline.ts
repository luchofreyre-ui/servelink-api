// adminPipeline.ts

import { generatePages } from "./generateCandidates";
import { toRenderablePage } from "./renderAdapter";
import { applyReviewState, type ReviewStoreRecord } from "./reviewStore";
import { withDefaultReviewStatus } from "./reviewBootstrap";
import { evaluatePublishPolicy } from "./publishPolicy";
import type { ReviewablePage } from "./renderTypes";

export function buildAdminReviewPages(
  reviewRecords: ReviewStoreRecord[] = []
): ReviewablePage[] {
  const generated = generatePages();
  const renderable = generated.map(toRenderablePage);
  const reviewable = withDefaultReviewStatus(renderable);
  const merged = applyReviewState(reviewable, reviewRecords);

  return merged.map((page) => {
    const evaluation = evaluatePublishPolicy(page);

    return {
      ...page,
      publishPolicyPassed: evaluation.passed,
      publishFailureReasons: evaluation.reasons,
    };
  });
}
