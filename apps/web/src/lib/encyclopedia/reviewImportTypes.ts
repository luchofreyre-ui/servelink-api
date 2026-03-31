import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/canonicalTypes";

export type ReviewImportRecord = {
  slug: string;
  title: string;
  canonicalSnapshot: CanonicalPageSnapshot;
  reviewStatus?: "pending" | "approved" | "rejected";
  publishStatus?: "draft" | "promoted" | "live" | "failed";
};

export type ReviewImportPayload = ReviewImportRecord[];
