export function CustomerActiveBookingCard({ screen }: { screen: unknown }) {
  const root = screen && typeof screen === "object" ? (screen as Record<string, unknown>) : {};
  const booking = root.booking && typeof root.booking === "object" ? (root.booking as { id?: string }) : {};
  const id = booking.id != null ? String(booking.id) : null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Active booking</h2>
      {id ? (
        <p className="mt-2 text-sm text-slate-700">Reference #{id}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No active booking in this session.</p>
      )}
    </section>
  );
}
