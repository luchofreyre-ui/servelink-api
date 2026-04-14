import type {
  BookingFlowState,
  BookingStepDefinition,
} from "./bookingFlowTypes";
import {
  bookingServiceCatalog,
  getBookingDefaultServiceId,
  getBookingServiceCatalogItem,
} from "./bookingServiceCatalog";
import { DEFAULT_BOOKING_ESTIMATE_FACTORS } from "./bookingEstimateFactors";

export const bookingSteps: BookingStepDefinition[] = [
  { id: "service", order: 1, label: "Service" },
  { id: "home", order: 2, label: "Home Details" },
  { id: "factors", order: 3, label: "Job Details" },
  { id: "schedule", order: 4, label: "Schedule" },
  { id: "review", order: 5, label: "Review" },
  { id: "decision", order: 6, label: "Plan" },
  { id: "recurring_setup", order: 7, label: "Setup" },
  { id: "confirm", order: 8, label: "Confirm" },
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
  estimateFactors: { ...DEFAULT_BOOKING_ESTIMATE_FACTORS },
  frequency: "",
  preferredTime: "",
  deepCleanProgram: "single_visit",
  customerName: "",
  customerEmail: "",
  scheduleSelection: undefined,
  cleanerPreference: undefined,
  recurringIntent: undefined,
  recurringSetup: undefined,
  estimateSnapshot: null,
};

export function getSelectedService(serviceId: string) {
  return getBookingServiceCatalogItem(serviceId);
}
