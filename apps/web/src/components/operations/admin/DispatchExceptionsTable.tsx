"use client";

import type { DispatchException } from "@/operations/dispatchExceptions/dispatchExceptionTypes";

interface Props {
  data: DispatchException[];
  onSelect: (exception: DispatchException) => void;
  /** Override default empty-state copy */
  emptyMessage?: string;
}

export default function DispatchExceptionsTable({
  data,
  onSelect,
  emptyMessage,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100">
          <tr>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Booking</th>
            <th className="p-3 text-left">FO</th>
            <th className="p-3 text-left">Severity</th>
            <th className="p-3 text-left">Summary</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="p-4 text-neutral-500" colSpan={5}>
                {emptyMessage ??
                  "No dispatch exceptions in the current snapshot. Connect live booking screens to populate this view."}
              </td>
            </tr>
          ) : null}
          {data.map((e) => (
            <tr
              key={e.id}
              className="cursor-pointer border-t hover:bg-neutral-50"
              onClick={() => onSelect(e)}
            >
              <td className="p-3">{e.type}</td>
              <td className="p-3">{e.bookingId}</td>
              <td className="p-3">{e.foId || "—"}</td>
              <td className="p-3">{e.severity}</td>
              <td className="p-3">{e.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
