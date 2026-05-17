import type { BookingStatus } from "@/lib/bookings/bookingApiTypes";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending_payment: "bg-slate-100 text-slate-700",
  pending_dispatch: "bg-amber-100 text-amber-700",
  hold: "bg-rose-100 text-rose-700",
  review: "bg-violet-100 text-violet-700",
  offered: "bg-indigo-100 text-indigo-700",
  assigned: "bg-violet-100 text-violet-700",
  accepted: "bg-sky-100 text-sky-700",
  en_route: "bg-sky-100 text-sky-700",
  active: "bg-sky-100 text-sky-700",
  in_progress: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  canceled: "bg-slate-200 text-slate-600",
  cancelled: "bg-slate-200 text-slate-600",
  exception: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Payment needed",
  pending_dispatch: "Scheduling your team",
  hold: "Time held",
  review: "Reviewing details",
  offered: "Visit offered",
  assigned: "Team assigned",
  accepted: "Visit accepted",
  en_route: "On the way",
  active: "Visit active",
  in_progress: "Visit in progress",
  completed: "Completed",
  canceled: "Canceled",
  cancelled: "Canceled",
  exception: "Needs attention",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
