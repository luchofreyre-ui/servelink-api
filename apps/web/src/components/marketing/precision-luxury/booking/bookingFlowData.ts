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
  { id: "schedule", order: 3, label: "Schedule" },
  { id: "review", order: 4, label: "Review" },
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
  homeSize: "2,200 sq ft",
  bedrooms: "3 bedrooms",
  bathrooms: "2 bathrooms",
  pets: "One dog",
  frequency: "Bi-Weekly",
  preferredTime: "Weekday Morning",
};

export function getSelectedService(serviceId: string) {
  return getBookingServiceCatalogItem(serviceId);
}
