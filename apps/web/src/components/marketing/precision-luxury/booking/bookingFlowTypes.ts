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

/** Public deep clean product; empty when service is not deep clean. */
export type BookingDeepCleanProgramChoice = "single_visit" | "phased_3_visit";

export type BookingFlowState = {
  step: BookingStepId;
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  /** Empty until user selects a valid option (URL/parser may omit). */
  frequency: BookingFrequencyOption | "";
  /** Empty until user selects a valid option (URL/parser may omit). */
  preferredTime: BookingTimeOption | "";
  /** Set when `serviceId` is deep clean; otherwise "". */
  deepCleanProgram: BookingDeepCleanProgramChoice | "";
};

export type BookingStepDefinition = {
  id: BookingStepId;
  order: number;
  label: string;
};
