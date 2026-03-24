function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export type CustomerAuthorityEducationalItem = {
  tag: string;
  label: string;
};

export type CustomerAuthorityReviewStatus = "auto" | "reviewed" | "overridden";

export type CustomerAuthorityConfidence =
  | "based_on_booking_details"
  | "reviewed_for_booking";

export type CustomerAuthorityEducationalContext = {
  mayFocusOn: CustomerAuthorityEducationalItem[];
  relatedIssues: CustomerAuthorityEducationalItem[];
  careMethods: CustomerAuthorityEducationalItem[];
  authorityTagSource: "persisted" | "derived";
  educationNote: string;
  authorityReviewStatus?: CustomerAuthorityReviewStatus;
  authorityConfidence?: CustomerAuthorityConfidence;
};

function parseItems(raw: unknown): CustomerAuthorityEducationalItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomerAuthorityEducationalItem[] = [];
  for (const el of raw) {
    const r = asRecord(el);
    if (!r) continue;
    const tag = typeof r.tag === "string" ? r.tag : "";
    const label = typeof r.label === "string" ? r.label : "";
    if (!tag || !label) continue;
    out.push({ tag, label });
  }
  return out;
}

/**
 * Parses `authorityEducationalContext` from customer `GET .../bookings/:id/screen`.
 */
export function selectCustomerAuthorityEducationalContext(
  screen: unknown,
): CustomerAuthorityEducationalContext | null {
  const s = asRecord(screen);
  const raw = s?.authorityEducationalContext;
  const ctx = asRecord(raw);
  if (!ctx) return null;

  const mayFocusOn = parseItems(ctx.mayFocusOn);
  const relatedIssues = parseItems(ctx.relatedIssues);
  const careMethods = parseItems(ctx.careMethods);
  const educationNote =
    typeof ctx.educationNote === "string" ? ctx.educationNote.trim() : "";
  const src = ctx.authorityTagSource;
  const authorityTagSource =
    src === "persisted" || src === "derived" ? src : "derived";

  if (
    mayFocusOn.length === 0 &&
    relatedIssues.length === 0 &&
    careMethods.length === 0
  ) {
    return null;
  }

  const rs = ctx.authorityReviewStatus;
  const authorityReviewStatus: CustomerAuthorityReviewStatus | undefined =
    rs === "auto" || rs === "reviewed" || rs === "overridden" ? rs : undefined;

  const cf = ctx.authorityConfidence;
  const authorityConfidence: CustomerAuthorityConfidence | undefined =
    cf === "based_on_booking_details" || cf === "reviewed_for_booking"
      ? cf
      : undefined;

  return {
    mayFocusOn,
    relatedIssues,
    careMethods,
    authorityTagSource,
    educationNote:
      educationNote ||
      "For your reference only, based on your booking details.",
    ...(authorityTagSource === "persisted" && authorityReviewStatus
      ? { authorityReviewStatus }
      : {}),
    ...(authorityConfidence ? { authorityConfidence } : {}),
  };
}
