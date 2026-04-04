import { describe, expect, it } from "vitest";

import { buildProductComparisonPage } from "@/authority/data/authorityComparisonBuilder";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { deriveProblemUseChips } from "@/app/(public)/products/[slug]/productConversionDerives";

describe("funnel cross-page consistency (dust-buildup / Bona)", () => {
  it("ties problem best pick, compare page, and product problem chips", () => {
    const problem = getProblemPageBySlug("dust-buildup");
    const scenario = problem?.productScenarios?.find((s) => (s.products?.length ?? 0) > 0);
    expect(scenario?.products?.[0]?.slug).toBe("bona-hard-surface-floor-cleaner");

    const cmp = buildProductComparisonPage("bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner");
    expect(cmp?.winnerBlock?.product).toBeTruthy();

    const chips = deriveProblemUseChips("bona-hard-surface-floor-cleaner");
    expect(chips.some((c) => c.slug === "dust-buildup")).toBe(true);
  });
});
