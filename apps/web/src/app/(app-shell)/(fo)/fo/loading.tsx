export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-8 w-48 animate-pulse rounded bg-slate-200" />
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
          Preparing your owner operations view with today&apos;s work, consistency signals, and portfolio
          guidance.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
