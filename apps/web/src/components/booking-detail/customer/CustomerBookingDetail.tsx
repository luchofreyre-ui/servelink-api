export function CustomerBookingDetail({ screen }: { screen: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">Your service</p>
      <p className="mt-2 text-xs text-slate-500">
        Detailed status is shown here when your booking is active. Internal operations metrics are never
        exposed on this page.
      </p>
      <pre className="mt-4 max-h-80 overflow-auto text-xs whitespace-pre-wrap text-slate-600">
        {JSON.stringify(screen, null, 2)}
      </pre>
    </div>
  );
}
