import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";
import type { BookingFlowState, BookingStepId } from "./bookingFlowTypes";
import { getPublicBookingMarketingTitle } from "./publicBookingTaxonomy";
import {
  isServiceLocationComplete,
  normalizeBookingServiceLocationZipParam,
} from "./bookingUrlState";
import { getBookingHomeSizeRangeLabel } from "./bookingHomeSizeRanges";
import {
  formatEstimateConfidence,
  formatEstimateDurationMinutes,
  formatEstimateUsdFromCents,
} from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import {
  formatBookingBathroomsForDisplay,
  formatBookingBedroomsForDisplay,
} from "./bookingEstimateFactorFields";

type BookingSummaryCardProps = {
  state: BookingFlowState;
  step?: BookingStepId;
  previewEstimate?: FunnelReviewEstimate | null;
  previewLoading?: boolean;
  previewError?: string | null;
};

function buildHomeProfile(state: BookingFlowState) {
  if (!state.bedrooms || !state.bathrooms || !state.homeSize) {
    return "Complete home details";
  }

  return `${formatBookingBedroomsForDisplay(state.bedrooms)} · ${formatBookingBathroomsForDisplay(state.bathrooms)} · ${getBookingHomeSizeRangeLabel(state.homeSize)}`;
}

export function BookingSummaryCard({
  state,
  step,
  previewEstimate,
  previewLoading,
  previewError,
}: BookingSummaryCardProps) {
  const selectedService = getBookingServiceCatalogItem(state.serviceId);
  const marketingTitle = getPublicBookingMarketingTitle(state.bookingPublicPath);
  const deep = isDeepCleaningBookingServiceId(state.serviceId);
  const deepProgramLabel = (() => {
    if (
      (state.bookingPublicPath === "one_time_cleaning" ||
        state.bookingPublicPath === "first_time_with_recurring") &&
      state.firstTimePostEstimateVisitChoice
    ) {
      switch (state.firstTimePostEstimateVisitChoice) {
        case "two_visits":
          return "2 visits";
        case "three_visits":
          return "3 visits";
        case "convert_recurring":
          return "Recurring (after sign-in)";
        case "one_visit":
        default:
          return "1 visit";
      }
    }
    return state.deepCleanProgram === "phased_3_visit" ? "3-visit program" : "One visit";
  })();
  const locZip = normalizeBookingServiceLocationZipParam(state.serviceLocationZip);
  const locLine = (() => {
    if (!isServiceLocationComplete(state)) {
      return "Add on location step";
    }
    const u = state.serviceLocationUnit.trim();
    const parts = [
      state.serviceLocationStreet.trim(),
      u ? u : null,
      state.serviceLocationCity.trim(),
      state.serviceLocationState.trim(),
      locZip,
    ].filter(Boolean);
    return parts.join(", ");
  })();

  const showLiveEstimate = step === "review";

  const baseRows = [
    {
      label: "Service area",
      value: locLine,
    },
    ...(deep
      ? [
          {
            label: "Visit pacing",
            value: deepProgramLabel,
          },
        ]
      : []),
    {
      label: "Visit type",
      value: "One-time (public booking)",
    },
    {
      label: "Home profile",
      value: buildHomeProfile(state),
    },
    {
      label: "Pets",
      value: state.pets || "Not specified",
    },
  ];

  const contactRows =
    step === "review"
      ? [
          {
            label: "Your name",
            value: state.customerName.trim() || "—",
          },
          {
            label: "Email",
            value: state.customerEmail.trim() || "—",
          },
        ]
      : [];

  const estimateRows =
    showLiveEstimate && (previewLoading || previewError || previewEstimate)
      ? [
          {
            label: "Estimate",
            value: previewLoading
              ? "Getting estimate…"
              : previewError
                ? "See note in review"
                : previewEstimate
                  ? `${formatEstimateUsdFromCents(previewEstimate.priceCents)}${
                      previewEstimate.source === "local"
                        ? " (approx.)"
                        : ""
                    }`
                  : "—",
          },
          ...(previewEstimate && !previewLoading && !previewError
            ? [
                {
                  label: "Est. time",
                  value: formatEstimateDurationMinutes(
                    previewEstimate.durationMinutes,
                  ),
                },
                {
                  label: "How sure we are",
                  value: formatEstimateConfidence(previewEstimate.confidence),
                },
              ]
            : []),
        ]
      : [];

  return (
    <section className="rounded-[32px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
        Booking summary
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          {marketingTitle}
        </h2>
        <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
          {state.bookingPublicPath === "recurring_auth_gate"
            ? "Account"
            : selectedService.bookingTag}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {[...estimateRows, ...contactRows, ...baseRows].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14"
          >
            <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-[#475569]">
              {item.label}
            </p>
            <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-[#0D9488]/18 bg-[#0D9488] p-5 text-white shadow-[0_14px_40px_rgba(13,148,136,0.16)]">
        <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-white/75">
          At a glance
        </p>
        <p className="mt-3 font-[var(--font-manrope)] text-sm leading-7 text-white">
          Your selections stay visible here as you go—so nothing gets lost
          between steps.
        </p>
      </div>
    </section>
  );
}
