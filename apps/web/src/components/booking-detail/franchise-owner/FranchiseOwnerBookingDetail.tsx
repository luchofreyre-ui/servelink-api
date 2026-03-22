export function FranchiseOwnerBookingDetail({
  screen,
  fleetScreens: _fleetScreens,
}: {
  screen: unknown;
  fleetScreens: unknown[];
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs">
        <p className="font-medium text-slate-800">Job detail</p>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(screen, null, 2)}
        </pre>
      </section>
    </div>
  );
}
