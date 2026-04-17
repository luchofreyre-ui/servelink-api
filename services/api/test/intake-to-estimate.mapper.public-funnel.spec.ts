import type { BookingDirectionIntake } from "@prisma/client";
import {
  mapIntakeFieldsToEstimateInput,
  mapIntakeToEstimateInput,
} from "../src/modules/booking-direction-intake/intake-to-estimate.mapper";
import { DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS } from "../src/modules/booking-direction-intake/estimate-factors-sanitize";

describe("public funnel estimate factors (preview + persisted intake)", () => {
  const baseFields = {
    homeSize: "2200 sq ft",
    bedrooms: "2",
    bathrooms: "2",
    serviceId: "recurring-home-cleaning",
    frequency: "Weekly",
    deepCleanProgram: null as string | null,
  };

  it("mapIntakeFieldsToEstimateInput does not throw when estimateFactors is omitted (public /book preview)", () => {
    const input = mapIntakeFieldsToEstimateInput({
      ...baseFields,
      estimateFactors: undefined,
    });
    expect(input.bedrooms).toBe("2");
    expect(input.bathrooms).toBe("2");
    expect(input.property_type).toBe("house");
    expect(input.first_time_with_servelink).toBe(
      DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS.firstTimeWithServelink,
    );
  });

  it("mapIntakeToEstimateInput uses defaults when persisted estimateFactors is null", () => {
    const intake = {
      id: "int_1",
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      deepCleanProgram: null,
      estimateFactors: null,
      customerName: "Test",
      customerEmail: "t@example.com",
      source: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
    } as unknown as BookingDirectionIntake;

    const input = mapIntakeToEstimateInput(intake);
    expect(input.sqft_band).toBeDefined();
    expect(input.addons).toEqual([]);
  });
});
