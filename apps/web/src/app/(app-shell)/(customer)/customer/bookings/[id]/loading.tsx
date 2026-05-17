export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6" aria-busy="true">
      <p className="text-sm font-medium text-slate-700">Opening your Nu Standard visit details…</p>
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded bg-gray-200" />
      <div className="h-40 animate-pulse rounded bg-gray-200" />
      <div className="h-64 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
