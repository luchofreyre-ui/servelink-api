"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  selectFoAuthorityHasTaggedRowsFromScreen,
  selectFoAuthorityReviewStatusFromScreen,
  selectFoAuthorityTagSourceFromScreen,
  selectFoKnowledgeLinksFromScreen,
} from "@/booking-screen/foKnowledgeScreenSelectors";
import { submitFoAuthorityKnowledgeFeedback } from "@/lib/api/foAuthorityKnowledgeFeedback";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";

const KIND_LABEL: Record<string, string> = {
  problem: "Problem",
  surface: "Surface",
  method: "Method",
};

function kindLabel(kind: string): string {
  if (KIND_LABEL[kind]) return KIND_LABEL[kind]!;
  const fromSlug = kind.replace(/-/g, " ").trim();
  return fromSlug ? fromSlug : "Topic";
}

function reviewStatusHint(
  source: ReturnType<typeof selectFoAuthorityTagSourceFromScreen>,
  review: ReturnType<typeof selectFoAuthorityReviewStatusFromScreen>,
): string | null {
  if (source !== "persisted" || !review) return null;
  if (review === "reviewed") {
    return "Ops reviewed the saved classification for this booking.";
  }
  if (review === "overridden") {
    return "Ops updated the saved classification for this booking.";
  }
  return "Saved classification (auto).";
}

export function FoRecommendedKnowledgeBlock({
  bookingId,
  screen,
}: {
  bookingId: string;
  screen: unknown;
}) {
  const links = selectFoKnowledgeLinksFromScreen(screen);
  const source = selectFoAuthorityTagSourceFromScreen(screen);
  const review = selectFoAuthorityReviewStatusFromScreen(screen);
  const hasTaggedRows = selectFoAuthorityHasTaggedRowsFromScreen(screen);
  const reviewHint = reviewStatusHint(source, review);

  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const submitLock = useRef(false);

  const submit = useCallback(
    async (helpful: boolean) => {
      if (status === "done" || status === "submitting") {
        return;
      }
      if (submitLock.current) {
        return;
      }
      submitLock.current = true;
      const token = getStoredAccessToken();
      if (!token) {
        submitLock.current = false;
        setErrorMsg("Sign in again to send feedback.");
        setStatus("error");
        return;
      }
      setStatus("submitting");
      setErrorMsg(null);
      try {
        const path =
          links[0]?.pathname && helpful ? links[0]!.pathname : undefined;
        await submitFoAuthorityKnowledgeFeedback(WEB_ENV.apiBaseUrl, token, bookingId, {
          helpful,
          selectedKnowledgePath: path,
          notes: note.trim() || undefined,
        });
        setStatus("done");
        setNote("");
      } catch (e) {
        submitLock.current = false;
        setErrorMsg(e instanceof Error ? e.message : "Could not send feedback.");
        setStatus("error");
      }
    },
    [bookingId, links, note, status],
  );

  const showFeedback = links.length > 0 || hasTaggedRows;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
      data-testid="fo-recommended-knowledge"
    >
      <p className="font-semibold text-slate-900">Recommended knowledge</p>
      <p className="mt-1 text-xs text-slate-600">
        Execution-oriented topics from booking intelligence. For a guided surface + problem flow use{" "}
        <span className="font-medium text-slate-800">Open Quick Solve</span> above; to search the full
        encyclopedia use <span className="font-medium text-slate-800">Search Knowledge</span>. Always confirm
        what you see on site before following any playbook.
      </p>

      {links.length > 0 ? (
        <>
          {source ? (
            <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-500">
              {source === "persisted"
                ? "Source: saved intelligence"
                : "Source: derived from notes & quote"}
            </p>
          ) : null}
          {reviewHint ? (
            <p className="mt-1 text-[0.65rem] text-slate-500">{reviewHint}</p>
          ) : null}
          <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {links.map((item) => (
              <li
                key={`${item.kind}:${item.pathname}`}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2"
              >
                <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">
                  {kindLabel(item.kind)}
                </span>
                <Link
                  href={preferEncyclopediaCanonicalHref(item.pathname)}
                  className="min-w-0 flex-1 text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
                >
                  {item.title}
                </Link>
                {item.sourceTags.length > 0 ? (
                  <span
                    className="w-full font-mono text-[0.65rem] text-slate-500"
                    title={item.sourceTags.join(", ")}
                  >
                    Tags: {item.sourceTags.slice(0, 4).join(", ")}
                    {item.sourceTags.length > 4 ? "…" : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : hasTaggedRows ? (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
          This booking has saved classification tags, but none map to public knowledge articles yet.
          Use job notes and the Knowledge Hub for execution guidance.
          {reviewHint ? ` ${reviewHint}` : ""}
        </p>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
          No authority-linked topics for this booking yet. Review job notes and use Knowledge Hub for
          general playbooks.
        </p>
      )}

      {showFeedback ? (
        <div
          className="mt-4 border-t border-slate-100 pt-3"
          data-testid="fo-knowledge-feedback"
        >
          <p className="text-xs font-medium text-slate-700">Was this helpful?</p>
          {status === "done" ? (
            <p className="mt-2 text-xs text-emerald-700" data-testid="fo-knowledge-feedback-thanks">
              Feedback received — thank you. You can continue working; no further action needed here.
            </p>
          ) : (
            <>
              {status === "submitting" ? (
                <p className="mt-2 text-xs text-slate-500" data-testid="fo-knowledge-feedback-sending">
                  Sending feedback…
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={status === "submitting"}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={() => void submit(true)}
                  data-testid="fo-knowledge-feedback-useful"
                >
                  Useful
                </button>
                <button
                  type="button"
                  disabled={status === "submitting"}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-50"
                  onClick={() => void submit(false)}
                  data-testid="fo-knowledge-feedback-not-useful"
                >
                  Not useful
                </button>
              </div>
              <label className="mt-2 block text-[0.65rem] text-slate-500">
                Optional note
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={status === "submitting"}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900"
                  data-testid="fo-knowledge-feedback-note"
                />
              </label>
              {errorMsg ? (
                <p className="mt-1 text-xs text-red-600" data-testid="fo-knowledge-feedback-error">
                  {errorMsg}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
