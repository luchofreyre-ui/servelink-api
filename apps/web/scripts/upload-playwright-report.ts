/**
 * Upload Playwright JSON reporter output to POST /api/v1/admin/system-tests/report
 *
 * Usage:
 *   npm run upload:playwright -- --file=path/to/report.json
 *
 * Saving Playwright JSON: the runner typically wipes `test-results/` at start, so
 * `tee test-results/system-tests/report.json` can fail (missing directory). Write to
 * a temp path first, then `mkdir -p test-results/system-tests && mv ...`.
 *
 * Env:
 *   SYSTEM_TESTS_ADMIN_TOKEN — Bearer JWT (admin) [required]
 *   NEXT_PUBLIC_API_BASE_URL — API base (default http://localhost:3001)
 *   PLAYWRIGHT_UPLOAD_SOURCE — source string (default playwright-json)
 *   PLAYWRIGHT_LANE — optional lane slug (e.g. fast, deep, full-suite, custom-abc12345); appended to `source` as `|lane=…` for triage
 *   PLAYWRIGHT_LANE_LABEL — optional human label (logged only)
 *   GIT_BRANCH / GITHUB_REF_NAME — optional branch
 *   GITHUB_SHA / COMMIT_SHA — optional commit
 */

import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

type Json = Record<string, unknown>;

function classifySuiteFromFilePath(filePath: string): string {
  const p = filePath.replace(/\\/g, "/").toLowerCase();
  if (p.includes("/public-search") || p.includes("/search/") || p.includes("public-search")) {
    return "search";
  }
  if (
    p.includes("knowledge") ||
    p.includes("encyclopedia") ||
    p.includes("quick-solve") ||
    p.includes("quick_solve")
  ) {
    return "knowledge";
  }
  if (p.includes("/admin/") || p.includes("/regression/admin/")) {
    return "admin";
  }
  if (p.includes("/customer/") || p.includes("/regression/customer/")) {
    return "customer";
  }
  if (p.includes("/fo/") || p.includes("/regression/fo/")) {
    return "fo";
  }
  if (p.includes("/public/") || p.includes("/regression/public/")) {
    return "public";
  }
  return "unknown";
}

function normalizeFilePath(relativeFromReport: string): string {
  const f = relativeFromReport.replace(/\\/g, "/");
  if (f.startsWith("apps/web/")) {
    return f;
  }
  if (f.startsWith("tests/")) {
    return path.posix.join("apps/web", f);
  }
  return f;
}

function extractRoute(message: string | undefined, stack: string | undefined): string | null {
  const text = `${message ?? ""}\n${stack ?? ""}`;
  const m =
    text.match(/\.goto\s*\(\s*["']([^"']+)["']\s*\)/i) ||
    text.match(/goto\s*\(\s*["']([^"']+)["']\s*\)/i);
  return m ? m[1] : null;
}

