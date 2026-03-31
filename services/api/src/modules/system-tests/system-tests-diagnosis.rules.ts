import type { SystemTestDiagnosisCategory } from "./dto/system-test-resolution.dto";

export interface SystemTestsDiagnosisRule {
  id: string;
  category: SystemTestDiagnosisCategory;
  label: string;
  rootCause: string;
  summary: string;
  confidence: number;
  patterns: RegExp[];
}

export const SYSTEM_TESTS_DIAGNOSIS_RULES: SystemTestsDiagnosisRule[] = [
  {
    id: "environment-connection-refused",
    category: "environment_unavailable",
    label: "Connection refused",
    rootCause: "The target application was not reachable on the expected local origin during test execution.",
    summary:
      "Playwright could not connect to the app origin. This usually means the web server was not running, crashed during the suite, or was bound to the wrong port.",
    confidence: 0.99,
    patterns: [/ERR_CONNECTION_REFUSED/i, /net::ERR_CONNECTION_REFUSED/i, /ECONNREFUSED/i],
  },
  {
    id: "auth-unauthorized",
    category: "auth_state",
    label: "Unauthorized or forbidden",
    rootCause: "The authenticated state required by the test was missing, expired, or rejected by the app/API.",
    summary:
      "The run indicates an auth/session failure rather than a UI selector issue. Validate token setup, auth bootstrap helpers, and dev auth scenario endpoints.",
    confidence: 0.95,
    patterns: [/401\b/i, /403\b/i, /unauthorized/i, /forbidden/i, /authentication required/i],
  },
  {
    id: "selector-drift",
    category: "selector_drift",
    label: "Selector not found",
    rootCause: "The UI locator used by the test no longer matches the rendered markup.",
    summary:
      "The failure pattern points to selector drift. The safest fix is to add or repair stable role-based selectors or data-testid hooks rather than relaxing the test.",
    confidence: 0.93,
    patterns: [
      /locator.*not found/i,
      /waiting for locator/i,
      /strict mode violation/i,
      /getByRole/i,
      /getByTestId/i,
      /resolved to 0 elements/i,
    ],
  },
  {
    id: "timing-timeout",
    category: "timing_issue",
    label: "Timeout or wait instability",
    rootCause: "The test is waiting for UI or data that does not settle within the expected time window.",
    summary:
      "The run suggests a timing problem, delayed data hydration, or missing ready-state synchronization.",
    confidence: 0.84,
    patterns: [/timeout/i, /timed out/i, /waiting for/i, /expect\(.*\)\.toBeVisible/i],
  },
  {
    id: "api-contract-500",
    category: "api_contract_break",
    label: "API/server failure",
    rootCause: "The UI or test path triggered a backend/API response that no longer matches the expected contract.",
    summary:
      "The signals point to a backend regression, changed response shape, or unhandled exception rather than a pure frontend problem.",
    confidence: 0.88,
    patterns: [/500\b/i, /Internal Server Error/i, /Bad Gateway/i, /fetch failed/i],
  },
  {
    id: "data-dependency-missing",
    category: "data_dependency",
    label: "Missing scenario or seeded data",
    rootCause: "The route loaded, but expected fixtures, scenario records, or seed-dependent entities were missing.",
    summary:
      "This failure likely depends on local scenario generation, test data seeding, or required entity relationships not being present.",
    confidence: 0.82,
    patterns: [/not found/i, /missing/i, /no rows/i, /empty state/i, /scenario/i],
  },
  {
    id: "navigation-url-mismatch",
    category: "navigation_issue",
    label: "Navigation mismatch",
    rootCause: "The app navigated to an unexpected route or failed to resolve the intended destination.",
    summary:
      "The failure pattern suggests a routing or redirect problem. Check route paths, guards, redirects, and app-shell mounting.",
    confidence: 0.83,
    patterns: [/toHaveURL/i, /redirect/i, /navigation/i, /did not navigate/i],
  },
  {
    id: "ui-regression-generic",
    category: "ui_regression",
    label: "Generic UI regression",
    rootCause: "The page rendered but key UI content expected by the test was missing or changed.",
    summary:
      "This looks like a frontend regression in rendered content, conditional sections, or component composition.",
    confidence: 0.72,
    patterns: [/toContainText/i, /toBeVisible/i, /heading/i, /text/i],
  },
];
