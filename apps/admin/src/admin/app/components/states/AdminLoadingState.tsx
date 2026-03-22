type AdminLoadingStateProps = {
  message?: string;
};

export function AdminLoadingState({ message = "Loading…" }: AdminLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-12 px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      <p className="mt-3 text-sm text-gray-600">{message}</p>
    </div>
  );
}
