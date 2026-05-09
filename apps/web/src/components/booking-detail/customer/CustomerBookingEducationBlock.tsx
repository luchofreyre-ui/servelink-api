import type {
  CustomerAuthorityEducationalContext,
  CustomerAuthorityConfidence,
  CustomerAuthorityReviewStatus,
} from "@/booking-screen/customerAuthorityEducationSelectors";

function confidenceCopy(confidence: CustomerAuthorityConfidence | undefined): string | null {
  if (confidence === "reviewed_for_booking") {
    return "An operations reviewer matched this short list to your booking details.";
  }
  return null;
}

function persistedReviewNote(
  review: CustomerAuthorityReviewStatus | undefined,
): string | null {
  if (review === "reviewed") {
    return "Our team reviewed this topic list for your visit.";
  }
  if (review === "overridden") {
    return "Your service team updated this topic list for your visit.";
  }
  if (review === "auto") {
    return "These topics reflect what you shared when you booked.";
  }
  return null;
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
      {items.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}

export function CustomerBookingEducationBlock({
  context,
}: {
  context: CustomerAuthorityEducationalContext;
}) {
  const confidenceLine = confidenceCopy(context.authorityConfidence);

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm"
      data-testid="customer-booking-education"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
        Your booking
      </p>
      <p className="mt-1 font-semibold text-slate-900">What to expect for your visit</p>
      <p className="mt-3 leading-relaxed text-slate-600">
        These are common themes for bookings like yours, based on what you shared. Every home is
        different; your team will confirm what applies when they arrive.
      </p>

      {context.authorityTagSource === "derived" ? (
        <p
          className="mt-3 text-xs text-slate-500"
          data-testid="customer-booking-education-derived-note"
        >
          Derived from your booking details as they are now—not a separately saved list.
        </p>
      ) : null}

      {confidenceLine ? (
        <p
          className="mt-3 border-l-2 border-slate-200 pl-3 text-xs text-slate-500"
          data-testid="customer-booking-education-confidence"
        >
          {confidenceLine}
        </p>
      ) : null}

      {context.mayFocusOn.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Likely attention areas
          </p>
          <BulletList items={context.mayFocusOn.map((x) => x.label)} />
        </div>
      ) : null}

      {context.relatedIssues.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Related focus areas
          </p>
          <BulletList items={context.relatedIssues.map((x) => x.label)} />
        </div>
      ) : null}

      {context.careMethods.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Care approaches
          </p>
          <BulletList items={context.careMethods.map((x) => x.label)} />
        </div>
      ) : null}

      <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
        {context.educationNote}
      </p>

      {context.authorityTagSource === "persisted" ? (
        <p
          className="mt-3 text-xs text-slate-500"
          data-testid="customer-booking-education-persisted-note"
        >
          {persistedReviewNote(context.authorityReviewStatus) ??
            "These topics are saved with your booking."}
        </p>
      ) : null}
    </section>
  );
}
