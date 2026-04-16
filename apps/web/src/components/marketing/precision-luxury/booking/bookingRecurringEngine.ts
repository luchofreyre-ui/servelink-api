import type { RecurringCadence, RecurringIntent } from "./bookingFlowTypes";
import type { BookingRecurringFrequencyOption } from "./BookingStepRecurringSetup";

export function getBookingRecurringEnabled(
  recurringIntent: RecurringIntent | undefined,
): boolean {
  return recurringIntent?.type === "recurring";
}

export function buildBookingRecurringFrequencyOptions(
  recurringEnabled: boolean,
  recurringIntent: RecurringIntent | undefined,
): BookingRecurringFrequencyOption[] {
  const cadence =
    recurringIntent?.type === "recurring" ? recurringIntent.cadence : "weekly";
  const option = (
    id: RecurringCadence,
    label: string,
    description: string,
  ): BookingRecurringFrequencyOption => ({
    id,
    label,
    description,
    selected: recurringEnabled && cadence === id,
    disabled: !recurringEnabled,
  });
  return [
    option("weekly", "Weekly", "Return every week on your anchor day."),
    option(
      "biweekly",
      "Bi-weekly",
      "Return every two weeks for a lighter rhythm.",
    ),
    option("monthly", "Monthly", "Return once a month for maintenance visits."),
  ];
}

export function buildBookingCadenceSummary(
  recurringEnabled: boolean,
  recurringIntent: RecurringIntent | undefined,
): string | null {
  if (!recurringEnabled || recurringIntent?.type !== "recurring") {
    return null;
  }
  const labelMap: Record<RecurringCadence, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
  };
  const c = recurringIntent.cadence;
  return `Cadence: ${labelMap[c] ?? c}`;
}

export function buildRecurringIntentForEnabledChange(
  enabled: boolean,
  current: RecurringIntent | undefined,
): RecurringIntent {
  if (!enabled) {
    return { type: "one_time" };
  }
  return {
    type: "recurring",
    cadence:
      current?.type === "recurring" ? current.cadence : "weekly",
  };
}

export function buildRecurringIntentForCadenceSelect(
  cadence: RecurringCadence,
): RecurringIntent {
  return { type: "recurring", cadence };
}
