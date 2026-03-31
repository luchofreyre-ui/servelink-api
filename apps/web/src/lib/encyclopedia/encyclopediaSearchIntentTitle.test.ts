import { describe, expect, it } from "vitest";

import {
  classifyEncyclopediaSearchIntentTitle,
  isEncyclopediaSearchIntentPromotableTitle,
} from "./encyclopediaSearchIntentTitle";

describe("classifyEncyclopediaSearchIntentTitle", () => {
  it("tags Why/What/How openers as search_intent", () => {
    expect(classifyEncyclopediaSearchIntentTitle("Why does grease build up on cabinets").kind).toBe("search_intent");
    expect(classifyEncyclopediaSearchIntentTitle("What causes streaks on glass after cleaning").kind).toBe(
      "search_intent",
    );
    expect(classifyEncyclopediaSearchIntentTitle("How to remove soap scum from shower doors").kind).toBe(
      "search_intent",
    );
  });

  it("allows How … on … (intent prefix wins)", () => {
    expect(classifyEncyclopediaSearchIntentTitle("How to prevent hard water stains on faucets").kind).toBe(
      "search_intent",
    );
  });

  it("flags heavy/light/severe … on … as problem_layer", () => {
    expect(classifyEncyclopediaSearchIntentTitle("Heavy grease on cabinets").kind).toBe("problem_layer");
    expect(classifyEncyclopediaSearchIntentTitle("Light film on glass").kind).toBe("problem_layer");
    expect(classifyEncyclopediaSearchIntentTitle("Severe buildup on grout").kind).toBe("problem_layer");
  });

  it("flags generic phrase-with-on without intent prefix as problem_layer", () => {
    expect(classifyEncyclopediaSearchIntentTitle("Streaks on glass after cleaning").kind).toBe("problem_layer");
  });

  it("marks non-intent titles without on-phrase as ambiguous", () => {
    expect(classifyEncyclopediaSearchIntentTitle("Agitation for Appliances").kind).toBe("ambiguous");
  });

  it("isEncyclopediaSearchIntentPromotableTitle matches search_intent only", () => {
    expect(isEncyclopediaSearchIntentPromotableTitle("How to avoid residue on laminate floors")).toBe(true);
    expect(isEncyclopediaSearchIntentPromotableTitle("Heavy soap scum on shower doors")).toBe(false);
  });
});
