type AdminEmptyStateProps = {
  title: string;
  description?: string;
};

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center"
      role="status"
    >
      <p className="text-sm font-medium text-white">{title}</p>
      {description ? <p className="mt-2 text-sm text-white/60">{description}</p> : null}
    </div>
  );
}
