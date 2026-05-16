import type {
  BookingFlowState,
  BookingStepDefinition,
} from "./bookingFlowTypes";
import {
  bookingServiceCatalog,
  getBookingDefaultServiceId,
  getBookingServiceCatalogItem,
} from "./bookingServiceCatalog";

/** Explicit Layer 1 baseline — use in tests when the home step must be structurally complete. */
export const bookingHomeLayer1BaselineComplete: Pick<
  BookingFlowState,
  | "halfBathrooms"
  | "intakeFloors"
  | "intakeStairsFlights"
  | "floorMix"
  | "layoutType"
  | "occupancyLevel"
  | "childrenInHome"
  | "petImpactLevel"
> = {
  halfBathrooms: "0",
  intakeFloors: "1",
  intakeStairsFlights: "none",
  floorMix: "mixed",
  layoutType: "mixed",
  occupancyLevel: "ppl_1_2",
  childrenInHome: "no",
  petImpactLevel: "none",
};

export const bookingSteps: BookingStepDefinition[] = [
  { id: "service", order: 1, label: "Service details" },
  { id: "home", order: 2, label: "Home details" },
  { id: "location", order: 3, label: "Your details" },
  { id: "review", order: 4, label: "Review & book" },
  { id: "schedule", order: 5, label: "Team & time" },
];

export const bookingServiceOptions = bookingServiceCatalog.map((service) => ({
  id: service.id,
  title: service.title,
  body: service.shortDescription,
  meta: service.meta,
}));

export const defaultBookingFlowState: BookingFlowState = {
  step: "service",
  serviceId: getBookingDefaultServiceId(),
  intent: undefined,
  bookingPublicPath: "one_time_cleaning",
  homeSize: "",
  bedrooms: "",
  bathrooms: "",
  pets: "",
  halfBathrooms: "",
  intakeFloors: "",
  intakeStairsFlights: "",
  floorMix: "",
  layoutType: "",
  occupancyLevel: "",
  childrenInHome: "",
  petImpactLevel: "",
  overallLaborCondition: "normal_lived_in",
  kitchenIntensity: "average_use",
  bathroomComplexity: "standard",
  clutterAccess: "mostly_clear",
  surfaceDetailTokens: [],
  primaryIntent: "detailed_standard",
  lastProCleanRecency: "days_30_90",
  firstTimeVisitProgram: "one_visit",
  recurringCadenceIntent: "none",
  condition: "standard_lived_in",
  problemAreas: [],
  surfaceComplexity: "average_furnishings",
  scopeIntensity: "full_home_refresh",
  selectedAddOns: [],
  selectedUpsellIds: [],
  recurringInterest: undefined,
  teamPlanningDetails: undefined,
  frequency: "One-Time",
  preferredTime: "",
  deepCleanProgram: "single_visit",
  serviceLocationZip: "",
  serviceLocationStreet: "",
  serviceLocationCity: "",
  serviceLocationState: "",
  serviceLocationUnit: "",
  serviceLocationAddressLine: "",
  firstTimePostEstimateVisitChoice: "",
  deepCleanFocus: "whole_home_reset",
  transitionState: "empty_home",
  appliancePresence: [],
  customerName: "",
  customerEmail: "",
  schedulingBookingId: "",
  schedulingIntakeId: "",
  availableTeams: [],
  availableWindows: [],
  selectedTeamId: "",
  selectedTeamDisplayName: "",
  selectedSlotId: "",
  selectedSlotStart: "",
  selectedSlotEnd: "",
  publicHoldId: "",
  schedulingConfirmed: false,
};

export function getSelectedService(serviceId: string) {
  return getBookingServiceCatalogItem(serviceId);
}
