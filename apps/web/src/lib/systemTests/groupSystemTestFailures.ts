// TEMP: disable system-test-intelligence dependency for production build
import type { SystemTestCaseResult, SystemTestFailureGroup } from "@/types/systemTests";

export function groupSystemTestFailures(_cases: SystemTestCaseResult[]): SystemTestFailureGroup[] {
  return [];
}
