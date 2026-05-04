"use client";

import { useState } from "react";
import { WEB_ENV } from "@/lib/env";

type RecurringCadence = "weekly" | "every_10_days" | "biweekly" | "monthly";

type RecurringPlanSummary = {
  id?: string | null;
  cadence?: RecurringCadence | null;
  status?: string | null;
  pricePerVisitCents?: number | null;
  nextRunAt?: string | null;
};

type ResetScheduleSummary = {
  visit1At?: string | null;
  visit2At?: string | null;
  visit3At?: string | null;
  recurringBeginsAt?: string | null;
};

type RecurringPlanConversionCardProps = {
  bookingId: string;
  selectedCadence?: RecurringCadence | "not_sure" | null;
  scheduledStart?: string | null;
  visitStructure?: "one_visit" | "three_visit_reset" | null;
  recurringPlan?: RecurringPlanSummary | null;
  resetSchedule?: ResetScheduleSummary | null;
  recurringBeginsAt?: string | null;
};

const cadenceLabels: Record<RecurringCadence, string> = {
  weekly: "Weekly",
  every_10_days: "Every 10 days",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

function isRecurringCadence(value: string | null | undefined): value is RecurringCadence {
  return (
    value === "weekly" ||
    value === "every_10_days" ||
    value === "biweekly" ||
    value === "monthly"
  );
}

function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(cents) ? cents / 100 : 0);
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

export function RecurringPlanConversionCard({
  bookingId,
  selectedCadence = null,
  scheduledStart = null,
  visitStructure = null,
  recurringPlan = null,
  resetSchedule = null,
  recurringBeginsAt = null,
}: RecurringPlanConversionCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lockedCadence = isRecurringCadence(selectedCadence)
    ? selectedCadence
    : isRecurringCadence(recurringPlan?.cadence)
      ? recurringPlan.cadence
      : null;
  const nextVisitAt = recurringPlan?.nextRunAt ?? recurringBeginsAt ?? null;
  const beginsAt =
    recurringBeginsAt ?? resetSchedule?.recurringBeginsAt ?? recurringPlan?.nextRunAt ?? null;

  async function requestRecurring(cadence: RecurringCadence) {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`${WEB_ENV.apiBaseUrl}/recurring-plans/create-from-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, cadence }),
    });

    setLoading(false);
    if (!response.ok) {
      setMessage("Recurring service could not be requested from this page.");
      return;
    }
    setMessage("Recurring service request received.");
  }

  if (lockedCadence) {
    return (
      <div className="space-y-5 rounded-[28px] border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] p-6">
        <div>
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
            Recurring service
          </p>
          <h3 className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
            Your recurring service is set
          </h3>
        </div>

        <div className="grid gap-3 font-[var(--font-manrope)] text-sm leading-6 text-[#334155] sm:grid-cols-2">
          <p>
            <span className="font-semibold text-[#0F172A]">Cadence: </span>
            {cadenceLabels[lockedCadence]}
          </p>
          {typeof recurringPlan?.pricePerVisitCents === "number" ? (
            <p>
              <span className="font-semibold text-[#0F172A]">
                Recurring visit price:{" "}
              </span>
              {formatUsdFromCents(recurringPlan.pricePerVisitCents)}
            </p>
          ) : null}
          {nextVisitAt ? (
            <p>
              <span className="font-semibold text-[#0F172A]">Next visit: </span>
              {formatVisitDateTime(nextVisitAt)}
            </p>
          ) : null}
          {beginsAt ? (
            <p>
              <span className="font-semibold text-[#0F172A]">
                Recurring begins:{" "}
              </span>
              {formatVisitDateTime(beginsAt)}
            </p>
          ) : null}
        </div>

        {visitStructure === "three_visit_reset" && resetSchedule ? (
          <div className="rounded-2xl border border-[#0D9488]/18 bg-white px-5 py-4">
            <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
              Three-visit reset schedule
            </p>
            <div className="mt-3 grid gap-3 font-[var(--font-manrope)] text-sm leading-6 text-[#334155] sm:grid-cols-2">
              {resetSchedule.visit1At ? (
                <p>
                  <span className="font-semibold text-[#0F172A]">Visit 1: </span>
                  {formatVisitDateTime(resetSchedule.visit1At)}
                </p>
              ) : null}
              {resetSchedule.visit2At ? (
                <p>
                  <span className="font-semibold text-[#0F172A]">Visit 2: </span>
                  {formatVisitDateTime(resetSchedule.visit2At)}
                </p>
              ) : null}
              {resetSchedule.visit3At ? (
                <p>
                  <span className="font-semibold text-[#0F172A]">Visit 3: </span>
                  {formatVisitDateTime(resetSchedule.visit3At)}
                </p>
              ) : null}
              {beginsAt ? (
                <p>
                  <span className="font-semibold text-[#0F172A]">
                    Recurring begins:{" "}
                  </span>
                  {formatVisitDateTime(beginsAt)}
                </p>
              ) : null}
            </div>
          </div>
        ) : scheduledStart ? (
          <div className="rounded-2xl border border-[#0D9488]/18 bg-white px-5 py-4 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
            <p>
              <span className="font-semibold text-[#0F172A]">First visit: </span>
              {formatVisitDateTime(scheduledStart)}
            </p>
            {beginsAt ? (
              <p className="mt-2">
                <span className="font-semibold text-[#0F172A]">
                  Recurring begins:{" "}
                </span>
                {formatVisitDateTime(beginsAt)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-[#C9B27C]/18 bg-white p-6">
      <div>
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Optional recurring service
        </p>
        <h3 className="mt-2 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          Recurring service can be requested for future visits
        </h3>
      </div>

      <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
        This section is shown only when the booking did not lock a recurring
        cadence during review.
      </p>

      <div className="flex flex-wrap gap-2">
        {(["weekly", "every_10_days", "biweekly", "monthly"] as const).map(
          (cadence) => (
            <button
              key={cadence}
              onClick={() => requestRecurring(cadence)}
              disabled={loading}
              className="rounded-full bg-[#0D9488] px-4 py-2 font-[var(--font-manrope)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              Request {cadenceLabels[cadence]}
            </button>
          ),
        )}
      </div>
      {message ? (
        <p className="font-[var(--font-manrope)] text-sm text-[#475569]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
