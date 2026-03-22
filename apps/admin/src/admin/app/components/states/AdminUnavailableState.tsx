type AdminUnavailableStateProps = {
  title?: string;
  description?: string;
  endpointLabel?: string;
};

const DEFAULT_TITLE = "Backend route unavailable";
const DEFAULT_DESCRIPTION =
  "This admin surface is wired, but the backend route is not available yet.";

export function AdminUnavailableState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  endpointLabel,
}: AdminUnavailableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/50 py-12 px-4 text-center">
      <p className="text-sm font-medium text-amber-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-amber-800">{description}</p>
      {endpointLabel ? (
        <p className="mt-2 text-xs text-amber-700 font-mono">{endpointLabel}</p>
      ) : null}
    </div>
  );
}
