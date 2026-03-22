/**
 * Aligned to backend DispatchConfigPayload and related DTOs.
 */
export type DispatchConfigStatus = "draft" | "active" | "archived";

export type DispatchConfigRecord = {
  id: string;
  version: number;
  status: DispatchConfigStatus;
  label: string | null;

  acceptancePenaltyWeight: string;
  completionPenaltyWeight: string;
  cancellationPenaltyWeight: string;
  loadPenaltyWeight: string;
  reliabilityBonusWeight: string;
  responseSpeedWeight: string;

  offerExpiryMinutes: number;
  assignedStartGraceMinutes: number;
  multiPassPenaltyStep: string;

  enableResponseSpeedWeighting: boolean;
  enableReliabilityWeighting: boolean;
  allowReofferAfterExpiry: boolean;

  configJson: unknown;
  createdByAdminUserId: string | null;
  publishedByAdminUserId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDraftDispatchConfigPayload = {
  label?: string | null;

  acceptancePenaltyWeight?: string | number;
  completionPenaltyWeight?: string | number;
  cancellationPenaltyWeight?: string | number;
  loadPenaltyWeight?: string | number;
  reliabilityBonusWeight?: string | number;
  responseSpeedWeight?: string | number;

  offerExpiryMinutes?: number;
  assignedStartGraceMinutes?: number;
  multiPassPenaltyStep?: string | number;

  enableResponseSpeedWeighting?: boolean;
  enableReliabilityWeighting?: boolean;
  allowReofferAfterExpiry?: boolean;

  updatedByAdminUserId?: string | null;
};

export type DispatchConfigDiffCategory =
  | "weight"
  | "timing"
  | "behavior"
  | "json";
export type DispatchConfigChangeType = "added" | "removed" | "modified";
export type DispatchConfigImpactLevel = "low" | "medium" | "high";

export type DispatchConfigDiffItem = {
  field: string;
  category: DispatchConfigDiffCategory;
  before: unknown;
  after: unknown;
  changeType: DispatchConfigChangeType;
  impactLevel: DispatchConfigImpactLevel;
  message: string;
};

export type DispatchConfigCompareSummary = {
  changeCount: number;
  highImpactChangeCount: number;
};

export type DispatchConfigCompareResponse = {
  hasActive: boolean;
  hasChanges: boolean;
  summary: DispatchConfigCompareSummary;
  draft: { id: string; label: string | null; version: number; status: string };
  active: {
    id: string;
    label: string | null;
    version: number;
    status: string;
  } | null;
  diffs: DispatchConfigDiffItem[];
};

export type DispatchConfigPublishPreviewResponse = {
  canPublish: boolean;
  hasChanges: boolean;
  changeCount: number;
  highImpactChangeCount: number;
  warnings: string[];
  highlights: string[];
  publishSummary: string;
  diffs: DispatchConfigDiffItem[];
};

export type DispatchConfigPublishAuditPayload = {
  id: string;
  dispatchConfigId: string;
  fromVersion: number | null;
  toVersion: number;
  publishedByAdminUserId: string | null;
  publishedAt: string;
  diffSnapshot: DispatchConfigDiffItem[];
  warningsSnapshot: string[];
  highlightsSnapshot: string[];
  publishSummary: string;
};

export type DispatchConfigPublishHistoryResponse = {
  items: DispatchConfigPublishAuditPayload[];
  nextCursor: string | null;
};
