import { describe, expect, it } from "vitest";
import { getAllServiceSlugs, getServiceBySlug } from "./publicContentSelectors";
import { getHomepageFeaturedServicesOrdered } from "./publicHomepageSelectors";

describe("publicHomepageSelectors", () => {
  it("includes first-time recurring as a dedicated public service path", () => {
    const services = getHomepageFeaturedServicesOrdered();
    const firstTimeRecurring = services.find(
      (service) => service.displaySlug === "first-time-clean-with-recurring-services",
    );

    expect(firstTimeRecurring).toMatchObject({
      displayTitle: "First-time clean with recurring services",
      serviceHref: "/services/first-time-clean-with-recurring-services",
      bookingHref: "/book?service=recurring-home-cleaning",
      mediaSlug: "first-time-clean-with-recurring-services",
    });
    expect(services.map((service) => service.displaySlug)).toEqual([
      "deep-cleaning",
      "first-time-clean-with-recurring-services",
      "recurring-home-cleaning",
      "move-in-move-out",
    ]);
  });

  it("exposes first-time recurring as a service detail route", () => {
    const service = getServiceBySlug("first-time-clean-with-recurring-services");

    expect(getAllServiceSlugs()).toContain("first-time-clean-with-recurring-services");
    expect(service).toMatchObject({
      slug: "first-time-clean-with-recurring-services",
      bookingServiceSlug: "recurring-home-cleaning",
      serviceBadge: "Best first step for upkeep",
    });
  });
});
