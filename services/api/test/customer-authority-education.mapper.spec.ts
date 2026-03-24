import { BookingAuthorityReviewStatus } from "@prisma/client";
import { buildCustomerAuthorityEducationalContext } from "../src/modules/authority/customer-authority-education.mapper";

describe("buildCustomerAuthorityEducationalContext", () => {
  it("returns null when no tags map to the bundled snapshot", () => {
    expect(
      buildCustomerAuthorityEducationalContext({
        surfaces: ["not-in-snapshot"],
        problems: ["unknown-problem"],
        methods: ["unknown-method"],
        authorityTagSource: "derived",
      }),
    ).toBeNull();
  });

  it("returns shaped context with capped lists and education note", () => {
    const ctx = buildCustomerAuthorityEducationalContext({
      surfaces: ["tile", "tile"],
      problems: ["grease-buildup"],
      methods: ["degreasing"],
      authorityTagSource: "persisted",
    });
    expect(ctx).not.toBeNull();
    expect(ctx!.authorityTagSource).toBe("persisted");
    expect(ctx!.mayFocusOn).toEqual([{ tag: "tile", label: "Tile" }]);
    expect(ctx!.relatedIssues).toEqual([
      { tag: "grease-buildup", label: "Grease Buildup" },
    ]);
    expect(ctx!.careMethods).toEqual([
      { tag: "degreasing", label: "Degreasing" },
    ]);
    expect(ctx!.educationNote).toContain("informational");
    expect(ctx!.authorityReviewStatus).toBeUndefined();
    expect(ctx!.authorityConfidence).toBe("based_on_booking_details");
  });

  it("sets based_on_booking_details for persisted auto", () => {
    const ctx = buildCustomerAuthorityEducationalContext({
      surfaces: ["tile"],
      problems: [],
      methods: [],
      authorityTagSource: "persisted",
      authorityReviewStatus: BookingAuthorityReviewStatus.auto,
    });
    expect(ctx!.authorityConfidence).toBe("based_on_booking_details");
  });

  it("includes authorityReviewStatus only for persisted source", () => {
    const reviewed = buildCustomerAuthorityEducationalContext({
      surfaces: ["tile"],
      problems: [],
      methods: [],
      authorityTagSource: "persisted",
      authorityReviewStatus: BookingAuthorityReviewStatus.reviewed,
    });
    expect(reviewed!.authorityReviewStatus).toBe(
      BookingAuthorityReviewStatus.reviewed,
    );
    expect(reviewed!.authorityConfidence).toBe("reviewed_for_booking");

    const derived = buildCustomerAuthorityEducationalContext({
      surfaces: ["tile"],
      problems: [],
      methods: [],
      authorityTagSource: "derived",
      authorityReviewStatus: BookingAuthorityReviewStatus.reviewed,
    });
    expect(derived!.authorityReviewStatus).toBeUndefined();
    expect(derived!.authorityConfidence).toBe("based_on_booking_details");
  });
});
