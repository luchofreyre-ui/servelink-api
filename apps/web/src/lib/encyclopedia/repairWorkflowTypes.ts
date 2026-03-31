// repairWorkflowTypes.ts

import type { PageRemediationPlan } from "./remediationTypes";
import type { EvidenceEnrichmentResult } from "./evidenceEnrichmentTypes";
import type { ReviewablePage } from "./renderTypes";

type EditorialNotesPayload = NonNullable<ReviewablePage["editorialNotes"]>;
type RewriteTasksPayload = NonNullable<ReviewablePage["rewriteTasks"]>;
type RepairHistoryPayload = NonNullable<ReviewablePage["repairHistory"]>;
type AttachedEvidencePayload = NonNullable<ReviewablePage["attachedEvidence"]>;
type RewriteDraftsPayload = NonNullable<ReviewablePage["rewriteDrafts"]>;
type RewriteApplicationsPayload = NonNullable<
  ReviewablePage["rewriteApplications"]
>;

export type WeakPageRepairRecord = {
  slug: string;
  title: string;
  reviewStatus: string;
  riskLevel: "low" | "medium" | "high";
  qualityOverall: number;
  publishPolicyPassed: boolean;
  publishFailureReasons: string[];
  remediationPlan: PageRemediationPlan;
  evidenceEnrichment: EvidenceEnrichmentResult;
  editorialNotes: EditorialNotesPayload;
  rewriteTasks: RewriteTasksPayload;
  repairHistory: RepairHistoryPayload;
  attachedEvidence: AttachedEvidencePayload;
  rewriteDrafts: RewriteDraftsPayload;
  openRewriteDraftCount: number;
  rewriteApplications: RewriteApplicationsPayload;
  rewriteApplicationCount: number;
  editorialNotesCount: number;
  openRewriteCount: number;
  completedRewriteCount: number;
  attachedEvidenceCount: number;
  repairCompletionStatus: "open" | "completed";
  repairCompletionNote: string | null;
  editorialOverrideMode?: ReviewablePage["editorialOverrideMode"];
  editorialOverrideNote?: ReviewablePage["editorialOverrideNote"];
  repairReadiness: NonNullable<ReviewablePage["repairReadiness"]>;
  repairReadinessReasons: string[];
};
