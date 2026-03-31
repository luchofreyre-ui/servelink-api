import { describe, expect, it } from "vitest";

import { resolveEvidence } from "./evidenceResolver";

describe("resolveEvidence", () => {
  it("resolves shower grout + hard water stains via aliases to grout + hard water film", () => {
    const r = resolveEvidence("shower grout", "hard water stains");
    expect(r).not.toBeNull();
    expect(r?.surface).toBe("grout");
    expect(r?.problem).toBe("hard water film");
  });

  it("resolves quartz countertops + water spots via natural stone + hard water film", () => {
    const r = resolveEvidence("quartz countertops", "water spots");
    expect(r).not.toBeNull();
    expect(r?.surface).toBe("natural stone");
    expect(r?.problem).toBe("hard water film");
  });

  it("resolves painted cabinets + grease splatter to painted surfaces + grease buildup", () => {
    const r = resolveEvidence("painted cabinets", "grease splatter");
    expect(r).not.toBeNull();
    expect(r?.surface).toBe("painted surfaces");
    expect(r?.problem).toBe("grease buildup");
  });

  it("resolves butcher block + sticky residue to hardwood + sticky residue", () => {
    const r = resolveEvidence("butcher block", "sticky residue");
    expect(r).not.toBeNull();
    expect(r?.surface).toBe("hardwood");
    expect(r?.problem).toBe("sticky residue");
  });

  it("resolves chrome fixtures + mineral haze to stainless steel + hard water film", () => {
    const r = resolveEvidence("chrome fixtures", "mineral haze");
    expect(r).not.toBeNull();
    expect(r?.surface).toBe("stainless steel");
    expect(r?.problem).toBe("hard water film");
  });
});
