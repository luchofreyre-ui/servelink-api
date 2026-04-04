"use client";

import { useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * Collapses long research blocks (expert, safety, misuse, sources, etc.) behind a single control.
 */
export function ProductResearchCollapsibleDetail({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6" data-testid="product-research-collapsible">
      <button
        type="button"
        data-testid="product-research-detail-toggle"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-neutral-600 underline"
      >
        {open ? "Hide detailed analysis" : "Show detailed analysis"}
      </button>
      {open ?
        <div className="mt-4 space-y-8" data-testid="product-research-detail-expanded">
          {children}
        </div>
      : null}
    </div>
  );
}
