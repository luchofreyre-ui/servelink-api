export type BookingStepId = "service" | "home" | "schedule" | "review";

export type BookingServiceOption = {
  id: string;
  title: string;
  body: string;
  meta: string;
};

export type BookingFrequencyOption = "Weekly" | "Bi-Weekly" | "Monthly" | "One-Time";

export type BookingTimeOption =
  | "Weekday Morning"
  | "Weekday Afternoon"
  | "Friday"
  | "Saturday";

export type BookingFlowState = {
  step: BookingStepId;
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  frequency: BookingFrequencyOption;
  preferredTime: BookingTimeOption;
};

export type BookingStepDefinition = {
  id: BookingStepId;
  order: number;
  label: string;
};
