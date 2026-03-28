import type { SystemTestIncidentFixTrack } from "@servelink/system-test-intelligence";

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
