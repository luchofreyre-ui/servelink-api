/** Returned on submit when `BookingsService.createBooking` fails with `EstimatorExecutionError`. */
export const INTAKE_ESTIMATE_EXECUTION_FAILED_CODE = "ESTIMATE_EXECUTION_FAILED" as const;

export const INTAKE_ESTIMATE_EXECUTION_FAILED_MESSAGE =
  "We could not compute an automated quote from your selections. Your request is saved; our team will follow up with pricing.";

export const INTAKE_PREVIEW_ESTIMATE_FAILED_MESSAGE =
  "We could not compute a preview quote for these selections. Check your home details or try again.";

export const INTAKE_ESTIMATE_INPUT_INVALID_MESSAGE =
  "Some home or service details are not valid for an automated quote. Adjust your selections or contact us for help.";
