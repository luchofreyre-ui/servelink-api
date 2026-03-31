// reviewBootstrap.ts

import type { ReviewablePage } from "./renderTypes";

export function withDefaultReviewStatus(
  pages: Omit<ReviewablePage, "reviewStatus">[]
): ReviewablePage[] {
  return pages.map((page) => ({
    ...page,
    reviewStatus: "draft",
  }));
}
