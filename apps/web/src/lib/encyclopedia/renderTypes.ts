// renderTypes.ts

import type { EvidenceItem } from "./evidenceTypes";
import type { CleaningRationale } from "./rationaleTypes";
import type { PageQualityScore } from "./pageQualityTypes";
import type { PublishFailureReason } from "./publishPolicyTypes";
import type { EditorialOverrideMode } from "./editorialOverrideTypes";

export type RenderableSection = {
  key: string;
  title: string;
  content: string;
};

export type RenderablePage = {
  title: string;
  slug: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  sections: RenderableSection[];
  internalLinks: string[];
  advancedNotes?: string;
  evidence?: EvidenceItem[];
  rationale?: CleaningRationale;
  qualityScore?: PageQualityScore;
};

export type ReviewStatus = "draft" | "reviewed" | "approved" | "rejected";

export type ReviewablePage = RenderablePage & {
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  approvedAt?: string;
  publishPolicyPassed?: boolean;
  publishFailureReasons?: PublishFailureReason[];
  editorialOverrideMode?: EditorialOverrideMode;
  editorialOverrideNote?: string;
  repairCompletionStatus?: "open" | "completed";
  repairCompletionNote?: string | null;
  editorialNotesCount?: number;
  openRewriteCount?: number;
  completedRewriteCount?: number;
  attachedEvidenceCount?: number;
  editorialNotes?: Array<{
    id: string;
    note: string;
    createdAt: string;
    updatedAt: string;
  }>;
  rewriteTasks?: Array<{
    id: string;
    section: string;
    sectionKey?: string;
    reason: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  }>;
  repairHistory?: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
  attachedEvidence?: Array<{
    id: string;
  }>;
  rewriteDrafts?: Array<{
    id: string;
    taskId: string;
    sectionKey: string;
    draftText: string;
    createdAt: string;
    updatedAt: string;
  }>;
  openRewriteDraftCount?: number;
  rewriteApplications?: Array<{
    id: string;
    taskId: string;
    sectionKey: string;
    appliedText: string;
    appliedAt: string;
  }>;
  rewriteApplicationCount?: number;
  repairReadiness?: "not_ready" | "ready";
  repairReadinessReasons?: string[];
};
