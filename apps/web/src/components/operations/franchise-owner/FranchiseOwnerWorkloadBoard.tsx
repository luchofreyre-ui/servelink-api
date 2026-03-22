export function FranchiseOwnerWorkloadBoard({
  bookingScreens,
}: {
  bookingScreens: unknown[];
}) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Active jobs</h2>
      <ul className="mt-2 space-y-2 text-xs text-slate-700">
        {bookingScreens.slice(0, 15).map((s, i) => {
          const id =
            s &&
            typeof s === "object" &&
            "booking" in s &&
            (s as { booking?: { id?: string } }).booking?.id
              ? String((s as { booking: { id?: string } }).booking.id)
              : `row-${i}`;
          return (
            <li key={id} className="rounded border border-slate-100 px-2 py-1">
              Booking {id}
            </li>
          );
        })}
        {bookingScreens.length === 0 ? <li>No jobs loaded.</li> : null}
      </ul>
    </section>
  );
}
