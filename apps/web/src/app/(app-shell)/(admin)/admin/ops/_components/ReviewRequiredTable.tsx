"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  clearReviewRequired,
  triggerRedispatch,
} from "@/lib/admin/ops";
import { EstimateGovernanceListChips } from "./EstimateGovernanceListChips";
import { opsAllowed, opsDisabledReason, opsShowAction } from "./opsRowFlags";

const linkBtn =
  "inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50";
const actionBtn =
  "inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50";

type RowState = {
  loading?: "clear" | "redispatch";
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

export function ReviewRequiredTable({
  items,
}: {
  items: Array<Record<string, unknown>>;
}) {
  const router = useRouter();
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  const runAction = useCallback(
    async (
      bookingId: string,
      kind: "clear" | "redispatch",
      fn: () => ReturnType<typeof clearReviewRequired>,
    ) => {
      setRowState((s) => ({
        ...s,
        [bookingId]: {
          ...s[bookingId],
          loading: kind,
          feedback: undefined,
        },
      }));
      try {
        await fn();
        setRowState((s) => ({
          ...s,
          [bookingId]: {
            ...s[bookingId],
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
          [bookingId]: {
            ...s[bookingId],
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
      <div className="p-4 text-sm text-gray-500">No review-required bookings</div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">booking</th>
          <th className="p-2 text-left">reason</th>
          <th className="p-2 text-left">source</th>
          <th className="p-2 text-left">updatedAt</th>
          <th className="p-2 text-left">actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => {
          const booking = (row.booking ?? {}) as Record<string, unknown>;
          const bookingId = String(row.bookingId ?? booking.id ?? index);
          const st = rowState[bookingId] ?? {};
          const rowFlags = row as Record<string, unknown>;
          const canClear = opsAllowed(rowFlags, "canClearReviewRequired");
          const clearWhy = opsDisabledReason(
            rowFlags,
            "clearReviewRequiredDisabledReason",
          );
          const canRedispatch = opsAllowed(rowFlags, "canTriggerRedispatch");
          const redispatchWhy = opsDisabledReason(
            rowFlags,
            "triggerRedispatchDisabledReason",
          );
          const showClear = opsShowAction(
            rowFlags,
            "canClearReviewRequired",
            "clearReviewRequiredDisabledReason",
          );
          const showRedispatch = opsShowAction(
            rowFlags,
            "canTriggerRedispatch",
            "triggerRedispatchDisabledReason",
          );

          return (
            <tr key={bookingId} className="border-b align-top">
              <td className="p-2 font-medium">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/bookings/${bookingId}`}
                    className="underline"
                  >
                    {bookingId}
                  </Link>
                  <EstimateGovernanceListChips
                    bookingId={bookingId}
                    governanceSummary={rowFlags.governanceSummary}
                    recurringEconomicsSummary={rowFlags.recurringEconomicsSummary}
                  />
                </div>
              </td>
              <td className="p-2">{formatCell(row.reviewReason)}</td>
              <td className="p-2">{formatCell(row.reviewSource)}</td>
              <td className="p-2">{formatCell(row.updatedAt)}</td>
              <td className="p-2">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/bookings/${bookingId}`}
                      className={`${linkBtn} underline`}
                    >
                      Open booking
                    </Link>
                    {showClear ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canClear || Boolean(st.loading)}
                        title={!canClear ? clearWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(bookingId, "clear", () =>
                            clearReviewRequired(bookingId),
                          )
                        }
                      >
                        {st.loading === "clear" ? "…" : "Clear review"}
                      </button>
                    ) : null}
                    {showRedispatch ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canRedispatch || Boolean(st.loading)}
                        title={!canRedispatch ? redispatchWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(bookingId, "redispatch", () =>
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
