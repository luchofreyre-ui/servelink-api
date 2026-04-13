import type { BookingDirectionIntake } from "@prisma/client";
import type {
  Addon,
  Bathrooms,
  Bedrooms,
  EstimateInput,
  Floors,
  PropertyType,
  ServiceType,
  SqftBand,
} from "../estimate/estimator.service";

const DEFAULT_SQFT = 1400;

/** First integer found in a string (e.g. "2,200 sq ft" → 2200). */
export function extractSqftFromHomeSize(raw: string): number {
  const s = String(raw ?? "").replace(/,/g, "");
  const m = s.match(/(\d{3,5})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(20000, n);
  }
  const any = s.match(/(\d+)/);
  if (any) {
    const n = parseInt(any[1], 10);
    if (Number.isFinite(n) && n > 0) {
      if (n < 300) return DEFAULT_SQFT;
      return Math.min(20000, n);
    }
  }
  return DEFAULT_SQFT;
}

export function sqftToBand(sqft: number): SqftBand {
  const x = Math.max(0, Math.floor(sqft));
  if (x <= 799) return "0_799";
  if (x <= 1199) return "800_1199";
  if (x <= 1599) return "1200_1599";
  if (x <= 1999) return "1600_1999";
  if (x <= 2499) return "2000_2499";
  if (x <= 2999) return "2500_2999";
  if (x <= 3499) return "3000_3499";
  return "3500_plus";
}

function parseBedrooms(raw: string): Bedrooms {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("5+") || s.includes("5 +")) return "5_plus";
  const m = s.match(/(\d+)/);
  if (!m) return "2";
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 0) return "2";
  if (n === 0) return "0";
  if (n >= 5) return "5_plus";
  return String(Math.min(4, n)) as Bedrooms;
}

function parseBathrooms(raw: string): Bathrooms {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("4+") || s.includes("4 +")) return "4_plus";
  const half = s.includes("2.5") || s.includes("2_5");
  const m = s.match(/(\d+)(?:\s*\.\s*5)?/);
  if (!m) return "2";
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1) return "1";
  if (half && n === 2) return "2_5";
  if (half && n === 3) return "3_5";
  if (half && n === 1) return "1_5";
  if (n >= 4) return "4_plus";
  if (n === 1) return "1";
  if (n === 2) return "2";
  if (n === 3) return "3";
  return "2";
}

function mapServiceIdToServiceType(serviceId: string): ServiceType {
  const id = String(serviceId ?? "").toLowerCase().trim();
  if (id.includes("move")) {
    if (id.includes("in") && !id.includes("out")) return "move_in";
    return "move_out";
  }
  if (id.includes("deep")) return "deep_clean";
  if (id.includes("recurring") || id.includes("maintenance")) return "maintenance";
  return "maintenance";
}

function mapFrequencyToServiceHint(
  serviceId: string,
  frequency: string,
): ServiceType {
  const base = mapServiceIdToServiceType(serviceId);
  const f = String(frequency ?? "").toLowerCase();
  if (base === "deep_clean" || base === "move_in" || base === "move_out") {
    return base;
  }
  if (f.includes("one") || f.includes("one-time")) return "deep_clean";
  return "maintenance";
}

function mapPetsToPresence(raw: string): EstimateInput["pet_presence"] {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s || s.includes("no pet") || s === "none") return "none";
  if (s.includes("multiple")) return "multiple";
  if (s.includes("one ") || s.startsWith("one")) return "one";
  return "not_sure";
}

function mapPetsToShedding(raw: string): EstimateInput["pet_shedding"] {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("multiple")) return "high";
  if (s.includes("dog") || s.includes("cat")) return "medium";
  return undefined;
}

/** Same fields the estimator reads from a persisted intake row (DTO-compatible). */
export type IntakeFieldsForEstimate = {
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  serviceId: string;
  frequency: string;
  pets: string;
  deepCleanProgram?: string | null;
};

/**
 * Maps intake-shaped fields to EstimatorService input.
 * Defensive: never throws; uses safe defaults when parsing fails.
 */
export function mapIntakeFieldsToEstimateInput(
  intake: IntakeFieldsForEstimate,
): EstimateInput {
  const sqft = extractSqftFromHomeSize(intake.homeSize);
  const sqft_band = sqftToBand(sqft);
  const bedrooms = parseBedrooms(intake.bedrooms);
  const bathrooms = parseBathrooms(intake.bathrooms);
  const service_type = mapFrequencyToServiceHint(
    intake.serviceId,
    intake.frequency,
  );

  const deepCleanProgramMode: "single_visit" | "phased_3_visit" =
    intake.deepCleanProgram === "phased_3_visit"
      ? "phased_3_visit"
      : "single_visit";

  const pets = intake.pets ?? "";
  const addons: Addon[] = [];

  const estimateInput: EstimateInput = {
    property_type: "house" as PropertyType,
    sqft_band,
    bedrooms,
    bathrooms,
    floors: "1" as Floors,
    service_type,
    ...(service_type === "deep_clean"
      ? { deep_clean_program: deepCleanProgramMode }
      : {}),
    first_time_with_servelink: "not_sure",
    last_professional_clean: "not_sure",
    clutter_level: "not_sure",
    kitchen_condition: "not_sure",
    bathroom_condition: "not_sure",
    pet_presence: mapPetsToPresence(pets),
    pet_shedding: mapPetsToShedding(pets),
    pet_accidents_or_litter_areas: "not_sure",
    occupancy_state: "not_sure",
    floor_visibility: "not_sure",
    flooring_mix: "not_sure",
    carpet_percent: "not_sure",
    stairs_flights: "not_sure",
    addons,
  };

  return estimateInput;
}

/**
 * Maps a persisted intake row to EstimatorService input.
 * Defensive: never throws; uses safe defaults when parsing fails.
 */
export function mapIntakeToEstimateInput(
  intake: BookingDirectionIntake,
): EstimateInput {
  return mapIntakeFieldsToEstimateInput({
    homeSize: intake.homeSize,
    bedrooms: intake.bedrooms,
    bathrooms: intake.bathrooms,
    serviceId: intake.serviceId,
    frequency: intake.frequency,
    pets: intake.pets ?? "",
    deepCleanProgram: intake.deepCleanProgram,
  });
}
