"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import { fetchPublicBookingConfirmation } from "@/lib/api/bookings";
import { mapBookingScreenProgramToDisplay } from "@/mappers/deepCleanProgramMappers";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { ServiceHeader } from "../layout/ServiceHeader";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import {
  formatBookingBathroomsForDisplay,
  formatBookingBedroomsForDisplay,
} from "./bookingEstimateFactorFields";
import {
  BOOKING_CONFIRMATION_DEPOSIT_PAID_LINE,
  BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED,
  BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY,
  BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED,
  BOOKING_CONFIRMATION_HEADLINE_VISIT_CONFIRMED,
  BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_DETAIL,
  BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_LEAD,
  BOOKING_CONFIRMATION_INTRO_NEUTRAL_REENTRY,
  BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_DETAIL,
  BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_LEAD,
  BOOKING_CONFIRMATION_INTRO_VISIT_CONFIRMED_DETAIL,
  BOOKING_CONFIRMATION_INTRO_VISIT_CONFIRMED_LEAD,
  BOOKING_CONFIRMATION_NEXT_STEPS_BOOKING_SAVED,
  BOOKING_CONFIRMATION_NEXT_STEPS_NEUTRAL_REENTRY,
  BOOKING_CONFIRMATION_NEXT_STEPS_REQUEST_RECEIVED,
  BOOKING_CONFIRMATION_NEXT_STEPS_VISIT_CONFIRMED,
  BOOKING_CONFIRMATION_REQUEST_SECTION_TITLE,
  BOOKING_CONFIRMATION_BEGIN_FRESH_REQUEST_TITLE,
  BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA,
  BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA,
  bookingConfirmationDeepPlanEchoLabel,
  bookingConfirmationNoticeForBookingErrorCode,
} from "./bookingPublicSurfaceCopy";
import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";
import {
  clearBookingConfirmationPaymentSessionState,
  clearBookingConfirmationSessionSnapshot,
  hasPublicIntakeEchoInSearchParams,
  markBookingFlowFreshStartRequested,
  mergeConfirmationParamsFromSessionIfUrlEmpty,
  normalizeBookingHomeSizeParam,
  readBookingConfirmationSessionSnapshot,
  readPublicIntakeEchoFromSearchParams,
} from "./bookingUrlState";