function extractSelector(message: string | undefined, stack: string | undefined): string | null {
  const text = `${message ?? ""}\n${stack ?? ""}`;
  const loc =
    text.match(/\.locator\s*\(\s*[`'"]([^`'"]+)[`'"]\s*\)/i) ||
    text.match(/getByRole\s*\(\s*[`'"]([^`'"]+)[`'"]\s*,/i) ||
    text.match(/getByText\s*\(\s*([/`'"][^)\n]+)/i);
  return loc ? loc[1].trim() : null;
}

function artifactJsonFromAttachments(
  attachments: Array<{ name?: string; contentType?: string; path?: string }> | undefined,
): Record<string, unknown> | null {
  if (!attachments?.length) {
    return null;
  }
  let trace: string | null = null;
  let video: string | null = null;
  let screenshot: string | null = null;

  for (const a of attachments) {
    const p = a.path;
    if (!p) {
      continue;
    }
    const n = (a.name ?? "").toLowerCase();
    const ct = (a.contentType ?? "").toLowerCase();
    if (n === "trace" || p.endsWith(".zip")) {
      trace = p;
    } else if (ct.startsWith("video/") || n === "video") {
      video = p;
    } else if (ct === "image/png" || n.includes("screenshot")) {
      screenshot = p;
    }
  }

  if (!trace && !video && !screenshot) {
    return null;
  }
  return { trace, video, screenshot };
}

type CaseOut = {
  filePath: string;
  title: string;
  fullName: string;
  suite: string;
  status: string;
  retryCount: number;
  durationMs: number;
  errorMessage: string | null;
  errorStack: string | null;
  expectedStatus: string | null;
  line: number | null;
  column: number | null;
  route: string | null;
  selector: string | null;
  artifactJson: Record<string, unknown> | null;
  rawCaseJson: Json;
};

function mapResultStatusToApi(status: string | undefined): string {
  if (!status) {
    return "failed";
  }
  const s = status.toLowerCase();
  if (s === "passed" || s === "skipped" || s === "failed" || s === "timedout" || s === "interrupted") {
    return s === "timedout" ? "timedOut" : s;
  }
  return status;
}

function walkSuite(suite: Json, titleParts: string[], out: CaseOut[]) {
  const nextTitles = suite.title ? [...titleParts, String(suite.title)] : titleParts;

  const specs = (suite.specs as Json[] | undefined) ?? [];
  for (const spec of specs) {
    const specTitle = String(spec.title ?? "");
    const fileRel = String(spec.file ?? suite.file ?? "");
    const filePath = normalizeFilePath(fileRel);
    const line = typeof spec.line === "number" ? spec.line : typeof suite.line === "number" ? suite.line : null;
    const column =
      typeof spec.column === "number" ? spec.column : typeof suite.column === "number" ? suite.column : null;

    const tests = (spec.tests as Json[] | undefined) ?? [];
    for (const test of tests) {
      const projectName = String(test.projectName ?? "");
      const results = (test.results as Json[] | undefined) ?? [];
      const last = results.length ? results[results.length - 1] : null;
      const retryCount = Math.max(0, results.length - 1);
      const durationMs = results.reduce((acc, r) => acc + (typeof r.duration === "number" ? r.duration : 0), 0);

      const lastStatus = last ? String(last.status ?? "") : "";
      const apiStatus = mapResultStatusToApi(lastStatus);

      const err = last?.error as { message?: string; stack?: string } | undefined;
      const errorMessage = err?.message ?? null;
      const errorStack = err?.stack ?? null;

      const fullNameParts = [projectName, ...nextTitles, specTitle].filter(Boolean);
      const fullName = fullNameParts.join(" > ");

      const attachments = last?.attachments as
        | Array<{ name?: string; contentType?: string; path?: string }>
        | undefined;

      const rawCaseJson: Json = {
        specTitle,
        specFile: spec.file,
        specLine: spec.line,
        specColumn: spec.column,
        projectName,
        expectedStatus: test.expectedStatus,
        outcome: test.status,
        results: results.map((r) => ({
          status: r.status,
          duration: r.duration,
          retry: r.retry,
        })),
      };

      out.push({
        filePath,
        title: specTitle,
        fullName,
        suite: classifySuiteFromFilePath(filePath),
        status: apiStatus,
        retryCount,
        durationMs,
        errorMessage,
        errorStack,
        expectedStatus: test.expectedStatus != null ? String(test.expectedStatus) : null,
        line,
        column,
        route: extractRoute(errorMessage ?? undefined, errorStack ?? undefined),
        selector: extractSelector(errorMessage ?? undefined, errorStack ?? undefined),
        artifactJson: artifactJsonFromAttachments(attachments),
        rawCaseJson,
      });
    }
  }

  const children = (suite.suites as Json[] | undefined) ?? [];
  for (const child of children) {
    walkSuite(child, nextTitles, out);
  }
}

function parseArgs(argv: string[]): { file: string } {
  let file = "";
  for (const a of argv) {
    if (a.startsWith("--file=")) {
      file = a.slice("--file=".length);
    }
  }
  if (!file.trim()) {
    console.error("Missing --file=path/to/report.json");
    process.exit(1);
  }
  return { file: path.resolve(file.trim()) };
}

function deriveRunFields(stats: Json | undefined, cases: CaseOut[]) {
  if (!stats) {
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;
    for (const c of cases) {
      const s = c.status.toLowerCase();
      if (s === "skipped") {
        skipped += 1;
      } else if (s === "failed" || s === "timedout" || s === "interrupted") {
        failed += 1;
      } else {
        passed += 1;
        if (c.retryCount > 0) {
          flaky += 1;
        }
      }
    }
    const totalCount = cases.length;
    let status: string;
    if (failed > 0) {
      status = "failed";
    } else if (flaky > 0) {
      status = "partial";
    } else {
      status = "passed";
    }
    return {
      status,
      totalCount,
      passedCount: passed,
      failedCount: failed,
      skippedCount: skipped,
      flakyCount: flaky,
    };
  }
  const expected = typeof stats.expected === "number" ? stats.expected : 0;
  const unexpected = typeof stats.unexpected === "number" ? stats.unexpected : 0;
  const skipped = typeof stats.skipped === "number" ? stats.skipped : 0;
  const flaky = typeof stats.flaky === "number" ? stats.flaky : 0;
  const totalCount = expected + unexpected + skipped + flaky;
  const passedCount = expected + flaky;
  const failedCount = unexpected;

  let status: string;
  if (unexpected > 0) {
    status = "failed";
  } else if (flaky > 0) {
    status = "partial";
  } else {
    status = "passed";
  }

  return { status, totalCount, passedCount, failedCount, skippedCount: skipped, flakyCount: flaky };
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(file)) {
    console.error(`Report file not found: ${file}`);
    process.exit(1);
  }

  const token = process.env.SYSTEM_TESTS_ADMIN_TOKEN || "";
  const tokenHash = createHash("sha256").update(token).digest("hex").slice(0, 12);

  const uploadBase = process.env.PLAYWRIGHT_UPLOAD_SOURCE?.trim() || "playwright-json";
  const laneSlug = process.env.PLAYWRIGHT_LANE?.trim();
  const laneLabel = process.env.PLAYWRIGHT_LANE_LABEL?.trim();
  const source = laneSlug ? `${uploadBase}|lane=${laneSlug}` : uploadBase;

  console.log("UPLOAD DEBUG token exists:", !!token);
  console.log("UPLOAD DEBUG token length:", token.length);
  console.log("UPLOAD DEBUG token sha12:", tokenHash);
  console.log("UPLOAD DEBUG api base:", process.env.NEXT_PUBLIC_API_BASE_URL || "");
  console.log("UPLOAD DEBUG source:", source);
  if (laneLabel) {
    console.log("UPLOAD DEBUG lane label:", laneLabel);
  }

  if (!token) {
    throw new Error("Missing SYSTEM_TESTS_ADMIN_TOKEN in upload script");
  }

  const raw = fs.readFileSync(file, "utf8");
  const report = JSON.parse(raw) as Json;

  const cases: CaseOut[] = [];
  const suites = (report.suites as Json[] | undefined) ?? [];
  for (const s of suites) {
    walkSuite(s, [], cases);
  }

  const stats = report.stats as Json | undefined;
  const summary = deriveRunFields(stats, cases);
  const branch =
    process.env.GIT_BRANCH?.trim() ||
    process.env.GITHUB_REF_NAME?.trim() ||
    process.env.GITHUB_HEAD_REF?.trim() ||
    null;
  const commitSha =
    process.env.GITHUB_SHA?.trim() || process.env.COMMIT_SHA?.trim() || null;

  const durationMs =
    typeof stats?.duration === "number" ? Math.round(stats.duration) : null;

  const body = {
    source,
    branch,
    commitSha,
    status: summary.status,
    durationMs,
    summary: {
      totalCount: summary.totalCount,
      passedCount: summary.passedCount,
      failedCount: summary.failedCount,
      skippedCount: summary.skippedCount,
      flakyCount: summary.flakyCount,
    },
    cases: cases.map((c) => ({
      suite: c.suite,
      filePath: c.filePath,
      title: c.title,
      fullName: c.fullName,
      status: c.status,
      retryCount: c.retryCount,
      durationMs: c.durationMs,
      errorMessage: c.errorMessage,
      errorStack: c.errorStack,
      expectedStatus: c.expectedStatus,
      line: c.line,
      column: c.column,
      route: c.route,
      selector: c.selector,
      artifactJson: c.artifactJson,
      rawCaseJson: c.rawCaseJson,
    })),
    rawReportJson: report as Record<string, unknown>,
  };

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const url = `${base}/api/v1/admin/system-tests/report`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Upload failed ${res.status}: ${text}`);
    process.exit(1);
  }

  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
