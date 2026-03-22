import type { DecisionConsistencyFinding } from "@/standards/decisionConsistencyModel";

export function AdminConsistencyQueueCard({
  findings,
}: {
  findings: DecisionConsistencyFinding[];
}) {
  const hot = findings.filter(
    (f) => f.consistencyState !== "aligned" && f.consistencyState !== "acceptable_variant",
  );
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Consistency queue</h2>
      <p className="mt-1 text-xs text-slate-600">
        Bookings where live posture diverges from documented standards ({hot.length} open).
      </p>
      <ul className="mt-3 space-y-2 text-xs">
        {hot.slice(0, 8).map((f) => (
          <li key={`${f.bookingId}-${f.standardId}`} className="rounded-lg bg-white p-2 ring-1 ring-amber-100">
            <p className="font-medium text-slate-900">
              {f.standardTitle}{" "}
              <span className="text-slate-500">· {f.consistencyState.replace(/_/g, " ")}</span>
            </p>
            <p className="text-slate-600">Booking {f.bookingId}</p>
            <p className="mt-1 text-slate-700">{f.deviationReason}</p>
            <p className="mt-1 font-medium text-amber-900">{f.suggestedCorrection}</p>
          </li>
        ))}
        {hot.length === 0 ? (
          <li className="text-slate-600">No active consistency gaps in this sweep.</li>
        ) : null}
      </ul>
    </section>
  );
}
