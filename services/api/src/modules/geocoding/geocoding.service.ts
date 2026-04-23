import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ServiceLocationParts } from "./canonical-service-address";
import {
  buildCanonicalServiceAddress,
  isCompleteServiceLocation,
} from "./canonical-service-address";
import { tryResolveMatrixFixtureGeocode } from "./matrix-fixture-geocode.lookup";

export class GeocodingNotFoundError extends Error {
  readonly code = "SERVICE_LOCATION_NOT_RESOLVABLE" as const;

  constructor(message: string) {
    super(message);
    this.name = "GeocodingNotFoundError";
  }
}

type NominatimResult = { lat?: string; lon?: string };

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Resolves coordinates for a complete service address using OpenStreetMap Nominatim.
   * Requires a descriptive User-Agent per Nominatim usage policy.
   * For production scale, prefer a commercial geocoder via env (future extension).
   */
  async geocodeServiceLocation(
    parts: ServiceLocationParts,
  ): Promise<{ siteLat: number; siteLng: number }> {
    if (!isCompleteServiceLocation(parts)) {
      throw new GeocodingNotFoundError(
        "Address is incomplete; we could not look up coordinates.",
      );
    }

    if (
      this.config.get<string>("SERVELINK_GEOCODE_MATRIX_FIXTURE_LOOKUP")?.trim() ===
      "true"
    ) {
      const hit = tryResolveMatrixFixtureGeocode(parts);
      if (hit) return hit;
    }

    const query = buildCanonicalServiceAddress(parts);
    const ua =
      this.config.get<string>("GEOCODING_USER_AGENT")?.trim() ||
      "ServelinkPublicBooking/1.0 (+https://servelink.example/contact)";

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query,
    )}`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12_000);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": ua,
        },
        signal: ac.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      this.logger.warn(`Nominatim fetch failed: ${String(err)}`);
      throw new GeocodingNotFoundError(
        "We could not verify this address with our location service. Check the street, city, state, and ZIP, then try again.",
      );
    }
    clearTimeout(timer);

    if (!res.ok) {
      this.logger.warn(`Nominatim HTTP ${res.status}`);
      throw new GeocodingNotFoundError(
        "We could not verify this address right now. Please try again in a moment.",
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new GeocodingNotFoundError(
        "We could not read the location response. Please try again.",
      );
    }

    if (!Array.isArray(json) || json.length === 0) {
      throw new GeocodingNotFoundError(
        "We could not match this address to a location. Please check spelling and ZIP, then try again.",
      );
    }

    const first = json[0] as NominatimResult;
    const lat = Number.parseFloat(String(first.lat ?? ""));
    const lng = Number.parseFloat(String(first.lon ?? ""));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new GeocodingNotFoundError(
        "We could not read coordinates for this address. Please try a small adjustment to the address.",
      );
    }

    return { siteLat: lat, siteLng: lng };
  }
}
