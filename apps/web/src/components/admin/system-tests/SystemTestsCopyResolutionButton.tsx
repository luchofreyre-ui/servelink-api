"use client";

import { useState } from "react";
import { buildSystemTestCursorReadyText } from "@/lib/systemTests/resolution";
import type { SystemTestFixRecommendation } from "@/types/systemTestResolution";

interface SystemTestsCopyResolutionButtonProps {
  recommendation: SystemTestFixRecommendation;
}

export function SystemTestsCopyResolutionButton({
  recommendation,
}: SystemTestsCopyResolutionButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = buildSystemTestCursorReadyText(recommendation);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      data-testid="system-tests-copy-resolution-button"
    >
      {copied ? "Copied" : "Copy Cursor fix"}
    </button>
  );
}
