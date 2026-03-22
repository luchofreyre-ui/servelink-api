import type { AdminBookingDispatchTimelineEvent } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

function toneClasses(tone: AdminBookingDispatchTimelineEvent["tone"]): string {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50";
  if (tone === "warning") return "border-amber-200 bg-amber-50";
  if (tone === "critical") return "border-rose-200 bg-rose-50";
  return "border-slate-200 bg-slate-50";
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminBookingDispatchTimelineCard({
  timeline,
}: {
  timeline: AdminBookingDispatchTimelineEvent[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Timeline
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Dispatch history and intervention trace
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        {timeline.map((event) => (
          <div
            key={event.id}
            className={`rounded-2xl border px-5 py-4 ${toneClasses(event.tone)}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{event.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{event.detail}</p>
              </div>
              <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {formatDateTime(event.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
