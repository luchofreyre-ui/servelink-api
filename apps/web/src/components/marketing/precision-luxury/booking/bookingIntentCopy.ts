import { CustomerIntent } from "./bookingFlowTypes";

export type CustomerIntentOption = {
  value: CustomerIntent;
  title: string;
  subtitle: string;
};

export const CUSTOMER_INTENT_OPTIONS: CustomerIntentOption[] = [
  {
    value: CustomerIntent.RESET,
    title: "My place needs a real clean",
    subtitle: "For a first-time clean, built-up mess, or a deeper reset.",
  },
  {
    value: CustomerIntent.MAINTAIN,
    title: "I want to keep things clean regularly",
    subtitle: "For ongoing upkeep and a home that stays on track.",
  },
  {
    value: CustomerIntent.TOP_UP,
    title: "I just need another clean soon",
    subtitle: "For a quick refresh after a recent or familiar clean.",
  },
  {
    value: CustomerIntent.TRANSACTIONAL,
    title: "I’m moving in or out",
    subtitle: "For move timing, turnover, or a one-off transition.",
  },
];

export const CUSTOMER_INTENT_HOME_MESSAGE: Record<CustomerIntent, string> = {
  [CustomerIntent.RESET]: "We’ll take extra care to reset your space",
  [CustomerIntent.MAINTAIN]: "We’ll optimize for ongoing upkeep",
  [CustomerIntent.TOP_UP]: "We’ll match your previous clean level",
  [CustomerIntent.TRANSACTIONAL]: "We’ll prepare the space for transition",
};

export const CUSTOMER_INTENT_SUMMARY_MESSAGE: Record<CustomerIntent, string> = {
  [CustomerIntent.RESET]: "Deep, thorough reset",
  [CustomerIntent.MAINTAIN]: "Optimized for recurring upkeep",
  [CustomerIntent.TOP_UP]: "Quick refresh clean",
  [CustomerIntent.TRANSACTIONAL]: "Move-ready cleaning",
};

export const CUSTOMER_INTENT_REVIEW_REASSURANCE: Record<CustomerIntent, string> = {
  [CustomerIntent.RESET]:
    "We’ll emphasize thoroughness and make sure the plan reflects the reset your space needs.",
  [CustomerIntent.MAINTAIN]:
    "We’ll keep this visit easy to repeat, with a soft recurring option when it makes sense.",
  [CustomerIntent.TOP_UP]:
    "We’ll focus on speed and familiarity so this feels like a smooth follow-up clean.",
  [CustomerIntent.TRANSACTIONAL]:
    "We’ll focus on readiness and checklist completion around your move timeline.",
};

export const CUSTOMER_INTENT_SCHEDULE_MESSAGE: Record<CustomerIntent, string> = {
  [CustomerIntent.RESET]: "We’ll allocate enough time for a full reset",
  [CustomerIntent.MAINTAIN]: "Choose your preferred schedule",
  [CustomerIntent.TOP_UP]: "Pick a time that works—we’ll match your last clean",
  [CustomerIntent.TRANSACTIONAL]: "Schedule based on your move timeline",
};

export const CUSTOMER_INTENT_UPSHIFT_HOOK: Record<CustomerIntent, string> = {
  [CustomerIntent.RESET]: "Add deep areas for a full reset",
  [CustomerIntent.MAINTAIN]: "Save with recurring plans",
  [CustomerIntent.TOP_UP]: "Make this a regular clean?",
  [CustomerIntent.TRANSACTIONAL]: "Ensure everything is move-ready",
};
