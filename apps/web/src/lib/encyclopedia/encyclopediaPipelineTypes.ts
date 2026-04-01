// encyclopediaPipelineTypes.ts — canonical generate → review → promote model

export type EncyclopediaPromotionStatus = "not_promoted" | "promoted" | "failed";

export type EncyclopediaContentOrigin = "generated" | "imported" | "manual";

/** Machine-owned snapshot persisted on the canonical review record. */
export type CanonicalPageSnapshot = {
  title: string;
  slug: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  sections: Array<{ key: string; title: string; content: string }>;
  advancedNotes?: string;
  internalLinks?: string[];
  seo?: {
    title: string;
    slug: string;
    metaDescription: string;
  };
};

export type IngestGeneratedBatchOptions = {
  sourceBatchId?: string;
  sourceArtifactPath?: string;
  /** ISO timestamp; defaults to now */
  generatedAt?: string;
};

export type IngestGeneratedBatchResult = {
  ingestedSlugs: string[];
  skippedSlugs: string[];
};

export type PromoteApprovedOptions = {
  /** When set, only these slugs are considered (must still pass guards). */
  slugs?: string[];
};

export type PromoteApprovedPageResult =
  | { slug: string; status: "promoted" }
  | { slug: string; status: "skipped"; reason: string }
  | { slug: string; status: "failed"; error: string };

export type PromoteApprovedBatchResult = {
  results: PromoteApprovedPageResult[];
};

/** Single live row in the promoted corpus file (adapter output). */
export type LiveEncyclopediaPageRecord = {
  slug: string;
  title: string;
  promotedAt: string;
  contentHash: string;
  snapshot: CanonicalPageSnapshot;
};

export type LiveEncyclopediaStoreFile = {
  records: LiveEncyclopediaPageRecord[];
};