function formatUsdFromCents(cents: number): string {
  const n = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatVisitDateTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatVisitWindowLabel(startIso: string, endIso: string | null | undefined): string {
  const start = formatVisitDateTime(startIso);
  if (!endIso?.trim()) return start;
  const end = new Date(endIso);
  if (!Number.isFinite(end.getTime())) return `${start} – ${endIso}`;
  const endPart = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} – ${endPart}`;
}

function parseDcProgramFromQuery(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (v === "phased_3_visit" || v === "phased") return "phased_3_visit" as const;
  if (v === "single_visit" || v === "single") return "single_visit" as const;
  return null;
}

type ConfirmationOutcomeMode =
  | "booking_saved"
  | "request_received"
  | "neutral_reentry";

type LockedRecurringCadence = "weekly" | "every_10_days" | "biweekly" | "monthly";

type LockedRecurringPlan = {
  id?: string | null;
  cadence?: LockedRecurringCadence | null;
  status?: string | null;
  pricePerVisitCents?: number | null;
  nextRunAt?: string | null;
};

type LockedResetSchedule = {
  visit1At?: string | null;
  visit2At?: string | null;
  visit3At?: string | null;
  recurringBeginsAt?: string | null;
};

type ConfirmationWithRecurringContract = Awaited<
  ReturnType<typeof fetchPublicBookingConfirmation>
> & {
  selectedRecurringCadence?: LockedRecurringCadence | null;
  visitStructure?: "one_visit" | "three_visit_reset" | null;
  recurringPlan?: LockedRecurringPlan | null;
  resetSchedule?: LockedResetSchedule | null;
  recurringBeginsAt?: string | null;
};

const recurringCadenceLabel: Record<LockedRecurringCadence, string> = {
  weekly: "Weekly",
  every_10_days: "Every 10 days",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

function isLockedRecurringCadence(
  value: string | null | undefined,
): value is LockedRecurringCadence {
  return (
    value === "weekly" ||
    value === "every_10_days" ||
    value === "biweekly" ||
    value === "monthly"
  );
}

function classifyConfirmationOutcome(
  sp: URLSearchParams,
): ConfirmationOutcomeMode {
  const intakeId = sp.get("intakeId")?.trim() ?? "";
  const bookingId = sp.get("bookingId")?.trim() ?? "";
  const priceCentsRaw = sp.get("priceCents");
  const durationMinutesRaw = sp.get("durationMinutes");
  const confidenceRaw = sp.get("confidence");
  const priceCents =
    priceCentsRaw != null && priceCentsRaw !== ""
      ? Number(priceCentsRaw)
      : NaN;
  const durationMinutes =
    durationMinutesRaw != null && durationMinutesRaw !== ""
      ? Number(durationMinutesRaw)
      : NaN;
  const confidence =
    confidenceRaw != null && confidenceRaw !== ""
      ? Number(confidenceRaw)
      : NaN;

  const estimateBundleCredible =
    intakeId.length > 0 &&
    bookingId.length > 0 &&
    Number.isFinite(priceCents) &&
    priceCents >= 0 &&
    priceCents < 1e12 &&
    Number.isFinite(durationMinutes) &&
    durationMinutes > 0 &&
    durationMinutes < 1e7 &&
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1;

  if (estimateBundleCredible) return "booking_saved";
  if (intakeId.length > 0) return "request_received";
  return "neutral_reentry";
}

export function BookingConfirmationClient() {
  const searchParams = useSearchParams();
  const urlString = searchParams?.toString() ?? "";

  const [effectiveSearchParams, setEffectiveSearchParams] = useState(
    () => new URLSearchParams(urlString),
  );

  useEffect(() => {
    const url = new URLSearchParams(searchParams?.toString() ?? "");
    setEffectiveSearchParams(
      mergeConfirmationParamsFromSessionIfUrlEmpty(
        url,
        readBookingConfirmationSessionSnapshot(),
      ),
    );
  }, [urlString]);

  const bookingId = effectiveSearchParams.get("bookingId")?.trim() || "";
  const intakeId = effectiveSearchParams.get("intakeId")?.trim() || "";
  const priceCentsRaw = effectiveSearchParams.get("priceCents");
  const durationMinutesRaw = effectiveSearchParams.get("durationMinutes");
  const confidenceRaw = effectiveSearchParams.get("confidence");
  const bookingErrorCode =
    effectiveSearchParams.get("bookingError")?.trim() || "";
  const dcProgramParam = parseDcProgramFromQuery(
    effectiveSearchParams.get("dcProgram"),
  );

  const outcomeMode = useMemo(
    () => classifyConfirmationOutcome(effectiveSearchParams),
    [effectiveSearchParams],
  );

  const urlPriceCents = priceCentsRaw ? Number(priceCentsRaw) : NaN;
  const urlDurationMinutes = durationMinutesRaw
    ? Number(durationMinutesRaw)
    : NaN;
  const urlConfidence = confidenceRaw ? Number(confidenceRaw) : NaN;

  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remote, setRemote] = useState<Awaited<
    ReturnType<typeof fetchPublicBookingConfirmation>
  > | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setRemote(null);
      setRemoteError(null);
      return;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteError(null);
    void fetchPublicBookingConfirmation(bookingId)
      .then((r) => {
        if (!cancelled) setRemote(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRemoteError(
            e instanceof Error ? e.message : "Could not load booking details.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const priceCents = useMemo(() => {
    const fromApi = remote?.estimateSnapshot?.estimatedPriceCents;
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) return fromApi;
    return urlPriceCents;
  }, [remote, urlPriceCents]);

  const durationMinutes = useMemo(() => {
    const fromApi = remote?.estimateSnapshot?.estimatedDurationMinutes;
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) return fromApi;
    return urlDurationMinutes;
  }, [remote, urlDurationMinutes]);

  const confidence = useMemo(() => {
    const fromApi = remote?.estimateSnapshot?.confidence;
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) return fromApi;
    return urlConfidence;
  }, [remote, urlConfidence]);

  const visitConfirmedFromRemote = useMemo(() => {
    if (!remote) return false;
    if (remote.bookingStatus !== "assigned") return false;
    return Boolean(remote.scheduledStart && remote.scheduledStart.trim().length > 0);
  }, [remote]);

  const recurringContract = useMemo(() => {
    if (!remote) return null;
    const contract = remote as ConfirmationWithRecurringContract;
    const cadenceCandidate =
      contract.selectedRecurringCadence ?? contract.recurringPlan?.cadence ?? null;
    const cadence = isLockedRecurringCadence(cadenceCandidate)
      ? cadenceCandidate
      : null;
    if (!cadence) return null;
    const recurringBeginsAt =
      contract.recurringBeginsAt ??
      contract.resetSchedule?.recurringBeginsAt ??
      contract.recurringPlan?.nextRunAt ??
      null;
    return {
      cadence,
      visitStructure: contract.visitStructure ?? null,
      plan: contract.recurringPlan ?? null,
      resetSchedule: contract.resetSchedule ?? null,
      recurringBeginsAt,
    };
  }, [remote]);

  useEffect(() => {
    if (!remote) return;
    if (remote.bookingStatus !== "assigned" && remote.publicDepositPaid !== true) return;
    clearBookingConfirmationPaymentSessionState(remote.bookingId);
    try {
      window.sessionStorage.removeItem("booking_deposit_in_flight");
    } catch {
      // ignore
    }
  }, [remote]);

  const hasEstimateFromRemote = useMemo(() => {
    const s = remote?.estimateSnapshot;
    if (!s) return false;
    return (
      Number.isFinite(s.estimatedPriceCents) &&
      s.estimatedPriceCents >= 0 &&
      s.estimatedPriceCents < 1e12 &&
      Number.isFinite(s.estimatedDurationMinutes) &&
      s.estimatedDurationMinutes > 0 &&
      s.estimatedDurationMinutes < 1e7 &&
      Number.isFinite(s.confidence) &&
      s.confidence >= 0 &&
      s.confidence <= 1
    );
  }, [remote]);

  const hasEstimate =
    outcomeMode === "booking_saved" ||
    hasEstimateFromRemote ||
    visitConfirmedFromRemote;
  const showBookingSavedIntro = hasEstimate && !visitConfirmedFromRemote;

  const headline =
    outcomeMode === "neutral_reentry"
      ? BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY
      : visitConfirmedFromRemote
        ? BOOKING_CONFIRMATION_HEADLINE_VISIT_CONFIRMED
        : outcomeMode === "booking_saved"
          ? BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED
          : BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED;

  const programDisplay = useMemo(
    () => mapBookingScreenProgramToDisplay(remote?.deepCleanProgram ?? null),
    [remote],
  );

  const intakeEcho = useMemo(() => {
    if (classifyConfirmationOutcome(effectiveSearchParams) === "neutral_reentry") {
      return null;
    }
    const sp = new URLSearchParams(effectiveSearchParams.toString());
    if (!hasPublicIntakeEchoInSearchParams(sp)) return null;
    return readPublicIntakeEchoFromSearchParams(sp);
  }, [effectiveSearchParams]);

  const clearSessionAndNavigateProps = {
    onClick: () => {
      clearBookingConfirmationSessionSnapshot();
      markBookingFlowFreshStartRequested();
    },
  };

  if (outcomeMode === "neutral_reentry") {
    return (
      <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
        <ServiceHeader />

        <main>
          <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              Thank you
            </p>
            <h1 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-[#0F172A] md:text-5xl">
              {headline}
            </h1>
            <p className="mt-6 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
              {BOOKING_CONFIRMATION_INTRO_NEUTRAL_REENTRY}
            </p>

            <div className="mt-10 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Next steps
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                {BOOKING_CONFIRMATION_NEXT_STEPS_NEUTRAL_REENTRY}
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/book"
                replace
                title={BOOKING_CONFIRMATION_BEGIN_FRESH_REQUEST_TITLE}
                {...clearSessionAndNavigateProps}
                className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
              >
                {BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA}
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
              >
                Browse services
              </Link>
            </div>
          </section>
        </main>

        <PublicSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            Thank you
          </p>
          <h1 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-[#0F172A] md:text-5xl">
            {headline}
          </h1>
          <p className="mt-6 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
            Thank you.{" "}
            {visitConfirmedFromRemote ? (
              <>
                {BOOKING_CONFIRMATION_INTRO_VISIT_CONFIRMED_LEAD}{" "}
                {BOOKING_CONFIRMATION_INTRO_VISIT_CONFIRMED_DETAIL}
              </>
            ) : showBookingSavedIntro ? (
              <>
                {BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_LEAD}{" "}
                {BOOKING_CONFIRMATION_INTRO_BOOKING_SAVED_DETAIL}
              </>
            ) : (
              <>
                {BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_LEAD}{" "}
                {BOOKING_CONFIRMATION_INTRO_REQUEST_RECEIVED_DETAIL}
                {intakeId ? (
                  <>
                    {" "}
                    <span className="text-[#64748B]">
                      Keep this handy: {intakeId}
                    </span>
                  </>
                ) : null}
              </>
            )}
          </p>

          {visitConfirmedFromRemote && remote ? (
            <div className="mt-8 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Your visit
              </p>
              {remote.assignedTeamDisplayName ? (
                <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">Team: </span>
                  {remote.assignedTeamDisplayName}
                </p>
              ) : null}
              {remote.scheduledStart ? (
                <p className="mt-2 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">Scheduled: </span>
                  {formatVisitWindowLabel(
                    remote.scheduledStart,
                    remote.scheduledEnd ?? null,
                  )}
                </p>
              ) : null}
              {remote.publicDepositPaid ? (
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                  {BOOKING_CONFIRMATION_DEPOSIT_PAID_LINE}
                </p>
              ) : null}
            </div>
          ) : null}

          {bookingErrorCode &&
          outcomeMode === "request_received" &&
          !visitConfirmedFromRemote ? (
            <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
              {bookingConfirmationNoticeForBookingErrorCode(bookingErrorCode)}
            </p>
          ) : null}

          {intakeEcho ? (
            <div className="mt-8 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                {BOOKING_CONFIRMATION_REQUEST_SECTION_TITLE}
              </p>
              <div className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm leading-7 text-[#334155]">
                <p>
                  <span className="font-semibold text-[#0F172A]">Service: </span>
                  {getBookingServiceCatalogItem(intakeEcho.serviceId).title}
                </p>
                {isDeepCleaningBookingServiceId(intakeEcho.serviceId) &&
                intakeEcho.deepCleanProgram ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Deep clean plan:{" "}
                    </span>
                    {bookingConfirmationDeepPlanEchoLabel(
                      intakeEcho.deepCleanProgram,
                    )}
                  </p>
                ) : null}
                {normalizeBookingHomeSizeParam(intakeEcho.homeSize) ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Home size:{" "}
                    </span>
                    {normalizeBookingHomeSizeParam(intakeEcho.homeSize)}
                  </p>
                ) : null}
                {intakeEcho.bedrooms.trim() ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Bedrooms:{" "}
                    </span>
                    {formatBookingBedroomsForDisplay(intakeEcho.bedrooms)}
                  </p>
                ) : null}
                {intakeEcho.bathrooms.trim() ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Bathrooms:{" "}
                    </span>
                    {formatBookingBathroomsForDisplay(intakeEcho.bathrooms)}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-[#0F172A]">Pets: </span>
                  {intakeEcho.pets.trim() ? intakeEcho.pets.trim() : "Not specified"}
                </p>
                {intakeEcho.frequency ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Frequency:{" "}
                    </span>
                    {intakeEcho.frequency}
                  </p>
                ) : null}
                {intakeEcho.preferredTime ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Preferred timing:{" "}
                    </span>
                    {intakeEcho.preferredTime}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {bookingId && remoteError ? (
            <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
              We couldn&apos;t refresh your saved visit plan from our servers.
              What you confirmed is still valid—we&apos;ll follow up with full
              details.
            </p>
          ) : null}

          {!hasEstimate && dcProgramParam ? (
            <p className="mt-6 rounded-2xl border border-[#C9B27C]/20 bg-white px-5 py-4 font-[var(--font-manrope)] text-sm leading-7 text-[#334155]">
              <span className="font-semibold text-[#0F172A]">
                Deep clean selection saved:{" "}
              </span>
              {dcProgramParam === "phased_3_visit"
                ? "3-visit deep clean program — we’ll confirm visit pacing and estimates with you."
                : "One-visit deep clean — we’ll confirm timing and estimate details with you."}
            </p>
          ) : null}

          {hasEstimate ? (
            <div className="mt-10 space-y-6 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                    Estimated price
                  </p>
                  <p className="mt-2 font-[var(--font-poppins)] text-3xl font-semibold text-[#0F172A]">
                    {formatUsdFromCents(priceCents)}
                  </p>
                </div>
                <div>
                  <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                    Estimated duration
                  </p>
                  <p className="mt-2 font-[var(--font-poppins)] text-3xl font-semibold text-[#0F172A]">
                    {Math.round(durationMinutes)} minutes
                  </p>
                </div>
              </div>
              <div>
                <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                  How sure we are
                </p>
                <p className="mt-2 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                  {Math.min(100, Math.max(0, Math.round(confidence * 100)))}%
                </p>
              </div>
              {bookingId ? (
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  Booking reference:{" "}
                  <span className="font-mono text-[#0F172A]">{bookingId}</span>
                </p>
              ) : null}
              {remoteLoading ? (
                <p className="font-[var(--font-manrope)] text-xs text-[#64748B]">
                  Loading your saved visit plan…
                </p>
              ) : null}
            </div>
          ) : null}

          {programDisplay ? (
            <div className="mt-8 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="mb-4 font-[var(--font-manrope)] text-sm text-[#64748B]">
                Visit plan below comes from your saved booking. Dates are set
                when we confirm with you—this page doesn&apos;t schedule visits on
                its own.
              </p>
              <DeepCleanProgramCard program={programDisplay} />
            </div>
          ) : hasEstimate && bookingId && !remoteLoading && remote ? (
            remote.deepCleanProgram === null &&
            remote.estimateSnapshot?.serviceType === "deep_clean" ? (
              <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
                Deep clean visit details aren&apos;t showing for this save yet.
                Our team can still walk through scope with you.
              </p>
            ) : null
          ) : null}

          {hasEstimate &&
          !programDisplay &&
          !remoteLoading &&
          dcProgramParam === "phased_3_visit" ? (
            <p className="mt-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
              You chose the 3-visit program. If visit-level detail doesn&apos;t
              show here, we&apos;ll confirm it when we reach out.
            </p>
          ) : null}

          <div className="mt-10 space-y-6 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <div>
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Next steps
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                {visitConfirmedFromRemote
                  ? BOOKING_CONFIRMATION_NEXT_STEPS_VISIT_CONFIRMED
                  : showBookingSavedIntro
                    ? BOOKING_CONFIRMATION_NEXT_STEPS_BOOKING_SAVED
                    : BOOKING_CONFIRMATION_NEXT_STEPS_REQUEST_RECEIVED}
              </p>
            </div>
          </div>

          {recurringContract ? (
            <div className="mt-10 rounded-[28px] border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                Recurring service
              </p>
              <h2 className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                Your recurring service is set
              </h2>
              <div className="mt-5 grid gap-4 font-[var(--font-manrope)] text-sm leading-6 text-[#334155] sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-[#0F172A]">Cadence: </span>
                  {recurringCadenceLabel[recurringContract.cadence]}
                </p>
                {typeof recurringContract.plan?.pricePerVisitCents === "number" ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Recurring visit price:{" "}
                    </span>
                    {formatUsdFromCents(recurringContract.plan.pricePerVisitCents)}
                  </p>
                ) : null}
                {recurringContract.plan?.nextRunAt ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Next visit:{" "}
                    </span>
                    {formatVisitDateTime(recurringContract.plan.nextRunAt)}
                  </p>
                ) : null}
                {recurringContract.recurringBeginsAt ? (
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      Recurring begins:{" "}
                    </span>
                    {formatVisitDateTime(recurringContract.recurringBeginsAt)}
                  </p>
                ) : null}
              </div>

              {recurringContract.visitStructure === "three_visit_reset" &&
              recurringContract.resetSchedule ? (
                <div className="mt-6 rounded-2xl border border-[#0D9488]/18 bg-white px-5 py-4">
                  <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
                    Three-visit reset schedule
                  </p>
                  <div className="mt-3 grid gap-3 font-[var(--font-manrope)] text-sm leading-6 text-[#334155] sm:grid-cols-2">
                    {recurringContract.resetSchedule.visit1At ? (
                      <p>
                        <span className="font-semibold text-[#0F172A]">
                          Visit 1:{" "}
                        </span>
                        {formatVisitDateTime(recurringContract.resetSchedule.visit1At)}
                      </p>
                    ) : null}
                    {recurringContract.resetSchedule.visit2At ? (
                      <p>
                        <span className="font-semibold text-[#0F172A]">
                          Visit 2:{" "}
                        </span>
                        {formatVisitDateTime(recurringContract.resetSchedule.visit2At)}
                      </p>
                    ) : null}
                    {recurringContract.resetSchedule.visit3At ? (
                      <p>
                        <span className="font-semibold text-[#0F172A]">
                          Visit 3:{" "}
                        </span>
                        {formatVisitDateTime(recurringContract.resetSchedule.visit3At)}
                      </p>
                    ) : null}
                    {recurringContract.recurringBeginsAt ? (
                      <p>
                        <span className="font-semibold text-[#0F172A]">
                          Recurring begins:{" "}
                        </span>
                        {formatVisitDateTime(recurringContract.recurringBeginsAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : remote?.scheduledStart ? (
                <div className="mt-6 rounded-2xl border border-[#0D9488]/18 bg-white px-5 py-4 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
                  <p>
                    <span className="font-semibold text-[#0F172A]">
                      First visit:{" "}
                    </span>
                    {formatVisitDateTime(remote.scheduledStart)}
                  </p>
                  {recurringContract.recurringBeginsAt ? (
                    <p className="mt-2">
                      <span className="font-semibold text-[#0F172A]">
                        Recurring begins:{" "}
                      </span>
                      {formatVisitDateTime(recurringContract.recurringBeginsAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/book"
              replace
              title={BOOKING_CONFIRMATION_BEGIN_FRESH_REQUEST_TITLE}
              {...clearSessionAndNavigateProps}
              className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
            >
              {BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA}
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
            >
              Browse services
            </Link>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
