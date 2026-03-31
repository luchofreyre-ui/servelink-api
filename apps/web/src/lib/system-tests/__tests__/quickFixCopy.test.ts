import { describe, expect, it } from "vitest";

import type { SystemTestFamilyListItemApi } from "@/lib/api/systemTestFamilies";
import type { SystemTestIncidentListItemApi } from "@/lib/api/systemTestIncidents";
import type { SystemTestFixOpportunity, SystemTestResolutionPreview } from "@/types/systemTestResolution";
import type { SystemTestsTopProblemItem } from "@/types/systemTests";
import {
  buildFamilyQuickFixText,
  buildFixOpportunityQuickFixText,
  buildIncidentQuickFixText,
  buildTopIssueQuickFixText,
} from "../quickFixCopy";

type FamilyQuickFixInput = Pick<
  SystemTestFamilyListItemApi,
  "id" | "displayTitle" | "resolutionPreview" | "operatorState" | "lifecycle"
>;

type IncidentQuickFixInput = Pick<
  SystemTestIncidentListItemApi,
  | "displayTitle"
  | "leadFamilyId"
  | "resolutionPreview"
  | "leadFamilyTitle"
  | "familyLifecycle"
  | "familyOperatorState"
>;

const samplePreview: SystemTestResolutionPreview = {
  hasResolution: true,
  category: "timing_issue",
  confidence: 0.85,
  confidenceLabel: "High confidence",
  topRecommendationSummary: "Increase wait after navigation.",
  recommendationCount: 1,
  diagnosisSummary: "Flaky due to async render.",
  highestPriority: "high",
};

const sampleLifecycle = {
  firstSeenAt: null,
  lastSeenAt: null,
  seenInRunCount: 2,
  recentRunCountConsidered: 10,
  seenInLatestRun: true,
  seenInPreviousRun: true,
  consecutiveRunCount: 2,
  runsSinceLastSeen: 0,
  lifecycleState: "recurring" as const,
};

const sampleOp = {
  state: "open" as const,
  updatedAt: null as string | null,
  updatedByUserId: null as string | null,
  note: null as string | null,
};

describe("quickFixCopy", () => {
  describe("buildFamilyQuickFixText", () => {
    it("includes lifecycle, operator state, and open detail link", () => {
      const family: FamilyQuickFixInput = {
        id: "fam_abc",
        displayTitle: "Login form cluster",
        resolutionPreview: samplePreview,
        operatorState: sampleOp,
        lifecycle: sampleLifecycle,
      };
      const text = buildFamilyQuickFixText(family);
      expect(text).toContain("SYSTEM TEST QUICK FIX");
      expect(text).toContain("Family: Login form cluster");
      expect(text).toContain("Category: timing issue");
      expect(text).toContain("Confidence: High confidence");
      expect(text).toContain("Lifecycle: Recurring");
      expect(text).toContain("Operator state: Open");
      expect(text).toContain("Top recommendation:");
      expect(text).toContain("Increase wait after navigation.");
      expect(text).toContain("Why this is likely:");
      expect(text).toContain("Flaky due to async render.");
      expect(text).toContain("Open detail:");
      expect(text).toContain("/admin/system-tests/families/fam_abc");
    });

    it("falls back when preview is missing", () => {
      const family: FamilyQuickFixInput = {
        id: "fam_x",
        displayTitle: "Bare family",
        resolutionPreview: null,
        operatorState: sampleOp,
        lifecycle: { ...sampleLifecycle, lifecycleState: "new" },
      };
      const text = buildFamilyQuickFixText(family);
      expect(text).toContain("Category: Unknown");
      expect(text).toContain("Confidence: Unspecified");
      expect(text).toContain("Lifecycle: New");
      expect(text).toContain("No recommendation available.");
      expect(text).toContain("No diagnosis summary available.");
    });
  });

  describe("buildIncidentQuickFixText", () => {
    it("includes linked family title and lifecycle / operator lines", () => {
      const incident: IncidentQuickFixInput = {
        displayTitle: "Checkout outage",
        leadFamilyId: "fam_lead",
        resolutionPreview: samplePreview,
        leadFamilyTitle: "Lead family title",
        familyLifecycle: sampleLifecycle,
        familyOperatorState: { ...sampleOp, state: "acknowledged" },
      };
      const text = buildIncidentQuickFixText(incident);
      expect(text).toContain("Incident: Checkout outage");
      expect(text).toContain("Linked family: Lead family title");
      expect(text).toContain("Lifecycle: Recurring");
      expect(text).toContain("Operator state: Acknowledged");
      expect(text).toContain("Open detail:");
      expect(text).toContain("/admin/system-tests/families/fam_lead");
    });

    it("uses Unknown family and Unspecified lifecycle without lead family context", () => {
      const incident: IncidentQuickFixInput = {
        displayTitle: "Orphan incident",
        leadFamilyId: null,
        resolutionPreview: null,
        leadFamilyTitle: null,
        familyLifecycle: null,
        familyOperatorState: null,
      };
      const text = buildIncidentQuickFixText(incident);
      expect(text).toContain("Linked family: Unknown");
      expect(text).toContain("Lifecycle: Unspecified");
      expect(text).toContain("Operator state: Unspecified");
      expect(text).toContain("No family detail link available.");
    });
  });

  describe("buildFixOpportunityQuickFixText", () => {
    const item: SystemTestFixOpportunity = {
      familyId: "fam_opp",
      familyKey: "k",
      title: "API 500 burst",
      category: "server_error",
      confidence: 0.7,
      confidenceLabel: "Medium confidence",
      topRecommendationSummary: "Retry with backoff.",
      failureCount: 3,
      affectedRunCount: 1,
      highestPriority: "medium",
      operatorState: sampleOp,
      lifecycle: sampleLifecycle,
    };

    it("includes lifecycle and operator state", () => {
      const text = buildFixOpportunityQuickFixText(item);
      expect(text).toContain("Family: API 500 burst");
      expect(text).toContain("Category: server error");
      expect(text).toContain("Confidence: Medium confidence");
      expect(text).toContain("Lifecycle: Recurring");
      expect(text).toContain("Operator state: Open");
      expect(text).toContain("/admin/system-tests/families/fam_opp");
    });

    it("uses diagnosis summary for why when preview is supplied", () => {
      const preview: SystemTestResolutionPreview = {
        hasResolution: true,
        category: "server_error",
        confidence: 0.7,
        confidenceLabel: "Medium confidence",
        topRecommendationSummary: "From preview top.",
        recommendationCount: 1,
        diagnosisSummary: "Upstream dependency timing out.",
        highestPriority: "medium",
      };
      const text = buildFixOpportunityQuickFixText(item, preview);
      expect(text).toContain("From preview top.");
      expect(text).toMatch(/Why this is likely:\nUpstream dependency timing out\./);
    });
  });

  describe("buildTopIssueQuickFixText", () => {
    it("formats family-backed top issue", () => {
      const item: SystemTestsTopProblemItem = {
        title: "Pattern title",
        type: "pattern",
        severity: "high",
        impactScore: 1000,
        summary: "Summary line",
        familyId: "fam_t",
        familyTitle: "Family display",
        resolutionPreview: samplePreview,
        operatorState: sampleOp,
        lifecycle: sampleLifecycle,
      };
      const text = buildTopIssueQuickFixText(item);
      expect(text).toContain("Family: Family display");
      expect(text).toContain("Lifecycle: Recurring");
      expect(text).toContain("Operator state: Open");
      expect(text).toContain("/admin/system-tests/families/fam_t");
    });
  });
});
