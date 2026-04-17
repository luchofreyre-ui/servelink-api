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
  { id: "review", order: 3, label: "Review" },
  { id: "schedule", order: 4, label: "Choose a time" },
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
  homeSize: "",
  bedrooms: "",
  bathrooms: "",
  pets: "",
  condition: "standard_lived_in",
  problemAreas: [],
  surfaceComplexity: "average_furnishings",
  scopeIntensity: "full_home_refresh",
  selectedAddOns: [],
  frequency: "",
  preferredTime: "",
  deepCleanProgram: "single_visit",
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
  selectedSlotStart: "",
  selectedSlotEnd: "",
  publicHoldId: "",
  schedulingConfirmed: false,
};

export function getSelectedService(serviceId: string) {
  return getBookingServiceCatalogItem(serviceId);
}
