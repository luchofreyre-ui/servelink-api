import { evaluateFoExecutionReadiness } from "../src/modules/fo/fo-execution-readiness";

describe("evaluateFoExecutionReadiness", () => {
  it("passes when provider is linked to the same user", () => {
    const r = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: "u1",
      providerId: "prov_1",
      providerUserId: "u1",
    });
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("fails when providerId is missing", () => {
    const r = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: "u1",
      providerId: null,
      providerUserId: null,
    });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_MISSING_PROVIDER_LINK");
  });

  it("fails when provider row is missing", () => {
    const r = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: "u1",
      providerId: "prov_1",
      providerUserId: null,
    });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_INVALID_PROVIDER_LINK");
  });

  it("fails when provider user does not match FO user", () => {
    const r = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: "u1",
      providerId: "prov_1",
      providerUserId: "u_other",
    });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_INVALID_PROVIDER_LINK");
  });
});
