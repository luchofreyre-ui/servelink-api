import type { SystemTestFamilyOperatorStateDto } from "../../system-tests/system-test-family-operator-state";
import type { SystemTestFamilyLifecycleDto } from "../../system-tests/system-test-family-lifecycle";
import type { SystemTestResolutionPreviewDto } from "../../system-tests/system-test-resolution-preview";

export type SystemTestFamilyListItemDto = {
  id: string;
  familyKey: string;
  displayTitle: string;
  status: string;
  trendKind: string;
  lastSeenRunId: string | null;
  firstSeenRunId: string | null;
  affectedRunCount: number;
  affectedFileCount: number;
  totalOccurrencesAcrossRuns: number;
  recurrenceLine: string | null;
  primaryAssertionType: string | null;
  primaryLocator: string | null;
  primaryRouteUrl: string | null;
  updatedAt: string;
  resolutionPreview: SystemTestResolutionPreviewDto | null;
  operatorState: SystemTestFamilyOperatorStateDto;
  lifecycle: SystemTestFamilyLifecycleDto;
};

export type SystemTestFamilyMembershipItemDto = {
  runId: string;
  failureGroupId: string;
  canonicalKey: string;
  matchBasis: string;
  file: string;
  title: string;
  shortMessage: string;
  occurrences: number;
  createdAt: string;
};

/** Phase 9 — incident that includes this family (if any). */
export type SystemTestFamilyIncidentStubDto = {
  incidentKey: string;
  displayTitle: string;
  severity: string;
  status: string;
  role: string;
};

export type SystemTestFamilyDetailDto = {
  id: string;
  familyKey: string;
  familyVersion: string;
  familyKind: string;
  displayTitle: string;
  rootCauseSummary: string;
  primaryAssertionType: string | null;
  primaryLocator: string | null;
  primarySelector: string | null;
  primaryRouteUrl: string | null;
  primaryActionName: string | null;
  primaryErrorCode: string | null;
  firstSeenRunId: string | null;
  lastSeenRunId: string | null;
  totalOccurrencesAcrossRuns: number;
  affectedRunCount: number;
  affectedFileCount: number;
  status: string;
  trendKind: string;
  recurrenceLine: string | null;
  metadataJson: unknown;
  createdAt: string;
  updatedAt: string;
  memberships: SystemTestFamilyMembershipItemDto[];
  incident: SystemTestFamilyIncidentStubDto | null;
  operatorState: SystemTestFamilyOperatorStateDto;
  lifecycle: SystemTestFamilyLifecycleDto;
};
