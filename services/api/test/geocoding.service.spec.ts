import { ConfigService } from "@nestjs/config";
import {
  GeocodingNotFoundError,
  GeocodingService,
} from "../src/modules/geocoding/geocoding.service";

describe("GeocodingService", () => {
  const config = new ConfigService();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses Nominatim JSON into siteLat/siteLng", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "36.154", lon: "-95.992" }],
    } as Response);

    const svc = new GeocodingService(config);
    const out = await svc.geocodeServiceLocation({
      street: "1 Main St",
      city: "Tulsa",
      state: "OK",
      zip: "74103",
    });

    expect(out.siteLat).toBeCloseTo(36.154, 5);
    expect(out.siteLng).toBeCloseTo(-95.992, 5);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("throws GeocodingNotFoundError when Nominatim returns empty", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const svc = new GeocodingService(config);
    await expect(
      svc.geocodeServiceLocation({
        street: "999999 Nowhere Lane",
        city: "Nowhere",
        state: "ZZ",
        zip: "00000",
      }),
    ).rejects.toBeInstanceOf(GeocodingNotFoundError);
  });
});
