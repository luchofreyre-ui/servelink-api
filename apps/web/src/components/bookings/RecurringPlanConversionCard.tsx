'use client';

import { useEffect, useMemo, useState } from 'react';
import { WEB_ENV } from '@/lib/env';

type RecurringCadence = 'weekly' | 'biweekly' | 'monthly';

type RecurringOfferQuote = {
  cadence: RecurringCadence;
  firstCleanPriceCents: number;
  recurringPriceCents: number;
  savingsCents: number;
  discountPercent: number;
  estimatedMinutes: number;
};

const cadenceLabels: Record<RecurringCadence, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

const fallbackQuotes: RecurringOfferQuote[] = [
  {
    cadence: 'weekly',
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 15,
    estimatedMinutes: 120,
  },
  {
    cadence: 'biweekly',
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 10,
    estimatedMinutes: 120,
  },
  {
    cadence: 'monthly',
    firstCleanPriceCents: 0,
    recurringPriceCents: 0,
    savingsCents: 0,
    discountPercent: 5,
    estimatedMinutes: 120,
  },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function RecurringPlanConversionCard({
  bookingId,
}: {
  bookingId: string;
}) {
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
        const response = await fetch(
          `${WEB_ENV.apiBaseUrl}/recurring-plans/offer-quote?bookingId=${encodeURIComponent(
            bookingId,
          )}`,
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
  }, [bookingId]);

  const displayQuotes = useMemo(() => quotes ?? fallbackQuotes, [quotes]);
  const shouldShowReviewPriceNote = displayQuotes.some(
    (quote) => quote.firstCleanPriceCents === 0,
  );

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
        throw new Error('Unable to start recurring plan.');
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
      <h3 className="font-semibold text-lg">
        Keep your home on a recurring plan
      </h3>

      <p className="text-sm text-gray-600">
        Your first clean gets your home reset. Recurring visits are priced as
        follow-up maintenance so you can keep the home consistent.
      </p>

      <p className="text-sm text-gray-600">
        Your recurring plan is created after your booking is deposit-confirmed.
      </p>

      {quoteLoading ? (
        <p className="text-sm text-gray-600">Loading recurring pricing…</p>
      ) : null}

      {quoteError ? (
        <p className="text-sm text-red-600">
          Unable to load recurring pricing. You can still choose a cadence.
        </p>
      ) : null}

      {shouldShowReviewPriceNote ? (
        <p className="text-sm text-gray-600">
          Recurring price will be confirmed by the team after booking review.
        </p>
      ) : null}

      {createError ? (
        <p className="text-sm text-red-600">
          Unable to start recurring plan. Please try again.
        </p>
      ) : null}

      {successCadence ? (
        <p className="text-sm text-green-700">
          Your {successCadence} recurring plan has been started.
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {displayQuotes.map((quote) => (
          <div
            key={quote.cadence}
            className="rounded-xl border border-gray-200 p-3 space-y-3"
          >
            <div>
              <h4 className="font-semibold">{cadenceLabels[quote.cadence]}</h4>
              <p className="text-sm text-gray-600">
                {quote.discountPercent}% recurring discount
              </p>
            </div>

            <dl className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between gap-3">
                <dt>First clean:</dt>
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
            </dl>

            <button
              onClick={() => createPlan(quote.cadence)}
              disabled={submittingCadence !== null}
              className="btn-primary w-full"
            >
              Start {quote.cadence} plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
