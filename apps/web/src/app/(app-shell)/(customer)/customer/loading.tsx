export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6" aria-busy="true">
      <p className="text-sm font-medium text-slate-700">Preparing your Nu Standard visit home…</p>
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-48 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
