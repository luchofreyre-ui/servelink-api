import { DEFAULT_SERVICE_AREAS_ROUTE, INTENT_RULES } from "./intentCtaData";
import { personalizeIntentCta } from "./intentCtaPersonalization";
import type { IntentCta, IntentRule, IntentSelectionInput } from "./intentCtaTypes";
import type { LocationContext } from "../../location/context/locationTypes";

function scoreRule(rule: IntentRule, input: IntentSelectionInput): number {
  let score = 0;
  const inputSets = [
    new Set(input.problemSlugs),
    new Set(input.surfaceSlugs),
    new Set(input.methodSlugs),
    new Set(input.toolSlugs),
    new Set(input.articleSlugs ?? []),
    new Set(input.clusterSlugs ?? []),
  ];
  if (input.clusterSlug) {
    inputSets.push(new Set([input.clusterSlug]));
  }

  const matchSets = [
    rule.matches.problemSlugs,
    rule.matches.surfaceSlugs,
    rule.matches.methodSlugs,
    rule.matches.toolSlugs,
    rule.matches.articleSlugs,
    rule.matches.clusterSlugs,
  ];

  for (let i = 0; i < matchSets.length; i++) {
    const m = matchSets[i];
    const bucket = inputSets[i] ?? new Set<string>();
    for (const slug of m) {
      if (bucket.has(slug)) score += 2;
    }
  }
  return score;
}

export function buildIntentCta(
  input: IntentSelectionInput,
  locationContext: LocationContext,
): IntentCta {
  let best: IntentRule | null = null;
  let bestScore = 0;
  for (const rule of INTENT_RULES) {
    const sc = scoreRule(rule, input);
    if (sc > bestScore) {
      bestScore = sc;
      best = rule;
    }
  }

  const rule = best ?? INTENT_RULES[0]!;
  const base: IntentCta = {
    ruleId: rule.id,
    title: rule.title,
    description: rule.description,
    primaryLabel: "Book a related service",
    primaryHref: DEFAULT_SERVICE_AREAS_ROUTE.href,
    secondaryLabel: "Browse service areas",
    secondaryHref: DEFAULT_SERVICE_AREAS_ROUTE.href,
  };

  return personalizeIntentCta({
    cta: base,
    serviceSlug: rule.serviceSlug,
    locationContext,
  });
}
