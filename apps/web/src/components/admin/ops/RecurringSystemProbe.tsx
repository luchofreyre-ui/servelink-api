"use client";

import { WEB_ENV } from "@/lib/env";

export function RecurringSystemProbe() {
  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
      <h3 className="text-lg font-semibold">Recurring System Probe</h3>

      <div className="mt-3 flex flex-col gap-2 text-sm">
        <a href="/admin/ops/recurring" className="text-blue-600 underline">
          Go to /admin/ops/recurring
        </a>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`${WEB_ENV.apiBaseUrl}/recurring`, {
              credentials: "include",
            });
            const data = await res.json();
            console.log("RECURRING ROOT:", { status: res.status, data });
            alert(JSON.stringify({ status: res.status, data }, null, 2));
          }}
          className="rounded bg-black px-3 py-2 text-white"
        >
          Test Recurring Root
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`${WEB_ENV.apiBaseUrl}/recurring/debug/routes`, {
              credentials: "include",
            });
            const data = await res.json();
            console.log("RECURRING DEBUG:", { status: res.status, data });
            alert(JSON.stringify({ status: res.status, data }, null, 2));
          }}
          className="rounded bg-black px-3 py-2 text-white"
        >
          Test Recurring Debug Routes
        </button>
      </div>
    </div>
  );
}
