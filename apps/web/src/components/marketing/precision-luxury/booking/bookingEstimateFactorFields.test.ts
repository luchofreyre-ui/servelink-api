import { describe, expect, it } from "vitest";
import {
  formatBookingBathroomsForDisplay,
  formatBookingBedroomsForDisplay,
  normalizeBookingBathroomsParam,
  normalizeBookingBedroomsParam,
} from "./bookingEstimateFactorFields";

describe("normalizeBookingBedroomsParam", () => {
  it("passes through API tokens", () => {
    expect(normalizeBookingBedroomsParam("5_plus")).toBe("5_plus");
    expect(normalizeBookingBedroomsParam("2")).toBe("2");
  });

  it("maps legacy human labels", () => {
    expect(normalizeBookingBedroomsParam("2 bedrooms")).toBe("2");
    expect(normalizeBookingBedroomsParam("5+ bedrooms")).toBe("5_plus");
  });

  it("returns empty for blank or unknown", () => {
    expect(normalizeBookingBedroomsParam("")).toBe("");
    expect(normalizeBookingBedroomsParam("  ")).toBe("");
    expect(normalizeBookingBedroomsParam("garbage")).toBe("");
  });
});

describe("normalizeBookingBathroomsParam", () => {
  it("passes through API tokens", () => {
    expect(normalizeBookingBathroomsParam("1_5")).toBe("1_5");
    expect(normalizeBookingBathroomsParam("4_plus")).toBe("4_plus");
  });

  it("maps legacy human labels", () => {
    expect(normalizeBookingBathroomsParam("2 bathrooms")).toBe("2");
    expect(normalizeBookingBathroomsParam("4+ bathrooms")).toBe("4_plus");
  });
});

describe("display formatters", () => {
  it("formats known tokens for review UI", () => {
    expect(formatBookingBedroomsForDisplay("2")).toBe("2 bedrooms");
    expect(formatBookingBathroomsForDisplay("1_5")).toBe("1.5 bathrooms");
  });
});
