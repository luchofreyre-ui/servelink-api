import type {
  BookingFlowState,
  BookingStepDefinition,
} from "./bookingFlowTypes";
import {
  bookingServiceCatalog,
  getBookingDefaultServiceId,
  getBookingServiceCatalogItem,
} from "./bookingServiceCatalog";

export const bookingSteps: BookingStepDefinition[] = [
  { id: "service", order: 1, label: "Service" },
  { id: "home", order: 2, label: "Home Details" },
  { id: "location", order: 3, label: "Service location" },
  { id: "review", order: 4, label: "Review" },
  { id: "schedule", order: 5, label: "Choose a time" },
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
  bookingPublicPath: "one_time_cleaning",
  homeSize: "",
  bedrooms: "",
  bathrooms: "",
  pets: "",
  halfBathrooms: "0",
  intakeFloors: "1",
  intakeStairsFlights: "none",
  floorMix: "mixed",
  layoutType: "mixed",
  occupancyLevel: "ppl_1_2",
  childrenInHome: "no",
  petImpactLevel: "none",
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
