// autoFailTypes.ts

import type { PublishFailureReason } from "./publishPolicyTypes";

export type AutoFailDecision = {
  shouldAutoFail: boolean;
  reviewStatus: "rejected" | "draft";
  reasons: PublishFailureReason[];
  reviewNotes: string;
};
