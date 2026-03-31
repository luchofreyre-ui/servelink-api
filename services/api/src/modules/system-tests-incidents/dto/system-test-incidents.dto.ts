import type { SystemTestIncidentFixTrack } from "@servelink/system-test-intelligence";

import type { SystemTestFamilyOperatorStateDto } from "../../system-tests/system-test-family-operator-state";
import type { SystemTestFamilyLifecycleDto } from "../../system-tests/system-test-family-lifecycle";
import type { SystemTestResolutionPreviewDto } from "../../system-tests/system-test-resolution-preview";

export type SystemTestIncidentListItemDto = {
  runId: string;
  incidentKey: string;
  incidentVersion: string;
  displayTitle: string;
  rootCauseCategory: string;
  summary: string;
  severity: string;
  status: string;
  trendKind: string;
  leadFamilyId: string | null;
  affectedFamilyCount: number;
  affectedFileCount: number;
  currentRunFailureCount: number;
  lastSeenRunId: string | null;
  firstSeenRunId: string | null;
  updatedAt: string;
  resolutionPreview: SystemTestResolutionPreviewDto | null;
  familyOperatorState: SystemTestFamilyOperatorStateDto | null;
  familyLifecycle: SystemTestFamilyLifecycleDto | null;
  leadFamilyTitle: string | null;
};

export type SystemTestIncidentMemberDto = {
  familyId: string;
  displayTitle: string;
  matchBasis: string;
  role: string;
  familyStatus: string;
  trendKind: string;
};

export type SystemTestIncidentDetailDto = SystemTestIncidentListItemDto & {
  fixTrack: SystemTestIncidentFixTrack;
  metadataJson: unknown;
  members: SystemTestIncidentMemberDto[];
};

/** Compact enrichment on persisted failure groups / reports (Phase 9). */
export type SystemTestIncidentSummaryDto = {
  incidentKey: string;
  displayTitle: string;
  severity: string;
  status: string;
  trendKind: string;
  rootCauseCategory: string;
  leadFamilyId: string | null;
  fixTrackPrimaryArea: SystemTestIncidentFixTrack["primaryArea"];
  fixTrackFirstStep: string;
};
