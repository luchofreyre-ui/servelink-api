export type AmazonPasteRow = {
  name: string;
  slug?: string;
  asin?: string;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  brand?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  buyLabel?: string;
  isPurchaseAvailable?: boolean;
};

export type AmazonPasteNormalizedRecord = {
  inputName: string;
  resolvedSlug: string | null;
  suggestedSlugs: string[];
  asin?: string;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  brand?: string;
  primaryImageUrl?: string;
  imageUrls: string[];
  buyLabel?: string;
  isPurchaseAvailable: boolean;
};

export type AmazonPasteDuplicateIssue = {
  type: "duplicate_slug" | "duplicate_asin";
  key: string;
  rows: AmazonPasteNormalizedRecord[];
};

export type AmazonPasteConflictIssue = {
  type:
    | "existing_slug_conflict"
    | "existing_asin_conflict"
    | "existing_url_conflict";
  key: string;
  incoming: AmazonPasteNormalizedRecord;
  existingSlug: string;
};

export type AmazonPasteMergeHint = {
  slug: string;
  action: "add" | "merge" | "replace_review";
  reasons: string[];
};

export type AmazonPasteNormalizationResult = {
  matched: AmazonPasteNormalizedRecord[];
  unmatched: AmazonPasteNormalizedRecord[];
  duplicates: AmazonPasteDuplicateIssue[];
  conflicts: AmazonPasteConflictIssue[];
  mergeHints: AmazonPasteMergeHint[];
};
