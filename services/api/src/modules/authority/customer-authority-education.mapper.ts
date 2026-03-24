import { BookingAuthorityReviewStatus } from "@prisma/client";
import { AUTHORITY_SNAPSHOT } from "./authority.snapshot";

const snapshotSurfaces = new Set(AUTHORITY_SNAPSHOT.surfaces);
const snapshotProblems = new Set(AUTHORITY_SNAPSHOT.problems);
const snapshotMethods = new Set(AUTHORITY_SNAPSHOT.methods);

const MAX_ITEMS_PER_GROUP = 8;

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function compactItems(
  tags: string[],
  allowed: Set<string>,
): Array<{ tag: string; label: string }> {
  const seen = new Set<string>();
  const out: Array<{ tag: string; label: string }> = [];
  for (const tag of tags) {
    if (!allowed.has(tag) || seen.has(tag)) continue;
    seen.add(tag);
    out.push({ tag, label: titleFromSlug(tag) });
    if (out.length >= MAX_ITEMS_PER_GROUP) break;
  }
  return out;
}

/** Non-probabilistic, customer-safe hint derived only from tag source + review state. */
export type CustomerAuthorityConfidence =
  | "based_on_booking_details"
  | "reviewed_for_booking";

export type CustomerAuthorityEducationalContext = {
  /** Surfaces from your booking details we may pay extra attention to (informational). */
  mayFocusOn: Array<{ tag: string; label: string }>;
  /** Issue themes sometimes associated with similar booking details (informational, not a finding). */
  relatedIssues: Array<{ tag: string; label: string }>;
  /** Method or care areas sometimes associated with similar details (informational). */
  careMethods: Array<{ tag: string; label: string }>;
  authorityTagSource: "persisted" | "derived";
  /**
   * Fixed copy so clients can show a single non-diagnostic disclaimer.
   * Wording avoids implying onsite diagnosis or guaranteed scope.
   */
  educationNote: string;
  /** Set when tags come from a stored authority row (auto / reviewed / overridden). */
  authorityReviewStatus?: BookingAuthorityReviewStatus;
  /** Optional trust signal; omit when not useful to surface. */
  authorityConfidence?: CustomerAuthorityConfidence;
};

const EDUCATION_NOTE =
  "These topics are based on your booking details and our standard reference list. They are informational only and do not confirm what will be needed at your property.";

/**
 * Builds a compact, non-diagnostic educational view from authority tags.
 * Only tags present in {@link AUTHORITY_SNAPSHOT} are included.
 */
export function buildCustomerAuthorityEducationalContext(input: {
  surfaces: string[];
  problems: string[];
  methods: string[];
  authorityTagSource: "persisted" | "derived";
  authorityReviewStatus?: BookingAuthorityReviewStatus | null;
}): CustomerAuthorityEducationalContext | null {
  const mayFocusOn = compactItems(input.surfaces, snapshotSurfaces);
  const relatedIssues = compactItems(input.problems, snapshotProblems);
  const careMethods = compactItems(input.methods, snapshotMethods);

  if (
    mayFocusOn.length === 0 &&
    relatedIssues.length === 0 &&
    careMethods.length === 0
  ) {
    return null;
  }

  const base: CustomerAuthorityEducationalContext = {
    mayFocusOn,
    relatedIssues,
    careMethods,
    authorityTagSource: input.authorityTagSource,
    educationNote: EDUCATION_NOTE,
  };
  if (
    input.authorityTagSource === "persisted" &&
    input.authorityReviewStatus != null
  ) {
    base.authorityReviewStatus = input.authorityReviewStatus;
  }

  if (input.authorityTagSource === "derived") {
    base.authorityConfidence = "based_on_booking_details";
  } else if (input.authorityTagSource === "persisted") {
    if (input.authorityReviewStatus === BookingAuthorityReviewStatus.reviewed) {
      base.authorityConfidence = "reviewed_for_booking";
    } else {
      base.authorityConfidence = "based_on_booking_details";
    }
  }

  return base;
}
