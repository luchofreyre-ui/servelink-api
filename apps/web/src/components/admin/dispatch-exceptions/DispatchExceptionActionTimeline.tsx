"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  DispatchExceptionActionEvent,
  DispatchExceptionActionEventType,
} from "@/types/dispatchExceptionActions";

function eventLabel(type: DispatchExceptionActionEventType): string {
  const map: Record<DispatchExceptionActionEventType, string> = {
    action_created: "Action created",
    assigned: "Owner assigned",
    unassigned: "Owner removed",
    priority_changed: "Priority changed",
    status_changed: "Status changed",
    note_added: "Note added",
    exception_seen: "Exception seen",
    validation_passed: "Validation passed",
    validation_failed: "Validation failed",
    reopened: "Exception reopened",
    sla_started: "SLA started",
    sla_due_soon: "SLA due soon",
    sla_overdue: "SLA overdue",
    escalation_ready: "Escalation ready",
    notification_queued: "Notification queued",
  };
  return map[type] ?? type;
}

function formatMetadataSummary(
  type: DispatchExceptionActionEventType,
  meta: Record<string, unknown> | null,
): string {
  if (!meta) return "";
  const r = (k: string) => meta[k];

  switch (type) {
    case "status_changed": {
      const before = r("beforeStatus");
      const after = r("afterStatus");
      const reason = r("reason");
      const parts = [
        typeof before === "string" && typeof after === "string" ?
          `${before} → ${after}`
        : "",
        typeof reason === "string" ? `Reason: ${reason}` : "",
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "priority_changed": {
      const before = r("beforePriority");
      const after = r("afterPriority");
      if (typeof before === "string" && typeof after === "string") {
        return `${before} → ${after}`;
      }
      return "";
    }
    case "assigned":
    case "unassigned": {
      const before = r("beforeOwnerUserId");
      const after = r("afterOwnerUserId");
      const b =
        before === null || before === undefined ? "Unassigned" : String(before);
      const a =
        after === null || after === undefined ? "Unassigned" : String(after);
      return `${b} → ${a}`;
    }
    case "reopened": {
      const reason = r("reason");
      return typeof reason === "string" ? `Reason: ${reason}` : "";
    }
    case "validation_failed":
    case "validation_passed": {
      const reason = r("reason");
      return typeof reason === "string" ? `Reason: ${reason}` : "";
    }
    case "note_added": {
      const id = r("noteId");
      return id ? `Note id: ${String(id)}` : "";
    }
    case "exception_seen": {
      const exId = r("lastSeenExceptionId");
      return exId != null ? `Exception ref: ${String(exId)}` : "";
    }
    case "sla_due_soon":
    case "sla_overdue": {
      const due = r("slaDueAt");
      const hours = r("slaPolicyHours");
      const parts = [
        typeof due === "string" ? `Due: ${due}` : "",
        typeof hours === "number" ? `Policy: ${hours}h` : "",
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "escalation_ready": {
      const due = r("slaDueAt");
      const pri = r("priority");
      const mins = r("overdueMinutes");
      const parts = [
        typeof due === "string" ? `Due: ${due}` : "",
        typeof pri === "string" ? `Priority: ${pri}` : "",
        typeof mins === "number" ? `Overdue: ${mins}m` : "",
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "notification_queued": {
      const reason = r("reason");
      const pri = r("priority");
      const st = r("status");
      const owner = r("ownerUserId");
      const due = r("slaDueAt");
      const reopens = r("reopenCount");
      const parts = [
        typeof reason === "string" ? `Reason: ${reason}` : "",
        typeof pri === "string" ? `Priority: ${pri}` : "",
        typeof st === "string" ? `Status: ${st}` : "",
        owner === null ? "Owner: unassigned"
        : owner !== undefined ? `Owner: ${String(owner)}`
        : "",
        typeof due === "string" ? `SLA due: ${due}` : "",
        typeof reopens === "number" ? `Reopens: ${reopens}` : "",
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "sla_started":
      return "";
    default:
      return "";
  }
}

type Props = {
  events: DispatchExceptionActionEvent[];
};

export function DispatchExceptionActionTimeline({ events }: Props) {
  const ordered = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [events],
  );

  if (!ordered.length) {
    return <p className="text-sm text-white/45">No timeline events yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {ordered.map((ev) => {
        const meta =
          ev.metadataJson &&
          typeof ev.metadataJson === "object" &&
          !Array.isArray(ev.metadataJson)
            ? (ev.metadataJson as Record<string, unknown>)
            : null;
        const summary = formatMetadataSummary(ev.type, meta);
        const eventBookingId =
          ev.type === "exception_seen" && typeof meta?.bookingId === "string" ?
            meta.bookingId
          : null;
        return (
          <li
            key={ev.id}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
          >
            <div className="font-medium text-white">{eventLabel(ev.type)}</div>
            <div className="mt-0.5 text-xs text-white/50">
              {ev.actorName || ev.actorUserId || "System"} ·{" "}
              {new Date(ev.createdAt).toLocaleString()}
            </div>
            {eventBookingId ?
              <div className="mt-1 font-mono text-[11px] text-white/55">
                Booking:{" "}
                <Link
                  href={`/admin/bookings/${encodeURIComponent(eventBookingId)}`}
                  className="text-sky-300 underline-offset-2 hover:underline"
                >
                  {eventBookingId}
                </Link>
              </div>
            : null}
            {summary ?
              <div className="mt-1 font-mono text-[11px] text-white/55">
                {summary}
              </div>
            : null}
          </li>
        );
      })}
    </ul>
  );
}
