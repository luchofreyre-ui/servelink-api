import type { BookingDecisionOption } from "./BookingStepDecision";

type BuildBookingDecisionOptionsParams = {
  recurringIntent: boolean;
  selectedServiceId: string;
  recurringServiceId?: string | null;
  oneTimeServiceId?: string | null;
  moveServiceId?: string | null;
  includeMoveOption?: boolean;
};

export function buildBookingDecisionOptions({
  recurringIntent,
  selectedServiceId,
  recurringServiceId = null,
  oneTimeServiceId = null,
  moveServiceId = null,
  includeMoveOption = false,
}: BuildBookingDecisionOptionsParams): BookingDecisionOption[] {
  const isRecurringSelected =
    recurringIntent ||
    (!!recurringServiceId && selectedServiceId === recurringServiceId);

  const isMoveSelected =
    !!moveServiceId && selectedServiceId === moveServiceId && !recurringIntent;

  const isOneTimeSelected = !isRecurringSelected && !isMoveSelected;

  const options: BookingDecisionOption[] = [
    {
      id: "one_time",
      label: "One-time cleaning",
      description:
        "Use this for a single visit without recurring scheduling enabled.",
      selected: isOneTimeSelected,
    },
    {
      id: "recurring",
      label: "Recurring cleaning",
      description:
        "Use this when the booking should continue on a weekly, biweekly, or monthly cadence.",
      selected: isRecurringSelected,
      badge: "Recurring",
    },
  ];

  if (includeMoveOption) {
    options.push({
      id: "move",
      label: "Move-in / move-out",
      description:
        "Use this when the service path should stay on the move-focused cleaning branch.",
      selected: isMoveSelected,
      badge: "Specialty",
    });
  }

  return options;
}

type ResolveBookingDecisionSelectionParams = {
  decisionId: string;
  recurringServiceId?: string | null;
  oneTimeServiceId?: string | null;
  moveServiceId?: string | null;
};

export type BookingDecisionSelectionResult = {
  recurringIntent?: boolean;
  nextServiceId?: string | null;
};

export function resolveBookingDecisionSelection({
  decisionId,
  recurringServiceId = null,
  oneTimeServiceId = null,
  moveServiceId = null,
}: ResolveBookingDecisionSelectionParams): BookingDecisionSelectionResult {
  switch (decisionId) {
    case "recurring":
      return {
        recurringIntent: true,
        nextServiceId: recurringServiceId ?? undefined,
      };

    case "move":
      return {
        recurringIntent: false,
        nextServiceId: moveServiceId ?? undefined,
      };

    case "one_time":
    default:
      return {
        recurringIntent: false,
        nextServiceId: oneTimeServiceId ?? undefined,
      };
  }
}
