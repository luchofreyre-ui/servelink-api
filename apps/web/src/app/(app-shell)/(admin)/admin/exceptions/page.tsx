"use client";

import { useState } from "react";
import { buildPortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import { buildDispatchExceptions } from "@/operations/dispatchExceptions/dispatchExceptionSelectors";
import type { DispatchException } from "@/operations/dispatchExceptions/dispatchExceptionTypes";
import DispatchExceptionsTable from "@/components/operations/admin/DispatchExceptionsTable";
import DispatchExceptionDetailDrawer from "@/components/operations/admin/DispatchExceptionDetailDrawer";

export default function DispatchExceptionsPage() {
  // TODO: replace with real fetch
  const mockScreens: unknown[] = [];

  const snapshot = buildPortfolioOperationalSnapshot({
    bookingScreens: mockScreens,
    source: "admin_console",
  });
  const exceptions = buildDispatchExceptions(snapshot);

  const [selected, setSelected] = useState<DispatchException | null>(null);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Dispatch Exceptions</h1>

      <DispatchExceptionsTable data={exceptions} onSelect={(e) => setSelected(e)} />

      <DispatchExceptionDetailDrawer exception={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
