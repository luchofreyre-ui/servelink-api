"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { BookingFlowProgress } from "../BookingFlowProgress";
import { bookingSteps } from "./bookingFlowData";
import { BOOKING_PAGE_DESCRIPTION } from "./bookingSeo";
import {
  buildBookingSearchParams,
  parseBookingSearchParams,
} from "./bookingUrlState";
import type {
  BookingFlowState,
  BookingFrequencyOption,
  BookingStepId,
  BookingTimeOption,
} from "./bookingFlowTypes";
import { BookingStepService } from "./BookingStepService";
import { BookingStepHomeDetails } from "./BookingStepHomeDetails";
import { BookingStepSchedule } from "./BookingStepSchedule";
import { BookingStepReview } from "./BookingStepReview";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { BookingServiceHandoffCard } from "./BookingServiceHandoffCard";
import {
  buildBookingAttributionFromSearchParams,
  submitBookingDirectionIntake,
} from "./bookingDirectionIntakeApi";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";

function getStepOrder(step: BookingStepId) {
  return bookingSteps.find((item) => item.id === step)?.order ?? 1;
}

function serializeState(state: BookingFlowState) {
  return buildBookingSearchParams(state).toString();
}

function getStepError(state: BookingFlowState): string | null {
  if (state.step === "service" && !state.serviceId) {
    return "Please choose a service before continuing.";
  }

  if (
    state.step === "home" &&
    (!state.homeSize || !state.bedrooms || !state.bathrooms)
  ) {
    return "Please complete your home details before continuing.";
  }

  if (
    state.step === "schedule" &&
    (!state.frequency || !state.preferredTime)
  ) {
    return "Please choose your preferred frequency and timing before continuing.";
  }

  return null;
}

