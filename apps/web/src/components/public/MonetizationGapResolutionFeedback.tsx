"use client";

import { useEffect, useMemo, useState } from "react";

import {
  dismissMonetizationGapInAdmin,
  loadGapResolutionFeedback,
  saveGapResolutionFeedback,
  type ResolutionAction,
} from "@/lib/funnel/funnelGapResolution";

type FeedbackVariant = "public" | "admin";

type FeedbackProps = {
  problemSlug: string;
  gapCode?: string;
  variant?: FeedbackVariant;
  onAfterAction?: () => void;
};

function actionLabel(action: ResolutionAction): string {
  switch (action) {
    case "acknowledge":
      return "Acknowledged";
    case "resolve":
      return "Resolved";
    case "suppress":
      return "Suppressed";
    default:
      return action;
  }
}

export function MonetizationGapResolutionFeedback({
  problemSlug,
  gapCode,
  variant = "public",
  onAfterAction,
}: FeedbackProps) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<ReturnType<typeof loadGapResolutionFeedback>>(null);

  useEffect(() => {
    setSaved(loadGapResolutionFeedback(problemSlug));
  }, [problemSlug]);

  const summary = useMemo(() => {
    if (!saved) return null;
    const parts = [
      actionLabel(saved.action),
      saved.note ? `— ${saved.note}` : "",
      `(${new Date(saved.at).toLocaleString()})`,
    ].filter(Boolean);
    return parts.join(" ");
  }, [saved]);

  const handleAction = (action: ResolutionAction) => {
    saveGapResolutionFeedback(problemSlug, action, note, gapCode);
    dismissMonetizationGapInAdmin(problemSlug);
    setSaved(loadGapResolutionFeedback(problemSlug));
    setNote("");
    onAfterAction?.();
  };

  const isAdmin = variant === "admin";
  const buttonClass = isAdmin
    ? "rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
    : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 hover:bg-slate-50";

  return (
    <div className="space-y-3">
      {saved ? (
        <div
          className={
            isAdmin
              ? "rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2 py-1.5 text-xs text-emerald-100"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          }
        >
          <div className="font-medium">Recorded</div>
          <div
            className={
              isAdmin ? "mt-0.5 text-emerald-200/90" : "mt-0.5 text-emerald-800"
            }
          >
            {summary}
          </div>
        </div>
      ) : (
        <>
          <label className="block text-xs text-slate-400">
            Optional note (why resolve / acknowledge / suppress)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={
                isAdmin
                  ? "mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  : "mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              }
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => handleAction("resolve")}>
              Resolve
            </button>
            <button type="button" className={buttonClass} onClick={() => handleAction("acknowledge")}>
              Acknowledge
            </button>
            <button type="button" className={buttonClass} onClick={() => handleAction("suppress")}>
              Suppress
            </button>
          </div>
        </>
      )}
    </div>
  );
}
