/**
 * Public funnel questionnaire slice that maps to API `estimateFactors` / `EstimateInput`.
 * Values mirror `services/api/.../dto/estimate-factor-enums.ts`.
 */

export type BookingEstimateFactorsState = {
  propertyType: string;
  floors: string;
  firstTimeWithServelink: string;
  lastProfessionalClean: string;
  clutterLevel: string;
  kitchenCondition: string;
  stovetopType: string;
  bathroomCondition: string;
  glassShowers: string;
  petPresence: string;
  petShedding: string;
  petAccidentsOrLitterAreas: string;
  occupancyState: string;
  floorVisibility: string;
  carpetPercent: string;
  stairsFlights: string;
  addonIds: string[];
};

export const DEFAULT_BOOKING_ESTIMATE_FACTORS: BookingEstimateFactorsState = {
  propertyType: "",
  floors: "",
  firstTimeWithServelink: "",
  lastProfessionalClean: "",
  clutterLevel: "",
  kitchenCondition: "",
  stovetopType: "",
  bathroomCondition: "",
  glassShowers: "",
  petPresence: "",
  petShedding: "",
  petAccidentsOrLitterAreas: "",
  occupancyState: "",
  floorVisibility: "",
  carpetPercent: "",
  stairsFlights: "",
  addonIds: [],
};

export const ESTIMATE_ADDON_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "inside_oven", label: "Inside oven" },
  { id: "inside_fridge", label: "Inside fridge" },
  { id: "interior_windows", label: "Interior windows" },
  { id: "blinds", label: "Blinds" },
  { id: "baseboards_detail", label: "Baseboards (detail)" },
  { id: "cabinets_exterior_detail", label: "Cabinet exteriors (detail)" },
  { id: "laundry_fold", label: "Laundry / fold" },
  { id: "dish_wash_load", label: "Dish wash (load)" },
  { id: "vacuum_sofa", label: "Vacuum sofa" },
];

/** Client-side gate aligned with API `homeSize` + mapper `extractSqftFromHomeSizeStrict`. */
export function homeSizeHasValidSqftForEstimate(homeSize: string): boolean {
  const t = String(homeSize ?? "").replace(/,/g, "");
  const m = t.match(/(\d{3,5})\b/);
  if (!m) return false;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 300 && n <= 20000;
}

export function isBookingEstimateFactorsComplete(
  f: BookingEstimateFactorsState,
): boolean {
  const base =
    !!f.propertyType &&
    !!f.floors &&
    !!f.firstTimeWithServelink &&
    !!f.lastProfessionalClean &&
    !!f.clutterLevel &&
    !!f.kitchenCondition &&
    !!f.stovetopType &&
    !!f.bathroomCondition &&
    !!f.glassShowers &&
    !!f.petPresence &&
    !!f.petAccidentsOrLitterAreas &&
    !!f.occupancyState &&
    !!f.floorVisibility &&
    !!f.carpetPercent &&
    !!f.stairsFlights;

  if (!base) return false;
  if (f.petPresence !== "none" && !f.petShedding) return false;
  return true;
}

/** API nested object (validated server-side). Omits `petShedding` when no pets. */
export function buildEstimateFactorsPayload(
  f: BookingEstimateFactorsState,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    propertyType: f.propertyType,
    floors: f.floors,
    firstTimeWithServelink: f.firstTimeWithServelink,
    lastProfessionalClean: f.lastProfessionalClean,
    clutterLevel: f.clutterLevel,
    kitchenCondition: f.kitchenCondition,
    stovetopType: f.stovetopType,
    bathroomCondition: f.bathroomCondition,
    glassShowers: f.glassShowers,
    petPresence: f.petPresence,
    petAccidentsOrLitterAreas: f.petAccidentsOrLitterAreas,
    occupancyState: f.occupancyState,
    floorVisibility: f.floorVisibility,
    carpetPercent: f.carpetPercent,
    stairsFlights: f.stairsFlights,
    addonIds: [...f.addonIds],
  };
  if (f.petPresence !== "none" && f.petShedding) {
    base.petShedding = f.petShedding;
  }
  return base;
}

export function parseBookingEstimateFactorsFromUnknown(
  raw: unknown,
): BookingEstimateFactorsState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_BOOKING_ESTIMATE_FACTORS };
  }
  const o = raw as Record<string, unknown>;
  const addonRaw = o.addonIds;
  const addonIds = Array.isArray(addonRaw)
    ? addonRaw.filter((x): x is string => typeof x === "string")
    : [];
  return {
    propertyType: typeof o.propertyType === "string" ? o.propertyType : "",
    floors: typeof o.floors === "string" ? o.floors : "",
    firstTimeWithServelink:
      typeof o.firstTimeWithServelink === "string"
        ? o.firstTimeWithServelink
        : "",
    lastProfessionalClean:
      typeof o.lastProfessionalClean === "string"
        ? o.lastProfessionalClean
        : "",
    clutterLevel: typeof o.clutterLevel === "string" ? o.clutterLevel : "",
    kitchenCondition:
      typeof o.kitchenCondition === "string" ? o.kitchenCondition : "",
    stovetopType: typeof o.stovetopType === "string" ? o.stovetopType : "",
    bathroomCondition:
      typeof o.bathroomCondition === "string" ? o.bathroomCondition : "",
    glassShowers: typeof o.glassShowers === "string" ? o.glassShowers : "",
    petPresence: typeof o.petPresence === "string" ? o.petPresence : "",
    petShedding: typeof o.petShedding === "string" ? o.petShedding : "",
    petAccidentsOrLitterAreas:
      typeof o.petAccidentsOrLitterAreas === "string"
        ? o.petAccidentsOrLitterAreas
        : "",
    occupancyState:
      typeof o.occupancyState === "string" ? o.occupancyState : "",
    floorVisibility:
      typeof o.floorVisibility === "string" ? o.floorVisibility : "",
    carpetPercent: typeof o.carpetPercent === "string" ? o.carpetPercent : "",
    stairsFlights: typeof o.stairsFlights === "string" ? o.stairsFlights : "",
    addonIds,
  };
}
