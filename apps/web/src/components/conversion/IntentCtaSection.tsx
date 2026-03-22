"use client";

import { usePathname } from "next/navigation";

import { buildIntentCta } from "../../conversion/intent/intentCtaSelectors";
import { IntentCtaCard } from "./IntentCtaCard";
import { getLocationContextForPath } from "../../location/context/locationSelectors";
import type { IntentSelectionInput } from "../../conversion/intent/intentCtaTypes";

export function IntentCtaSection({
  input,
}: {
  input: IntentSelectionInput;
}) {
  const pathname = usePathname() ?? "/";
  const locationContext = getLocationContextForPath(pathname);
  const cta = buildIntentCta(input, locationContext);

  return <IntentCtaCard cta={cta} />;
}
