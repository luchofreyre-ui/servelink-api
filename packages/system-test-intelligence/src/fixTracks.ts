/** Maps from family/incident signals (Phase 9). */
export type IncidentRootCauseCategory =
  | "ui_selector"
  | "ui_visibility_timeout"
  | "routing_navigation"
  | "api_route_error"
  | "assertion_content_mismatch"
  | "timing_async_state"
  | "auth_session_state"
  | "data_fixture_state"
  | "unknown";

/** Deterministic operator fix track (Phase 9). */
export type SystemTestIncidentFixTrack = {
  primaryArea:
    | "frontend_ui"
    | "backend_api"
    | "auth_state"
    | "test_data"
    | "async_timing"
    | "unknown";
  recommendedSteps: string[];
  validationSteps: string[];
  representativeFiles: string[];
  /** Stable failure-family keys (not display titles). */
  representativeFamilyKeys: string[];
  suggestedOwnerHint: string | null;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Template fix steps from root-cause category + strongest anchors (deterministic).
 */
export function buildIncidentFixTrack(input: {
  category: IncidentRootCauseCategory;
  /** Stable key for the lead family (deterministic copy in templates). */
  leadFamilyKey: string;
  primaryRoute: string | null;
  primaryLocator: string | null;
  primarySelector: string | null;
  primaryErrorCode: string | null;
  representativeFiles: string[];
  memberFamilyKeys: string[];
}): SystemTestIncidentFixTrack {
  const route = input.primaryRoute?.trim() || "the failing route";
  const loc =
    input.primaryLocator?.trim() ||
    input.primarySelector?.trim() ||
    "the target locator";
  const err = input.primaryErrorCode?.trim() || "the error code";
  const leadKey = input.leadFamilyKey.trim().toLowerCase();

  const repFiles = [...new Set(input.representativeFiles.filter(Boolean))]
    .map((f) => f.trim())
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 8);

  const repFam = [...new Set(input.memberFamilyKeys.map((k) => k.trim().toLowerCase()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 6);

  let primaryArea: SystemTestIncidentFixTrack["primaryArea"] = "unknown";
  let recommendedSteps: string[] = [];
  let validationSteps: string[] = [];
  let suggestedOwnerHint: string | null = null;

  switch (input.category) {
    case "ui_selector":
      primaryArea = "frontend_ui";
      suggestedOwnerHint = "Frontend / QA";
      recommendedSteps = [
        `Inspect locator stability and DOM structure for ${clip(loc, 120)}.`,
        `Confirm the preceding step or navigation that should render the target.`,
        `Check for duplicate selectors, shadow DOM, or dynamic attribute changes.`,
      ];
      validationSteps = [
        `Re-run the representative spec locally with trace/video for family key ${clip(leadKey, 80)}.`,
        `Re-run affected specs after selector or component fix.`,
      ];
      break;
    case "ui_visibility_timeout":
      primaryArea = "frontend_ui";
      suggestedOwnerHint = "Frontend / QA";
      recommendedSteps = [
        `Inspect visibility and timeout conditions for ${clip(loc, 120)}.`,
        `Check preceding action/step that should reveal the element before the assertion.`,
        `Review default timeouts vs async data loading on route ${clip(route, 100)}.`,
      ];
      validationSteps = [
        `Validate retry locally with trace/screenshot for the lead failure family.`,
        `Re-run affected specs after UI state or wait strategy fix.`,
      ];
      break;
    case "routing_navigation":
      primaryArea = "frontend_ui";
      suggestedOwnerHint = "Frontend";
      recommendedSteps = [
        `Trace navigation to ${clip(route, 120)} and confirm expected redirects.`,
        `Compare app router config vs test baseURL and entry paths.`,
      ];
      validationSteps = [
        `Re-run navigation-heavy specs; confirm network tab shows expected document requests.`,
      ];
      break;
    case "api_route_error":
      primaryArea = "backend_api";
      suggestedOwnerHint = "Backend";
      recommendedSteps = [
        `Inspect route/service logs for ${clip(route, 120)} (error ${clip(err, 80)}).`,
        `Compare failing run inputs vs last clean run (payload, auth headers, env).`,
      ];
      validationSteps = [
        `Validate response contract used by affected UI assertions.`,
        `Re-run impacted API and E2E tests after service fix.`,
      ];
      break;
    case "assertion_content_mismatch":
      primaryArea = "test_data";
      suggestedOwnerHint = "QA / Product";
      recommendedSteps = [
        `Diff expected vs received text for assertions tied to family key ${clip(leadKey, 100)}.`,
        `Confirm whether the UI copy change is intentional vs fixture drift.`,
      ];
      validationSteps = [
        `Update assertions or fixtures deterministically; re-run the spec file.`,
      ];
      break;
    case "timing_async_state":
      primaryArea = "async_timing";
      suggestedOwnerHint = "Frontend / QA";
      recommendedSteps = [
        `Identify race between async state and assertion on ${clip(route, 100)}.`,
        `Prefer deterministic waits (network/response) over fixed sleeps.`,
      ];
      validationSteps = [
        `Stress-run the flaky spec locally; re-run full suite slice.`,
      ];
      break;
    case "auth_session_state":
      primaryArea = "auth_state";
      suggestedOwnerHint = "Backend / Auth";
      recommendedSteps = [
        `Verify session/cookie and role assumptions for ${clip(route, 100)}.`,
        `Compare auth setup steps vs application auth middleware expectations.`,
      ];
      validationSteps = [
        `Re-run auth setup flow in isolation; then full failing spec.`,
      ];
      break;
    case "data_fixture_state":
      primaryArea = "test_data";
      suggestedOwnerHint = "QA / Backend";
      recommendedSteps = [
        `Check seed data, feature flags, and environment for tests touching ${clip(route, 100)}.`,
        `Compare DB or external stub state between clean and failing runs.`,
      ];
      validationSteps = [
        `Reset fixtures; re-run representative file tests.`,
      ];
      break;
    default:
      primaryArea = "unknown";
      recommendedSteps = [
        `Review lead family key "${clip(leadKey, 100)}" and shared routes/locators across members.`,
        `Use trace/screenshot artifacts from the lead family for fastest reproduction.`,
      ];
      validationSteps = [
        `Re-run failed specs after localized fix; watch for recurrence in next CI run.`,
      ];
  }

  return {
    primaryArea,
    recommendedSteps,
    validationSteps,
    representativeFiles: repFiles,
    representativeFamilyKeys: repFam,
    suggestedOwnerHint,
  };
}
