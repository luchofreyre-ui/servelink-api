import type { SystemTestRichEvidence } from "@servelink/system-test-intelligence";
import { emptyRichEvidence } from "@servelink/system-test-intelligence";

export function parseRichEvidenceFromJson(json: unknown): SystemTestRichEvidence {
  if (json == null || typeof json !== "object" || Array.isArray(json)) {
    return emptyRichEvidence();
  }
  const o = json as Record<string, unknown>;
  const str = (k: string): string | null => {
    const v = o[k];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const num = (k: string): number | null => {
    const v = o[k];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const arr = (k: string): string[] =>
    Array.isArray(o[k])
      ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];

  const pat = str("primaryArtifactType");
  const allowed = new Set([
    "trace",
    "screenshot",
    "video",
    "stdout_log",
    "stderr_log",
    "attachment",
    "html_report_ref",
  ]);

  return {
    assertionType: str("assertionType"),
    expectedText: str("expectedText"),
    receivedText: str("receivedText"),
    timeoutMs: num("timeoutMs"),
    locator: str("locator"),
    selector: str("selector"),
    routeUrl: str("routeUrl"),
    actionName: str("actionName"),
    stepName: str("stepName"),
    testStepPath: arr("testStepPath"),
    errorCode: str("errorCode"),
    primaryArtifactPath: str("primaryArtifactPath"),
    primaryArtifactType:
      pat && allowed.has(pat) ?
        (pat as SystemTestRichEvidence["primaryArtifactType"])
      : null,
  };
}
