import { Injectable } from "@nestjs/common";
import { SystemTestsDiagnosisResult, SystemTestsFixRecommendation } from "./system-tests-diagnosis.types";

@Injectable()
export class SystemTestsFixService {
  buildRecommendations(diagnosis: SystemTestsDiagnosisResult): SystemTestsFixRecommendation[] {
    switch (diagnosis.category) {
      case "environment_unavailable":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Restore local app availability before running Playwright",
            explanation:
              "This failure family is environmental. The app origin was unavailable, so test output is not trustworthy until the local runtime is stable.",
            cursorReady: true,
            actions: [
              {
                type: "runbook",
                file: "services/api",
                instruction:
                  "Start the API in Tab 2 with `cd ~/Desktop/servelink/services/api && npm run dev` and confirm it remains alive on http://localhost:3001.",
                reason: "Playwright depends on the API for authenticated scenario flows and admin pages.",
              },
              {
                type: "runbook",
                file: "apps/web",
                instruction:
                  "Start the web app in a separate terminal with `cd ~/Desktop/servelink/apps/web && env -u NEXT_PUBLIC_API_BASE_URL npm run dev` and confirm Next is serving on http://localhost:3000.",
                reason: "The browser could not connect to the expected web origin.",
              },
              {
                type: "config_change",
                file: "apps/web/playwright.config.ts",
                instruction:
                  "Validate that the configured Playwright baseURL matches `http://localhost:3000` and does not point to a stale port or hostname.",
                reason: "A mismatched base URL produces connection-refused failures even if the app is healthy.",
              },
            ],
          },
        ];

      case "selector_drift":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Stabilize selectors using semantic roles or test ids",
            explanation:
              "This looks like selector drift. Fix the rendered markup or test locator with stable semantics instead of weakening waits.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "apps/web/src/components/**",
                instruction:
                  "Add or repair stable `data-testid` hooks only where semantic role/name targeting is insufficient. Prefer `getByRole` compatibility first.",
                reason: "Role-based and explicit test ids reduce brittleness across copy and layout changes.",
              },
              {
                type: "test_update",
                file: "apps/web/tests/playwright/**",
                instruction:
                  "Replace brittle text-only locators with `getByRole(...)` or `getByTestId(...)` aligned to intentional UI contracts.",
                reason: "Tests should validate stable contracts, not incidental text structure.",
              },
            ],
          },
        ];

      case "timing_issue":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Add explicit ready-state synchronization",
            explanation:
              "This looks like an async settle problem. Fix the app or test by waiting on the true ready signal, not with arbitrary sleeps.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "apps/web/src/app/**",
                instruction:
                  "Expose a deterministic loading-complete UI contract for the affected page, such as a visible heading, loaded table, or hydration-ready element.",
                reason: "Tests need a real readiness signal tied to page completion.",
              },
              {
                type: "test_update",
                file: "apps/web/tests/playwright/**",
                instruction:
                  "Wait for the deterministic ready-state element before interacting, instead of clicking immediately after navigation.",
                reason: "This reduces race conditions without hiding real regressions.",
              },
            ],
          },
        ];

      case "auth_state":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Repair auth bootstrap and token/session setup",
            explanation:
              "The failure family points to missing or rejected authenticated state. Fix auth seeding/helpers before debugging downstream UI.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "apps/web/tests/playwright/helpers/auth.ts",
                instruction:
                  "Verify the auth helper writes the correct token/storage shape expected by the app and that the token is applied before navigation.",
                reason: "Most Playwright auth regressions start in helper/bootstrap drift.",
              },
              {
                type: "code_change",
                file: "services/api/src/modules/dev/**",
                instruction:
                  "Confirm the dev scenario endpoint still returns a valid admin/customer/FO token payload compatible with current auth guards.",
                reason: "If token shape or claims changed, every authed route will fail.",
              },
            ],
          },
        ];

      case "api_contract_break":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Repair backend contract or frontend consumer",
            explanation:
              "The UI likely received an unexpected response or server failure. Fix the contract mismatch before changing selectors.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "services/api/src/modules/**",
                instruction:
                  "Trace the affected endpoint response shape and restore compatibility with the web consumer or update both sides together.",
                reason: "Contract drift between API and UI frequently appears as generic page failures.",
              },
              {
                type: "test_update",
                file: "services/api/test/**",
                instruction:
                  "Add or tighten API coverage around the affected response fields so frontend dependencies are locked by tests.",
                reason: "This prevents silent response-shape regressions.",
              },
            ],
          },
        ];

      case "data_dependency":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Repair scenario/fixture prerequisites",
            explanation:
              "The page likely depends on seed or scenario data that is missing or incomplete in local runs.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "services/api/src/modules/dev/**",
                instruction:
                  "Ensure the dev scenario endpoint creates all entities required by the target route, including linked booking/workflow/status records.",
                reason: "Partial scenarios cause UI failures that masquerade as app regressions.",
              },
              {
                type: "test_update",
                file: "apps/web/tests/playwright/**",
                instruction:
                  "Assert scenario payload completeness before navigating to the page under test.",
                reason: "This makes seed/setup failures visible immediately.",
              },
            ],
          },
        ];

      case "navigation_issue":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Repair route path or redirect logic",
            explanation:
              "The app navigated incorrectly or failed to resolve the intended page shell.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "apps/web/src/app/**",
                instruction:
                  "Review the target route, redirect guards, and app-shell wrappers for unexpected redirects or missing page exports.",
                reason: "Navigation mismatches usually come from route ownership or guard logic.",
              },
            ],
          },
        ];

      case "ui_regression":
        return [
          {
            familyId: diagnosis.familyId,
            title: "Restore expected page contract",
            explanation:
              "The page rendered but key UI content was missing or changed. Fix the component contract rather than loosening assertions.",
            cursorReady: true,
            actions: [
              {
                type: "code_change",
                file: "apps/web/src/components/**",
                instruction:
                  "Restore the intended heading, section, or call-to-action required by the page contract, or update the contract deliberately across UI and tests.",
                reason: "UI contract regressions should be intentional and synchronized.",
              },
            ],
          },
        ];

      case "unknown":
      default:
        return [
          {
            familyId: diagnosis.familyId,
            title: "Manual triage required",
            explanation:
              "No fix template matched confidently. Extend the diagnosis rules once this pattern is understood.",
            cursorReady: true,
            actions: [
              {
                type: "runbook",
                file: "services/api/src/modules/system-tests/system-tests-diagnosis.rules.ts",
                instruction:
                  "Review recurring evidence for this family and add a new diagnosis rule plus matching fix template.",
                reason: "Unknown recurring failures should become first-class patterns in the intelligence layer.",
              },
            ],
          },
        ];
    }
  }
}
