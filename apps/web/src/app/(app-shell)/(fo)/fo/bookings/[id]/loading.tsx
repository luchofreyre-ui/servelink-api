export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-40 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
