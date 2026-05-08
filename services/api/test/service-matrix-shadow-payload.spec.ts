import {
  buildServiceMatrixShadowPayload,
  type BuildServiceMatrixShadowPayloadInput,
  type ServiceMatrixShadowSourceSurface,
} from "../src/modules/service-matrix";

const summaries = () =>
  ({
    durationInputSummary: {
      laborMinutes: 200,
      recommendedTeamSize: 2,
      source: "booking_derived" as const,
    },
    capacityInputSummary: {
      maxDailyLaborMinutes: 480,
      committedLaborMinutesToday: 120,
      committedInputStatus: "present" as const,
    },
    geographyInputSummary: {
      siteLatPresent: true,
      siteLngPresent: true,
      foHomeLatLngPresent: true,
      maxTravelMinutes: 60,
    },
    safeRedactions: ["street", "customerEmail"] as const,
  }) satisfies Pick<
    BuildServiceMatrixShadowPayloadInput,
    | "durationInputSummary"
    | "capacityInputSummary"
    | "geographyInputSummary"
    | "safeRedactions"
  >;

const FORBIDDEN_SHAPE_KEYS = new Set([
  "customerName",
  "customerEmail",
  "email",
  "phone",
  "streetAddress",
  "address",
  "paymentMethod",
  "cardLast4",
  "fullEstimatePayload",
]);

function collectObjectKeys(value: unknown, out: Set<string>): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value as object)) {
      out.add(k);
      collectObjectKeys((value as Record<string, unknown>)[k], out);
    }
  }
}

describe("buildServiceMatrixShadowPayload", () => {
  const baseInput = (
    overrides: Partial<BuildServiceMatrixShadowPayloadInput> = {},
  ): BuildServiceMatrixShadowPayloadInput => ({
    requestId: "req-1",
    sourceSurface: "public_booking",
    evaluatedAt: "2026-05-08T12:00:00.000Z",
    jobContextHash: "hash:redacted-context-v1",
    legacyCandidateIds: ["fo_c", "fo_a"],
    matrixCandidateIds: ["fo_b", "fo_a"],
    perCandidate: {
      fo_a: { legacyEligible: true, matrixEligible: true },
      fo_b: { legacyEligible: false, matrixEligible: true },
      fo_c: { legacyEligible: true, matrixEligible: false },
    },
    ...summaries(),
    ...overrides,
  });

  it("computes addedByMatrix and removedByMatrix deterministically", () => {
    const p = buildServiceMatrixShadowPayload(baseInput());
    expect(p.addedByMatrix).toEqual(["fo_b"]);
    expect(p.removedByMatrix).toEqual(["fo_c"]);
    const again = buildServiceMatrixShadowPayload(baseInput());
    expect(again.addedByMatrix).toEqual(p.addedByMatrix);
    expect(again.removedByMatrix).toEqual(p.removedByMatrix);
  });

  it("sorts candidate ID arrays stably", () => {
    const p = buildServiceMatrixShadowPayload(baseInput());
    expect(p.legacyCandidateIds).toEqual(["fo_a", "fo_c"]);
    expect(p.matrixCandidateIds).toEqual(["fo_a", "fo_b"]);
  });

  it("produces decisionDiffs when legacy vs matrix eligibility differ", () => {
    const p = buildServiceMatrixShadowPayload(baseInput());
    const byId = new Map(p.decisionDiffs.map((d) => [d.foId, d]));
    expect(byId.get("fo_b")).toEqual({
      foId: "fo_b",
      legacyEligible: false,
      matrixEligible: true,
    });
    expect(byId.get("fo_c")).toEqual({
      foId: "fo_c",
      legacyEligible: true,
      matrixEligible: false,
    });
    expect(byId.has("fo_a")).toBe(false);
  });

  it("produces reasonCodeDiffs when primary reason code sets differ", () => {
    const p = buildServiceMatrixShadowPayload(
      baseInput({
        legacyCandidateIds: ["fo_x"],
        matrixCandidateIds: ["fo_x"],
        perCandidate: {
          fo_x: {
            legacyEligible: false,
            matrixEligible: false,
            legacyPrimaryReasonCodes: ["TRAVEL_EXCEEDS_MAX", "CAP"],
            matrixPrimaryReasonCodes: ["CAP", "TRAVEL_EXCEEDS_MAX"],
          },
        },
      }),
    );
    expect(p.reasonCodeDiffs).toHaveLength(0);
    const p2 = buildServiceMatrixShadowPayload(
      baseInput({
        legacyCandidateIds: ["fo_x"],
        matrixCandidateIds: ["fo_x"],
        perCandidate: {
          fo_x: {
            legacyEligible: false,
            matrixEligible: false,
            legacyPrimaryReasonCodes: ["A"],
            matrixPrimaryReasonCodes: ["B"],
          },
        },
      }),
    );
    expect(p2.reasonCodeDiffs).toEqual([
      {
        foId: "fo_x",
        legacyPrimaryReasonCodes: ["A"],
        matrixPrimaryReasonCodes: ["B"],
      },
    ]);
  });

  it("preserves duration/capacity/geography summaries (copied)", () => {
    const input = baseInput();
    const p = buildServiceMatrixShadowPayload(input);
    expect(p.durationInputSummary).toEqual(input.durationInputSummary);
    expect(p.capacityInputSummary).toEqual(input.capacityInputSummary);
    expect(p.geographyInputSummary).toEqual(input.geographyInputSummary);
    p.durationInputSummary.laborMinutes = 999;
    expect(input.durationInputSummary.laborMinutes).toBe(200);
  });

  it("preserves safeRedactions without sharing array reference with input", () => {
    const input = baseInput();
    const p = buildServiceMatrixShadowPayload(input);
    expect(p.safeRedactions).toEqual(["street", "customerEmail"]);
    expect(p.safeRedactions).not.toBe(input.safeRedactions);
    expect(input.safeRedactions).toEqual(["street", "customerEmail"]);
  });

  it("does not mutate input object", () => {
    const input = baseInput({
      legacyCandidateIds: ["z", "a"],
      matrixCandidateIds: ["b", "a"],
    });
    const snap = JSON.stringify(input);
    buildServiceMatrixShadowPayload(input);
    expect(JSON.stringify(input)).toBe(snap);
  });

  it("does not include forbidden PII-shaped keys in serialized payload", () => {
    const p = buildServiceMatrixShadowPayload(baseInput());
    const keys = new Set<string>();
    collectObjectKeys(p, keys);
    for (const bad of FORBIDDEN_SHAPE_KEYS) {
      expect(keys.has(bad)).toBe(false);
    }
  });

  it("uses supplied evaluatedAt verbatim", () => {
    const ts = "2024-01-02T03:04:05.006Z";
    const p = buildServiceMatrixShadowPayload(baseInput({ evaluatedAt: ts }));
    expect(p.evaluatedAt).toBe(ts);
  });

  it("builds payload for each allowed sourceSurface", () => {
    const surfaces: ServiceMatrixShadowSourceSurface[] = [
      "public_booking",
      "dispatch",
      "slots",
      "admin_explain",
    ];
    for (const sourceSurface of surfaces) {
      const p = buildServiceMatrixShadowPayload(
        baseInput({ sourceSurface, legacyCandidateIds: [], matrixCandidateIds: [], perCandidate: {} }),
      );
      expect(p.sourceSurface).toBe(sourceSurface);
    }
  });
});
