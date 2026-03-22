import { PropsWithChildren } from "react";

export function AdminFilterBar({ children }: PropsWithChildren) {
  return (
    <div className="mb-4 rounded-2xl border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </div>
  );
}
