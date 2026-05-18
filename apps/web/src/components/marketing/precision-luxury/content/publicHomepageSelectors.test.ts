import { describe, expect, it } from "vitest";
import { getHomepageFeaturedServicesOrdered } from "./publicHomepageSelectors";

describe("publicHomepageSelectors", () => {
  it("includes first-time recurring as a visible public service path", () => {
    const services = getHomepageFeaturedServicesOrdered();
    const firstTimeRecurring = services.find(
      (service) => service.displaySlug === "first-time-clean-with-recurring-services",
    );

    expect(firstTimeRecurring).toMatchObject({
      displayTitle: "First-time clean with recurring services",
      serviceHref: "/services/recurring-home-cleaning",
      bookingHref: "/book?service=recurring-home-cleaning",
      mediaSlug: "recurring-home-cleaning",
    });
    expect(services.map((service) => service.displaySlug)).toEqual([
      "deep-cleaning",
      "first-time-clean-with-recurring-services",
      "recurring-home-cleaning",
      "move-in-move-out",
    ]);
  });
});
