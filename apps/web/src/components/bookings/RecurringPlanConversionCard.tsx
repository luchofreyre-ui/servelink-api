'use client';

import { useEffect, useMemo, useState } from 'react';
import { WEB_ENV } from '@/lib/env';

type RecurringCadence = 'weekly' | 'every_10_days' | 'biweekly' | 'monthly';
type SelectedRecurringCadence = RecurringCadence | 'not_sure';

type RecurringOfferQuote = {
  cadence: RecurringCadence;
  cadenceDays: number;
  firstCleanPriceCents: number;
  recurringPriceCents: number;
  savingsCents: number;
  discountPercent: number;
  estimatedMinutes: number;
};

type RecurringPlanSummary = {
  id: string;
  cadence: RecurringCadence;
  status: string;
  pricePerVisitCents: number;
  nextRunAt: string | null;
};

type ResetScheduleSummary = {
  visit1At: string;
  visit2At: string;
  visit3At: string;
};

const cadenceLabels: Record<RecurringCadence, string> = {
  weekly: 'Weekly',
  every_10_days: 'Every 10 days',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

const cadenceSentenceLabels: Record<RecurringCadence, string> = {
  weekly: 'weekly',
  every_10_days: 'every 10 days',
  biweekly: 'biweekly',
  monthly: 'monthly',
};

const fallbackQuotes: RecurringOfferQuote[] = [
  {
    cadence: 'weekly',
    cadenceDays: 7,
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 40,
    estimatedMinutes: 120,
  },
  {
    cadence: 'every_10_days',
    cadenceDays: 10,
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 34,
    estimatedMinutes: 120,
  },
  {
    cadence: 'biweekly',
    cadenceDays: 14,
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 30,
    estimatedMinutes: 120,
  },
  {
    cadence: 'monthly',
    cadenceDays: 30,
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 20,
    estimatedMinutes: 120,
  },
];

function normalizeLockedCadence(
  selectedCadence?: SelectedRecurringCadence | null,
): RecurringCadence | null {
  return selectedCadence === 'weekly' ||
    selectedCadence === 'every_10_days' ||
    selectedCadence === 'biweekly' ||
    selectedCadence === 'monthly'
    ? selectedCadence
    : null;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function RecurringPlanConversionCard({
  bookingId,
  selectedCadence,
  recurringPlan,
  scheduledStart,
  visitStructure,
  resetSchedule,
  recurringBeginsAt,
}: {
  bookingId: string;
  selectedCadence?: SelectedRecurringCadence | null;
  recurringPlan?: RecurringPlanSummary | null;
  scheduledStart?: string | null;
  visitStructure?: 'one_visit' | 'three_visit_reset' | null;
  resetSchedule?: ResetScheduleSummary | null;
  recurringBeginsAt?: string | null;
}) {
  const lockedCadence = normalizeLockedCadence(selectedCadence);
  const [submittingCadence, setSubmittingCadence] =
    useState<RecurringCadence | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [successCadence, setSuccessCadence] = useState<RecurringCadence | null>(
    null,
  );
  const [quotes, setQuotes] = useState<RecurringOfferQuote[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      setQuoteLoading(true);
      setQuoteError(false);

      try {
        const search = new URLSearchParams({ bookingId });
        if (lockedCadence) {
          search.set('cadence', lockedCadence);
        }
        const response = await fetch(
          `${WEB_ENV.apiBaseUrl}/recurring-plans/offer-quote?${search.toString()}`,
        );

        if (!response.ok) {
          throw new Error('Unable to load recurring pricing.');
        }

        const nextQuotes = (await response.json()) as RecurringOfferQuote[];
        if (!cancelled) {
          setQuotes(nextQuotes);
        }
      } catch {
        if (!cancelled) {
          setQuoteError(true);
          setQuotes(null);
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [bookingId, lockedCadence]);

  const displayQuotes = useMemo(() => {
    const source = quotes ?? fallbackQuotes;
    return lockedCadence
      ? source.filter((quote) => quote.cadence === lockedCadence)
      : source;
  }, [lockedCadence, quotes]);
  const shouldShowReviewPriceNote = displayQuotes.some(
    (quote) => quote.firstCleanPriceCents === 0,
  );
  const heading = lockedCadence
    ? 'Your recurring service is set'
    : 'Add recurring maintenance';
  const lockedQuote = lockedCadence ? displayQuotes[0] : null;
  const planActive = Boolean(recurringPlan && recurringPlan.status === 'active');
  const statusText = lockedCadence
    ? planActive
      ? 'Recurring plan active'
      : 'Recurring plan will be created after deposit confirmation'
    : null;
  const nextRunLabel = (() => {
    if (!lockedCadence || !lockedQuote) return null;
    if (recurringPlan?.nextRunAt) {
      const next = new Date(recurringPlan.nextRunAt);
      if (Number.isFinite(next.getTime())) {
        return `Next recurring visit: ${next.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      }
    }
    if (recurringBeginsAt) {
      const next = new Date(recurringBeginsAt);
      if (Number.isFinite(next.getTime())) {
        return `Next recurring visit: ${next.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      }
    }
    return `Next recurring visit: ${lockedQuote.cadenceDays} days after your first visit`;
  })();
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  async function createPlan(cadence: RecurringCadence) {
    setSubmittingCadence(cadence);
    setCreateError(false);
    setSuccessCadence(null);

    try {
      const response = await fetch(
        `${WEB_ENV.apiBaseUrl}/recurring-plans/create-from-booking`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, cadence }),
        },
      );

      if (!response.ok) {
        throw new Error('Unable to choose recurring cadence.');
      }

      setSuccessCadence(cadence);
    } catch {
      setCreateError(true);
    } finally {
      setSubmittingCadence(null);
    }
  }

  return (
    <div className="border p-4 rounded-xl space-y-4">
      <h3 className="font-semibold text-lg">{heading}</h3>

      <p className="text-sm text-gray-600">
        {lockedCadence
          ? 'Your deposit-confirmed booking locked the recurring service details below.'
          : 'Your first clean gets your home reset. Recurring visits are priced as follow-up maintenance so you can keep the home consistent.'}
      </p>

      {!lockedCadence ? (
        <p className="text-sm text-gray-600">
          Your recurring plan is created after your booking is deposit-confirmed.
        </p>
      ) : null}

      {statusText ? (
        <p className="text-sm font-medium text-green-700">{statusText}</p>
      ) : null}

      {lockedCadence && !planActive ? (
        <p className="text-sm text-gray-600">
          Based on the cadence you selected earlier.
        </p>
      ) : null}

      {quoteLoading ? (
        <p className="text-sm text-gray-600">Loading recurring pricing…</p>
      ) : null}

      {quoteError ? (
        <p className="text-sm text-red-600">
          {lockedCadence
            ? 'Unable to load recurring pricing. Your selected cadence is still saved.'
            : 'Unable to load recurring pricing. You can still choose a cadence.'}
        </p>
      ) : null}

      {shouldShowReviewPriceNote ? (
        <p className="text-sm text-gray-600">
          Recurring price will be confirmed by the team after booking review.
        </p>
      ) : null}

      {createError && !lockedCadence ? (
        <p className="text-sm text-red-600">
          Unable to choose recurring cadence. Please try again.
        </p>
      ) : null}

      {successCadence && !lockedCadence ? (
        <p className="text-sm text-green-700">
          Your {successCadence} recurring cadence is selected.
        </p>
      ) : null}

      <div className={`grid gap-3 ${lockedCadence ? '' : 'md:grid-cols-4'}`}>
        {displayQuotes.map((quote) => (
          <div
            key={quote.cadence}
            className="rounded-xl border border-gray-200 p-3 space-y-3"
          >
            <div>
              <h4 className="font-semibold">
                {lockedCadence
                  ? `Cadence: ${cadenceLabels[quote.cadence]}`
                  : cadenceLabels[quote.cadence]}
              </h4>
              <p className="text-sm text-gray-600">
                {quote.cadenceDays}-day cadence
              </p>
            </div>

            <dl className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between gap-3">
                <dt>First visit:</dt>
                <dd>{formatCurrency(quote.firstCleanPriceCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Recurring visit:</dt>
                <dd>{formatCurrency(quote.recurringPriceCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Save:</dt>
                <dd>
                  {formatCurrency(quote.savingsCents)} /{' '}
                  {quote.discountPercent}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Estimated time:</dt>
                <dd>{quote.estimatedMinutes} minutes</dd>
              </div>
              {nextRunLabel && lockedCadence ? (
                <div className="flex justify-between gap-3">
                  <dt>Next visit:</dt>
                  <dd>{nextRunLabel.replace('Next recurring visit: ', '')}</dd>
                </div>
              ) : null}
              {lockedCadence && visitStructure === 'three_visit_reset' && resetSchedule ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt>Visit 1 date:</dt>
                    <dd>{formatDate(resetSchedule.visit1At)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Visit 2 date:</dt>
                    <dd>{formatDate(resetSchedule.visit2At)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Visit 3 date:</dt>
                    <dd>{formatDate(resetSchedule.visit3At)}</dd>
                  </div>
                </>
              ) : null}
              {lockedCadence && visitStructure !== 'three_visit_reset' && scheduledStart ? (
                <div className="flex justify-between gap-3">
                  <dt>First visit date:</dt>
                  <dd>{formatDate(scheduledStart)}</dd>
                </div>
              ) : null}
              {lockedCadence && recurringBeginsAt ? (
                <div className="flex justify-between gap-3">
                  <dt>Recurring begins:</dt>
                  <dd>{formatDate(recurringBeginsAt)}</dd>
                </div>
              ) : null}
            </dl>

            {!lockedCadence ? (
              <button
                onClick={() => createPlan(quote.cadence)}
                disabled={submittingCadence !== null}
                className="btn-primary w-full"
              >
                Choose {cadenceSentenceLabels[quote.cadence]} recurring
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
