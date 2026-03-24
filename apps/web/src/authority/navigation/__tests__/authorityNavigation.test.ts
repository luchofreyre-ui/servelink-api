import { describe, expect, it } from "vitest";
import {
  buildGuideBreadcrumbs,
  buildMethodBreadcrumbs,
  buildProblemBreadcrumbs,
  buildSurfaceBreadcrumbs,
} from "@/authority/navigation/authorityNavigation";

describe("authorityNavigation", () => {
  it("builds method breadcrumbs", () => {
    const items = buildMethodBreadcrumbs("degreasing");
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.href).toBe("/encyclopedia");
  });

  it("builds surface breadcrumbs", () => {
    const items = buildSurfaceBreadcrumbs("tile");
    expect(items.length).toBeGreaterThan(0);
  });

  it("builds problem breadcrumbs", () => {
    const items = buildProblemBreadcrumbs("soap-scum");
    expect(items.length).toBeGreaterThan(0);
  });

  it("builds guide breadcrumbs", () => {
    const items = buildGuideBreadcrumbs("why-cleaning-fails");
    expect(items.length).toBeGreaterThan(0);
  });
});
