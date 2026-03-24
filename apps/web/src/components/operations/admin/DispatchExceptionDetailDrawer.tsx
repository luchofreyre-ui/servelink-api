"use client";

import Link from "next/link";
import type { DispatchException } from "@/operations/dispatchExceptions/dispatchExceptionTypes";
import { findStandardForDispatchException } from "@/operations/dispatchExceptions/dispatchExceptionSelectors";

interface Props {
  exception: DispatchException | null;
  onClose: () => void;
}

export default function DispatchExceptionDetailDrawer({
  exception,
  onClose,
}: Props) {
  if (!exception) return null;

  const standard = findStandardForDispatchException(exception);

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] overflow-y-auto border-l bg-white p-6 shadow-xl">
      <button type="button" onClick={onClose} className="mb-4 text-sm text-slate-600">
        Close
      </button>

      <h2 className="text-lg font-semibold text-slate-950">Exception Detail</h2>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div>
          <strong>Type:</strong> {exception.type}
        </div>
        <div>
          <strong>Booking:</strong> {exception.bookingId}
        </div>
        <div>
          <strong>FO:</strong> {exception.foId || "—"}
        </div>
        <div>
          <strong>Severity:</strong> {exception.severity}
        </div>
        <div>
          <strong>Summary:</strong> {exception.summary}
        </div>
        {exception.apiDetail ? (
          <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs">
            <div>
              <strong>Booking status:</strong>{" "}
              {exception.apiDetail.bookingStatus ?? "—"}
            </div>
            <div>
              <strong>Recommended action:</strong> {exception.apiDetail.recommendedAction}
            </div>
            <div>
              <strong>Dispatch passes:</strong> {exception.apiDetail.totalDispatchPasses}
            </div>
            <div>
              <strong>Priority:</strong> {exception.apiDetail.priorityBucket}
            </div>
            <div>
              <strong>Follow-up:</strong>{" "}
              {exception.apiDetail.requiresFollowUp ? "Yes" : "No"}
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <Link
            href={`/admin/bookings/${exception.bookingId}`}
            className="text-sm font-medium text-teal-700 underline"
          >
            Open booking command center →
          </Link>
        </div>
      </div>

      {standard ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="font-medium text-slate-950">Expected Standard</h3>

          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">{standard.title}</p>
              <p className="mt-1">{standard.scenarioSignature}</p>
            </div>

            <div>
              <p className="font-medium text-slate-900">Recommended decision path</p>
              <p className="mt-1">{standard.recommendedDecisionPath}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
