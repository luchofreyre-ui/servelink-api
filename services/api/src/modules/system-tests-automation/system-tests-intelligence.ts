/**
 * Re-exports canonical pure logic from @servelink/system-test-intelligence.
 * Server automation compares/triage use the same engine as ingestion.
 */
export type {
  ComparisonResult,
  FailureGroup,
  IntelCase,
  IntelRunSnapshot,
} from "@servelink/system-test-intelligence";
export {
  buildImmediatePriorMaps,
  compareFailureGroups,
  fileFailedDeltaMap,
  fingerprintForCase,
  groupFailures,
  passRateFromSnapshot as passRate,
  rerunScoreForGroup,
  shortMessageFromCase,
  stableFileSharpRegression,
  unstableFilesFromRuns,
} from "@servelink/system-test-intelligence";
