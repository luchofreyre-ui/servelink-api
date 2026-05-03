'use client';

import { useState } from 'react';

export function RecurringPlanConversionCard({
  bookingId,
}: {
  bookingId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function createPlan(cadence: 'weekly' | 'biweekly' | 'monthly') {
    setLoading(true);

    await fetch('/api/v1/recurring-plans/create-from-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, cadence }),
    });

    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="border p-4 rounded-xl space-y-3">
      <h3 className="font-semibold text-lg">
        Continue with recurring cleaning
      </h3>

      <p className="text-sm text-gray-600">
        Choose a schedule to maintain your home consistently.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => createPlan('weekly')}
          disabled={loading}
          className="btn-primary"
        >
          Weekly
        </button>

        <button
          onClick={() => createPlan('biweekly')}
          disabled={loading}
          className="btn-primary"
        >
          Biweekly
        </button>

        <button
          onClick={() => createPlan('monthly')}
          disabled={loading}
          className="btn-primary"
        >
          Monthly
        </button>
      </div>
    </div>
  );
}
