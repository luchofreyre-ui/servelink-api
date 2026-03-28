import type {
  SystemTestArtifactRef,
  SystemTestCaseRowInput,
  SystemTestRichEvidence,
} from "./types";

export function emptyRichEvidence(): SystemTestRichEvidence {
  return {
    assertionType: null,
    expectedText: null,
    receivedText: null,
    timeoutMs: null,
    locator: null,
    selector: null,
    routeUrl: null,
    actionName: null,
    stepName: null,
    testStepPath: [],
    errorCode: null,
    primaryArtifactPath: null,
    primaryArtifactType: null,
  };
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Best-effort structured parse from error message + stack (deterministic, conservative).
 */
export function parseRichEvidenceFromCase(
  c: SystemTestCaseRowInput,
): SystemTestRichEvidence {
  const base = emptyRichEvidence();
  const msg = [c.errorMessage, c.errorStack].filter(Boolean).join("\n");
  const text = msg.slice(0, 12_000);

  if (c.route?.trim()) base.routeUrl = c.route.trim();
  if (c.selector?.trim()) base.selector = c.selector.trim();

  const timeoutM = text.match(/Timed out\s+(\d+)\s*ms/i);
  if (timeoutM) {
    const n = parseInt(timeoutM[1]!, 10);
    if (Number.isFinite(n)) base.timeoutMs = n;
  }
  const timeoutAlt = text.match(/timeout[:\s]+(\d+)\s*ms/i);
  if (!base.timeoutMs && timeoutAlt) {
    const n = parseInt(timeoutAlt[1]!, 10);
    if (Number.isFinite(n)) base.timeoutMs = n;
  }

  const locM = text.match(/locator\s*\(\s*([^)]+)\s*\)/i);
  if (locM?.[1]) base.locator = truncate(locM[1]!, 400);

  const expM = text.match(/Expected(?:\s+value)?:\s*([^\n]+)/i);
  if (expM?.[1]) base.expectedText = truncate(expM[1]!, 500);

  const recM = text.match(/Received(?:\s+value)?:\s*([^\n]+)/i);
  if (recM?.[1]) base.receivedText = truncate(recM[1]!, 500);

  const expectCall = text.match(
    /\.(toHaveText|toBeVisible|toHaveURL|toHaveCount|toContainText|toBeHidden|toBeEnabled|toBeDisabled)\s*\(/i,
  );
  if (expectCall?.[1]) base.assertionType = expectCall[1]!;

  if (!base.assertionType) {
    const errExpect = text.match(
      /Error:\s*expect\s*\([^)]*\)\.(toHaveText|toBeVisible|toHaveURL|toHaveCount|toContainText)/i,
    );
    if (errExpect?.[1]) base.assertionType = errExpect[1]!;
  }

  const codeM = text.match(/\b(E[A-Z][A-Z0-9_]{2,40})\b/);
  if (codeM && codeM[1]!.startsWith("E")) base.errorCode = codeM[1]!.slice(0, 64);

  const urlM = text.match(/(https?:\/\/[^\s"'<>[\]]{6,200})/i);
  if (urlM && !base.routeUrl) base.routeUrl = truncate(urlM[1]!, 300);

  const stepHints: string[] = [];
  const stepLine = text.match(/(?:at step|Step)\s*[:\s]+\s*([^\n]+)/i);
  if (stepLine?.[1]) base.stepName = truncate(stepLine[1]!, 200);

  const actionM = text.match(
    /\b(click|fill|press|navigate|goto|type|selectOption|check|uncheck)\s*\(/i,
  );
  if (actionM?.[1]) base.actionName = actionM[1]!.toLowerCase();

  const breadcrumb = text.match(/(?:›|>)\s*([^\n]+)/g);
  if (breadcrumb) {
    for (const b of breadcrumb.slice(0, 8)) {
      const cleaned = b.replace(/^[›>]\s*/, "").trim();
      if (cleaned.length > 2 && cleaned.length < 200) stepHints.push(cleaned);
    }
  }
  if (stepHints.length) {
    base.testStepPath = [...new Set(stepHints)].slice(0, 12);
  }

  return base;
}

function pickFirst<T>(
  a: T | null | undefined,
  b: T | null | undefined,
): T | null {
  if (a !== null && a !== undefined && a !== "") {
    if (typeof a === "string" && !a.trim()) return (b ?? null) as T | null;
    return a as T;
  }
  return (b ?? null) as T | null;
}

function mergeScalar(
  a: string | null,
  b: string | null,
): string | null {
  return pickFirst(a, b);
}

/**
 * Merge rich evidence from group members (first non-empty wins per field; union step paths).
 */
export function mergeRichEvidenceForGroup(
  members: SystemTestCaseRowInput[],
): SystemTestRichEvidence {
  let acc = emptyRichEvidence();
  const paths = new Set<string>();

  for (const m of members) {
    const p = parseRichEvidenceFromCase(m);
    acc = {
      assertionType: mergeScalar(acc.assertionType, p.assertionType),
      expectedText: mergeScalar(acc.expectedText, p.expectedText),
      receivedText: mergeScalar(acc.receivedText, p.receivedText),
      timeoutMs: acc.timeoutMs ?? p.timeoutMs,
      locator: mergeScalar(acc.locator, p.locator),
      selector: mergeScalar(acc.selector, p.selector),
      routeUrl: mergeScalar(acc.routeUrl, p.routeUrl),
      actionName: mergeScalar(acc.actionName, p.actionName),
      stepName: mergeScalar(acc.stepName, p.stepName),
      testStepPath: [],
      errorCode: mergeScalar(acc.errorCode, p.errorCode),
      primaryArtifactPath: null,
      primaryArtifactType: null,
    };
    for (const s of p.testStepPath) paths.add(s);
  }

  acc.testStepPath = [...paths].sort((a, b) => a.localeCompare(b)).slice(0, 20);
  return acc;
}

export function enrichRichEvidenceWithPrimary(
  rich: SystemTestRichEvidence,
  primary: SystemTestArtifactRef | null,
): SystemTestRichEvidence {
  if (!primary) return rich;
  return {
    ...rich,
    primaryArtifactPath: primary.path,
    primaryArtifactType: primary.type,
  };
}

/**
 * Single-line operator hint for reports / DTO (compact, high signal).
 */
export function buildCompactDebuggingHint(rich: SystemTestRichEvidence): string {
  const parts: string[] = [];
  if (rich.assertionType) parts.push(`Assertion: ${rich.assertionType}`);
  const loc = rich.locator ?? rich.selector;
  if (loc) parts.push(`Locator: ${truncate(loc, 100)}`);
  if (rich.routeUrl) parts.push(`Route: ${truncate(rich.routeUrl, 80)}`);
  if (rich.actionName) parts.push(`Action: ${rich.actionName}`);
  if (rich.expectedText && rich.receivedText) {
    parts.push(
      `Expected vs Received: "${truncate(rich.expectedText, 48)}" vs "${truncate(rich.receivedText, 48)}"`,
    );
  } else if (rich.expectedText) {
    parts.push(`Expected: "${truncate(rich.expectedText, 60)}"`);
  }
  if (rich.primaryArtifactType && rich.primaryArtifactPath) {
    const name = rich.primaryArtifactPath.split(/[/\\]/).pop() ?? rich.primaryArtifactPath;
    parts.push(`Primary ${rich.primaryArtifactType}: ${truncate(name, 80)}`);
  }
  if (rich.timeoutMs != null) parts.push(`Timeout: ${rich.timeoutMs}ms`);
  return parts.length ? parts.join(" · ") : "";
}
