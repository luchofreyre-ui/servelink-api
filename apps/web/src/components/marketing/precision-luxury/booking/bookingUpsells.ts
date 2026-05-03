import { CustomerIntent } from "./bookingFlowTypes";

export type BookingUpsellOption = {
  id: string;
  label: string;
  description: string;
  intent: CustomerIntent[];
  category: "deep_area" | "recurring" | "priority" | "move_ready" | "comfort";
  pricingLabel: string;
  trustNote?: string;
};

const ALL_INTENTS = [
  CustomerIntent.RESET,
  CustomerIntent.MAINTAIN,
  CustomerIntent.TOP_UP,
  CustomerIntent.TRANSACTIONAL,
];

export const BOOKING_UPSELL_OPTIONS: BookingUpsellOption[] = [
  {
    id: "inside_oven",
    label: "Inside oven",
    description: "Good for built-up grease, spills, and reset-level kitchens.",
    intent: [CustomerIntent.RESET],
    category: "deep_area",
    pricingLabel: "Quoted after review",
  },
  {
    id: "inside_fridge",
    label: "Inside fridge",
    description: "Helpful when the kitchen needs a true reset.",
    intent: [CustomerIntent.RESET],
    category: "deep_area",
    pricingLabel: "Quoted after review",
  },
  {
    id: "baseboards_detail",
    label: "Baseboard detail",
    description: "Adds extra attention to dust lines and edge buildup.",
    intent: [CustomerIntent.RESET],
    category: "deep_area",
    pricingLabel: "Available as an add-on",
  },
  {
    id: "cabinet_exteriors",
    label: "Cabinet exterior detail",
    description: "Wipes down visible cabinet fronts and high-touch surfaces.",
    intent: [CustomerIntent.RESET],
    category: "deep_area",
    pricingLabel: "Ask us to include this",
  },
  {
    id: "recurring_plan_prompt",
    label: "Save with recurring service",
    description: "Ask us about weekly, biweekly, or monthly upkeep.",
    intent: [CustomerIntent.MAINTAIN],
    category: "recurring",
    pricingLabel: "Ask us to include this",
    trustNote: "No recurring plan is created until you approve it.",
  },
  {
    id: "rotating_deep_area",
    label: "Rotate one deep area",
    description:
      "Add one focus area each visit without turning every clean into a deep clean.",
    intent: [CustomerIntent.MAINTAIN],
    category: "recurring",
    pricingLabel: "Quoted after review",
  },
  {
    id: "pet_hair_focus",
    label: "Pet hair focus",
    description:
      "Extra attention for fur-prone floors, furniture edges, and corners.",
    intent: [CustomerIntent.MAINTAIN],
    category: "comfort",
    pricingLabel: "Ask us to include this",
  },
  {
    id: "quick_refresh_focus",
    label: "Quick refresh focus",
    description: "Prioritize visible areas so the home feels clean again fast.",
    intent: [CustomerIntent.TOP_UP],
    category: "priority",
    pricingLabel: "Ask us to include this",
  },
  {
    id: "same_priorities_as_last_time",
    label: "Match my last clean",
    description: "Keep the same priorities from your most recent visit.",
    intent: [CustomerIntent.TOP_UP],
    category: "priority",
    pricingLabel: "Ask us to include this",
    trustNote: "We’ll confirm details if we need more context.",
  },
  {
    id: "priority_return_window",
    label: "Priority return window",
    description: "Let us know you prefer the soonest reasonable return slot.",
    intent: [CustomerIntent.TOP_UP],
    category: "priority",
    pricingLabel: "Ask us to include this",
  },
  {
    id: "move_ready_checklist",
    label: "Move-ready checklist",
    description: "Focus on the surfaces that matter most before handoff.",
    intent: [CustomerIntent.TRANSACTIONAL],
    category: "move_ready",
    pricingLabel: "Ask us to include this",
  },
  {
    id: "inside_cabinets",
    label: "Inside empty cabinets",
    description: "Best when cabinets are empty before move-in or move-out.",
    intent: [CustomerIntent.TRANSACTIONAL],
    category: "move_ready",
    pricingLabel: "Quoted after review",
  },
  {
    id: "appliance_exteriors",
    label: "Appliance exterior detail",
    description: "Extra attention to visible appliance faces and handles.",
    intent: [CustomerIntent.TRANSACTIONAL],
    category: "move_ready",
    pricingLabel: "Available as an add-on",
  },
  {
    id: "high_touch_detail",
    label: "High-touch detail",
    description:
      "Extra attention to handles, switches, railings, and common touchpoints.",
    intent: ALL_INTENTS,
    category: "comfort",
    pricingLabel: "Ask us to include this",
  },
];

export function getBookingUpsellsForIntent(
  intent: CustomerIntent | undefined,
): BookingUpsellOption[] {
  if (!intent) return [];
  return BOOKING_UPSELL_OPTIONS.filter((option) => option.intent.includes(intent));
}

export function getBookingUpsellOptionsByIds(
  ids: readonly string[],
): BookingUpsellOption[] {
  const wanted = new Set(ids);
  return BOOKING_UPSELL_OPTIONS.filter((option) => wanted.has(option.id));
}

export function normalizeBookingUpsellIds(
  ids: readonly string[],
  intent: CustomerIntent | undefined,
): string[] {
  if (!intent) return [];
  const allowed = new Set(getBookingUpsellsForIntent(intent).map((option) => option.id));
  const out: string[] = [];
  for (const id of ids) {
    if (allowed.has(id) && !out.includes(id)) out.push(id);
  }
  return out.sort();
}
