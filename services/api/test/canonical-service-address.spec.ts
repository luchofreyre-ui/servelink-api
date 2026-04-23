import {
  buildCanonicalServiceAddress,
  isCompleteServiceLocation,
} from "../src/modules/geocoding/canonical-service-address";

describe("canonical-service-address", () => {
  it("buildCanonicalServiceAddress joins unit when present", () => {
    expect(
      buildCanonicalServiceAddress({
        street: "100 Market St",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
        unit: "Apt 4",
      }),
    ).toBe("100 Market St, Apt 4, San Francisco, CA 94103");
  });

  it("buildCanonicalServiceAddress omits empty unit", () => {
    expect(
      buildCanonicalServiceAddress({
        street: "100 Market St",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
      }),
    ).toBe("100 Market St, San Francisco, CA 94103");
  });

  it("isCompleteServiceLocation validates minimum lengths", () => {
    expect(
      isCompleteServiceLocation({
        street: "100 Market St",
        city: "SF",
        state: "CA",
        zip: "94103",
      }),
    ).toBe(true);
    expect(isCompleteServiceLocation({ street: "ab", city: "SF", state: "CA", zip: "94103" })).toBe(
      false,
    );
    expect(
      isCompleteServiceLocation({ street: "100 Main", city: "S", state: "CA", zip: "94103" }),
    ).toBe(false);
  });
});
