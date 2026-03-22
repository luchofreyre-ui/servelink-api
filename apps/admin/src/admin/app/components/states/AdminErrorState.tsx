type AdminErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function AdminErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: AdminErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 py-8 px-4 text-center">
      <p className="text-sm font-medium text-red-800">{title}</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