export function BookingFlowClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = useMemo(
    () =>
      parseBookingSearchParams(
        new URLSearchParams(searchParams?.toString() ?? ""),
      ),
    [searchParams],
  );

  const [state, setState] = useState<BookingFlowState>(initialState);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  const currentStepOrder = useMemo(() => getStepOrder(state.step), [state.step]);

  const stepError = useMemo(() => getStepError(state), [state]);
  const canContinue = !stepError;

  const isHomeComplete =
    !!state.homeSize && !!state.bedrooms && !!state.bathrooms;
  const isScheduleComplete = !!state.frequency && !!state.preferredTime;
  const isBookingReady =
    !!state.serviceId && isHomeComplete && isScheduleComplete;

  useEffect(() => {
    if (
      (attemptedNext && stepError) ||
      (attemptedConfirm && !isBookingReady) ||
      Boolean(submitError)
    ) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [attemptedNext, stepError, attemptedConfirm, isBookingReady, submitError]);

  useEffect(() => {
    if (state.step === "home" && isHomeComplete) {
      setAttemptedNext(false);
    }

    if (state.step === "schedule" && isScheduleComplete) {
      setAttemptedNext(false);
    }
  }, [state.step, isHomeComplete, isScheduleComplete]);

  // URL → STATE (ONLY runs when searchParams change)
  useEffect(() => {
    const parsed = parseBookingSearchParams(
      new URLSearchParams(searchParams?.toString() ?? ""),
    );

    const parsedSerialized = serializeState(parsed);
    const currentSerialized = serializeState(state);

    // Only update state if URL is truly different
    if (parsedSerialized !== currentSerialized) {
      setState(parsed);
    }
    // ❗️REMOVE state from deps to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // STATE → URL (ONLY runs when state changes)
  useEffect(() => {
    const desired = serializeState(state);
    const current = new URLSearchParams(searchParams?.toString() ?? "").toString();

    if (desired !== current) {
      router.replace(`${pathname}?${desired}`, { scroll: false });
    }
    // ❗️REMOVE searchParams from deps to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pathname, router]);

  function goToStep(step: BookingStepId) {
    setState((prev) => ({ ...prev, step }));
  }

  function goNext() {
    setAttemptedNext(true);

    if (stepError) return;

    setAttemptedNext(false);

    if (state.step === "service") return goToStep("home");
    if (state.step === "home") return goToStep("schedule");
    if (state.step === "schedule") return goToStep("review");
  }

  async function confirmBookingDirection() {
    setSubmitError(null);
    setAttemptedConfirm(true);
    if (!isBookingReady) return;

    setIsSubmitting(true);
    try {
      const attribution = buildBookingAttributionFromSearchParams(
        new URLSearchParams(searchParams?.toString() ?? ""),
      );

      const result = await submitBookingDirectionIntake({
        serviceId: state.serviceId,
        homeSize: state.homeSize,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        pets: state.pets ?? "",
        frequency: state.frequency,
        preferredTime: state.preferredTime,
        ...(isDeepCleaningBookingServiceId(state.serviceId) &&
        state.deepCleanProgram
          ? { deepCleanProgram: state.deepCleanProgram }
          : {}),
        ...attribution,
      });

      const q = new URLSearchParams();
      q.set("intakeId", result.intakeId);
      if (
        result.bookingCreated &&
        result.bookingId &&
        result.estimate
      ) {
        q.set("bookingId", result.bookingId);
        q.set("priceCents", String(result.estimate.priceCents));
        q.set("durationMinutes", String(result.estimate.durationMinutes));
        q.set("confidence", String(result.estimate.confidence));
      } else if (result.bookingError?.code) {
        q.set("bookingError", result.bookingError.code);
      }
      if (
        isDeepCleaningBookingServiceId(state.serviceId) &&
        state.deepCleanProgram
      ) {
        q.set("dcProgram", state.deepCleanProgram);
      }

      router.push(`/book/confirmation?${q.toString()}`);
    } catch (err) {
      console.error("booking direction intake failed", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "We couldn’t save your booking direction. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    setAttemptedNext(false);

    if (state.step === "review") {
      setAttemptedConfirm(false);
      setSubmitError(null);
      return goToStep("schedule");
    }
    if (state.step === "schedule") return goToStep("home");
    if (state.step === "home") return goToStep("service");
    return;
  }

  function patchState(patch: Partial<BookingFlowState>) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitError(null);
    setState((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="border-b border-[#C9B27C]/14">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
            <div className="max-w-4xl">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                Booking flow
              </p>
              <h1 className="mt-4 font-[var(--font-poppins)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#0F172A] md:text-6xl">
                A premium booking experience should feel guided, calm, and easy to complete.
              </h1>
              <p className="mt-6 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569] md:text-xl">
                {BOOKING_PAGE_DESCRIPTION}
              </p>
            </div>

            <div className="mt-10">
              <BookingFlowProgress
                currentStep={currentStepOrder}
                steps={bookingSteps.map((step) => ({
                  id: step.order,
                  label: step.label,
                }))}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <BookingServiceHandoffCard serviceId={state.serviceId} />

              {state.step === "service" ? (
                <BookingStepService
                  serviceId={state.serviceId}
                  onSelect={(serviceId) => {
                    setAttemptedNext(false);
                    setAttemptedConfirm(false);
                    setSubmitError(null);
                    setState((prev) => ({
                      ...prev,
                      serviceId,
                      deepCleanProgram: isDeepCleaningBookingServiceId(
                        serviceId,
                      )
                        ? prev.deepCleanProgram === "phased_3_visit" ||
                          prev.deepCleanProgram === "single_visit"
                          ? prev.deepCleanProgram
                          : "single_visit"
                        : "",
                    }));
                  }}
                  deepCleanProgram={
                    state.deepCleanProgram === "phased_3_visit"
                      ? "phased_3_visit"
                      : "single_visit"
                  }
                  onDeepCleanProgramChange={(value) =>
                    patchState({ deepCleanProgram: value })
                  }
                />
              ) : null}

              {state.step === "home" ? (
                <BookingStepHomeDetails
                  state={state}
                  onChange={(patch) => patchState(patch)}
                />
              ) : null}

              {state.step === "schedule" ? (
                <BookingStepSchedule
                  state={state}
                  onFrequencySelect={(value: BookingFrequencyOption) =>
                    patchState({ frequency: value })
                  }
                  onTimeSelect={(value: BookingTimeOption) =>
                    patchState({ preferredTime: value })
                  }
                />
              ) : null}

              {state.step === "review" ? <BookingStepReview state={state} /> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {state.step !== "service" ? (
                  <button
                    onClick={goBack}
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href={`/services/${state.serviceId}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
                  >
                    Back to Service
                  </Link>
                )}

                {state.step !== "review" ? (
                  <button
                    onClick={goNext}
                    aria-disabled={!canContinue}
                    className={`inline-flex items-center justify-center rounded-full px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white transition ${
                      canContinue
                        ? "bg-[#0D9488] shadow-[0_14px_40px_rgba(13,148,136,0.22)] hover:-translate-y-0.5 hover:bg-[#0b7f76]"
                        : "bg-[#94A3B8] shadow-none"
                    }`}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void confirmBookingDirection()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending…" : "Confirm Booking Direction"}
                  </button>
                )}
              </div>

              {state.step === "review" ? (
                submitError ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    {submitError}
                  </p>
                ) : attemptedConfirm && !isBookingReady ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    Please complete home details and schedule selections before
                    confirming.
                  </p>
                ) : null
              ) : attemptedNext && stepError ? (
                <p
                  ref={errorRef}
                  className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                >
                  {stepError}
                </p>
              ) : null}
            </div>

            <aside className="space-y-6">
              <BookingSummaryCard state={state} />

              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Why this matters
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-white">
                  Premium conversion is not just about aesthetics.
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-white/75">
                  This creates the exact front-end structure we need before connecting actual
                  service data, pricing, availability, and booking state.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
