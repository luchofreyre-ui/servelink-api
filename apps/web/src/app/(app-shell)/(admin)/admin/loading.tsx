export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-48 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
