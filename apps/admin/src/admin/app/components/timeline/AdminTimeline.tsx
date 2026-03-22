export type AdminTimelineEvent = {
  id: string;
  type: string;
  createdAt: string;
  actorLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

type AdminTimelineProps = {
  events: AdminTimelineEvent[];
  emptyMessage?: string;
};

export function AdminTimeline({ events, emptyMessage = "No events." }: AdminTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white">
      <ul className="divide-y divide-gray-100">
        {events.map((event) => (
          <li key={event.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                {event.actorLabel ? (
                  <p className="mt-0.5 text-xs text-gray-500">{event.actorLabel}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-gray-500">{event.type}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{event.createdAt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
