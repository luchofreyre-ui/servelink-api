import { PropsWithChildren } from "react";

type AdminTableProps = PropsWithChildren<{
  columns: React.ReactNode;
}>;

export function AdminTable({ columns, children }: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">{columns}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
