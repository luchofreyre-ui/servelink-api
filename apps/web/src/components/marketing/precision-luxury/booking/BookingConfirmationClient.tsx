"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import { fetchPublicBookingConfirmation } from "@/lib/api/bookings";
import { mapBookingScreenProgramToDisplay } from "@/mappers/deepCleanProgramMappers";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { PublicSiteHeader } from "../layout/PublicSiteHeader";

function formatUsdFromCents(cents: number): string {
  const n = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function parseDcProgramFromQuery(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (v === "phased_3_visit" || v === "phased") return "phased_3_visit" as const;
  if (v === "single_visit" || v === "single") return "single_visit" as const;
  return null;
}

export function BookingConfirmationClient() {
  const searchParams = useSearchParams();

  const bookingId = searchParams?.get("bookingId")?.trim() || "";
  const intakeId = searchParams?.get("intakeId")?.trim() || "";
  const priceCentsRaw = searchParams?.get("priceCents");
  const durationMinutesRaw = searchParams?.get("durationMinutes");
  const confidenceRaw = searchParams?.get("confidence");
  const bookingErrorCode = searchParams?.get("bookingError")?.trim() || "";
  const dcProgramParam = parseDcProgramFromQuery(searchParams?.get("dcProgram"));

  const urlPriceCents = priceCentsRaw ? Number(priceCentsRaw) : NaN;
  const urlDurationMinutes = durationMinutesRaw ? Number(durationMinutesRaw) : NaN;
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

  const hasEstimate =
    Boolean(bookingId) &&
    Number.isFinite(priceCents) &&
    Number.isFinite(durationMinutes) &&
    Number.isFinite(confidence);

  const programDisplay = useMemo(
    () => mapBookingScreenProgramToDisplay(remote?.deepCleanProgram ?? null),
    [remote],
  );

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />

      <main>
        <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            Booking
          </p>
          <h1 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-[#0F172A] md:text-5xl">
            We received your booking
          </h1>
          <p className="mt-6 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
            Thank you.{" "}
            {hasEstimate ? (
              <>
                Below is an{" "}
                <strong className="font-semibold text-[#0F172A]">
                  initial estimate
                </strong>{" "}
                based on what you shared. Final pricing may adjust after we
                confirm details.
              </>
            ) : (
              <>
                We saved your request
                {intakeId ? (
                  <>
                    {" "}
                    <span className="text-[#64748B]">(reference {intakeId})</span>
                  </>
                ) : null}
                . Our team will follow up with next steps.
              </>
            )}
          </p>

          {bookingErrorCode ? (
            <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
              We stored your preferences, but couldn&apos;t generate a live quote
              yet ({bookingErrorCode}). Someone will still reach out.
            </p>
          ) : null}

          {bookingId && remoteError ? (
            <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
              Couldn&apos;t refresh saved program details from the server (
              {remoteError}). Estimates from your link still show below when
              available.
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
                  Estimate confidence
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
                  Syncing saved program details…
                </p>
              ) : null}
            </div>
          ) : null}

          {programDisplay ? (
            <div className="mt-8 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="mb-4 font-[var(--font-manrope)] text-sm text-[#64748B]">
                Per-visit scope below is loaded from your saved booking. Visit
                dates are confirmed separately — this is not automated
                scheduling.
              </p>
              <DeepCleanProgramCard program={programDisplay} />
            </div>
          ) : hasEstimate && bookingId && !remoteLoading && remote ? (
            remote.deepCleanProgram === null &&
            remote.estimateSnapshot?.serviceType === "deep_clean" ? (
              <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
                Deep clean program details are not available for this booking
                snapshot. Our team can still confirm scope with you.
              </p>
            ) : null
          ) : null}

          {hasEstimate &&
          !programDisplay &&
          !remoteLoading &&
          dcProgramParam === "phased_3_visit" ? (
            <p className="mt-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
              You selected the 3-visit program. If visit-level detail does not
              appear, confirm your booking reference is correct or contact
              support.
            </p>
          ) : null}

          <div className="mt-10 space-y-6 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <div>
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Next steps
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                We&apos;ll review your service type, home profile, and timing.
                Servelink will reach out with confirmation options and any
                follow-up questions—usually within one business day.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
            >
              New booking
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
