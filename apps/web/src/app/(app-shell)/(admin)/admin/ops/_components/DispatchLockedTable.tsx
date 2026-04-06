"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  releaseDispatchLock,
  triggerRedispatch,
} from "@/lib/admin/ops";
import { opsAllowed, opsDisabledReason, opsShowAction } from "./opsRowFlags";

const linkBtn =
  "inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50";
const actionBtn =
  "inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50";

type RowState = {
  loading?: "release" | "redispatch";
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

export function DispatchLockedTable({
  items,
  columns,
}: {
  items: Array<Record<string, unknown>>;
  columns: string[];
}) {
  const router = useRouter();
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  const runAction = useCallback(
    async (
      bookingId: string,
      kind: "release" | "redispatch",
      fn: () => ReturnType<typeof releaseDispatchLock>,
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
      <div className="p-4 text-sm text-gray-500">No records</div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">booking</th>
          {columns
            .filter((c) => c !== "id")
            .map((c) => (
              <th key={c} className="p-2 text-left">
                {c}
              </th>
            ))}
          <th className="p-2 text-left">actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row) => {
          const id = String(row.id ?? "");
          const st = rowState[id] ?? {};
          const canRelease = opsAllowed(row, "canReleaseDispatchLock");
          const releaseWhy = opsDisabledReason(
            row,
            "releaseDispatchLockDisabledReason",
          );
          const canRedispatch = opsAllowed(row, "canTriggerRedispatch");
          const redispatchWhy = opsDisabledReason(
            row,
            "triggerRedispatchDisabledReason",
          );
          const showRelease = opsShowAction(
            row,
            "canReleaseDispatchLock",
            "releaseDispatchLockDisabledReason",
          );
          const showRedispatch = opsShowAction(
            row,
            "canTriggerRedispatch",
            "triggerRedispatchDisabledReason",
          );

          return (
            <tr key={id} className="border-b align-top">
              <td className="p-2 font-medium">
                <Link href={`/admin/bookings/${id}`} className="underline">
                  {id}
                </Link>
              </td>
              {columns
                .filter((c) => c !== "id")
                .map((c) => (
                  <td key={c} className="p-2">
                    {formatCell(row[c])}
                  </td>
                ))}
              <td className="p-2">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/bookings/${id}`} className={`${linkBtn} underline`}>
                      Open booking
                    </Link>
                    <Link href="/admin/exceptions" className={linkBtn}>
                      Exceptions
                    </Link>
                    {showRelease ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canRelease || Boolean(st.loading)}
                        title={!canRelease ? releaseWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(id, "release", () => releaseDispatchLock(id))
                        }
                      >
                        {st.loading === "release" ? "…" : "Release lock"}
                      </button>
                    ) : null}
                    {showRedispatch ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={!canRedispatch || Boolean(st.loading)}
                        title={!canRedispatch ? redispatchWhy ?? undefined : undefined}
                        onClick={() =>
                          runAction(id, "redispatch", () => triggerRedispatch(id))
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
