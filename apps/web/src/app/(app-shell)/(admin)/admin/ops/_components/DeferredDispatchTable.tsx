"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  assignExceptionToMeForBooking,
  resolveExceptionForBooking,
  triggerRedispatch,
} from "@/lib/admin/ops";
import { opsAllowed, opsDisabledReason, opsShowAction } from "./opsRowFlags";

const linkBtn =
  "inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50";
const actionBtn =
  "inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50";

type RowOp = "redispatch" | "assign" | "resolve";

type RowState = {
  loading?: RowOp;
  feedback?: string;
  feedbackOk?: boolean;
};

function formatCell(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function DeferredDispatchTable({
  items,
}: {
  items: Array<Record<string, unknown>>;
}) {
  const router = useRouter();
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  const runAction = useCallback(
    async (rowKey: string, bookingId: string, op: RowOp, fn: () => Promise<unknown>) => {
      setRowState((s) => ({
        ...s,
        [rowKey]: {
          ...s[rowKey],
          loading: op,
          feedback: undefined,
        },
      }));
      try {
        await fn();
        setRowState((s) => ({
          ...s,
          [rowKey]: {
            ...s[rowKey],
            loading: undefined,
            feedback: "Done.",
            feedbackOk: true,
          },
        }));
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setRowState((s) => ({
          ...s,
          [rowKey]: {
            ...s[rowKey],
            loading: undefined,
            feedback: msg,
            feedbackOk: false,
          },
        }));
      }
    },
    [router],
  );

  if (!items.length) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No deferred dispatch decisions
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">booking</th>
          <th className="p-2 text-left">trigger</th>
          <th className="p-2 text-left">decisionStatus</th>
          <th className="p-2 text-left">createdAt</th>
          <th className="p-2 text-left">actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => {
          const bookingId = String(row.bookingId ?? index);
          const rowKey = `${bookingId}-${index}`;
          const st = rowState[rowKey] ?? {};
          const busy = Boolean(st.loading);

          const canAssign = opsAllowed(row, "canAssignExceptionToMe");
          const assignWhy = opsDisabledReason(
            row,
            "assignExceptionToMeDisabledReason",
          );
          const canResolve = opsAllowed(row, "canResolveException");
          const resolveWhy = opsDisabledReason(
            row,
            "resolveExceptionDisabledReason",
          );
          const canRedispatch = opsAllowed(row, "canTriggerRedispatch");
          const redispatchWhy = opsDisabledReason(
            row,
            "triggerRedispatchDisabledReason",
          );
          const showAssign = opsShowAction(
            row,
            "canAssignExceptionToMe",
            "assignExceptionToMeDisabledReason",
          );
          const showResolve = opsShowAction(
            row,
            "canResolveException",
            "resolveExceptionDisabledReason",
          );
          const showRedispatch = opsShowAction(
            row,
            "canTriggerRedispatch",
            "triggerRedispatchDisabledReason",
          );

          return (
            <tr key={rowKey} className="border-b align-top">
              <td className="p-2 font-medium">
                <Link
                  href={`/admin/bookings/${bookingId}`}
                  className="underline"
                >
                  {bookingId}
                </Link>
              </td>
              <td className="p-2">{formatCell(row.trigger)}</td>
              <td className="p-2">{formatCell(row.decisionStatus)}</td>
              <td className="p-2">{formatCell(row.createdAt)}</td>
              <td className="p-2">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/bookings/${bookingId}`}
                      className={`${linkBtn} underline`}
                    >
                      Open booking
                    </Link>
                    <Link href="/admin/exceptions" className={linkBtn}>
                      Exceptions
                    </Link>
                    {showAssign ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canAssign || busy}
                        title={!canAssign ? assignWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(rowKey, bookingId, "assign", () =>
                            assignExceptionToMeForBooking(bookingId),
                          )
                        }
                      >
                        {st.loading === "assign" ? "…" : "Assign to me"}
                      </button>
                    ) : null}
                    {showResolve ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canResolve || busy}
                        title={!canResolve ? resolveWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(rowKey, bookingId, "resolve", () =>
                            resolveExceptionForBooking(bookingId),
                          )
                        }
                      >
                        {st.loading === "resolve" ? "…" : "Mark resolved"}
                      </button>
                    ) : null}
                    {showRedispatch ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canRedispatch || busy}
                        title={!canRedispatch ? redispatchWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(rowKey, bookingId, "redispatch", () =>
                            triggerRedispatch(bookingId),
                          )
                        }
                      >
                        {st.loading === "redispatch" ? "…" : "Redispatch"}
                      </button>
                    ) : null}
                  </div>
                  {st.feedback ? (
                    <span
                      className={
                        st.feedbackOk
                          ? "text-xs text-green-700"
                          : "text-xs text-red-600"
                      }
                    >
                      {st.feedback}
                    </span>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
