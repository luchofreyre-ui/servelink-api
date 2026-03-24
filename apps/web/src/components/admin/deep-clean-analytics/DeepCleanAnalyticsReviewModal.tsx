"use client";

import { useEffect, useState } from "react";
import {
  DEEP_CLEAN_REVIEW_TAGS,
  DEEP_CLEAN_REVIEW_TAG_LABELS,
} from "@/constants/deepCleanReviewTags";
import { updateAdminDeepCleanCalibrationReview } from "@/lib/api/bookings";
import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";

export function DeepCleanAnalyticsReviewModal(props: {
  row: DeepCleanAnalyticsRowDisplay | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { row, open, onClose, onSaved } = props;
  const [reviewStatus, setReviewStatus] = useState<"unreviewed" | "reviewed">("unreviewed");
  const [tags, setTags] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!row || !open) return;
    setReviewStatus(row.reviewStatus);
    setTags(new Set(row.reviewReasonTags));
    setNote(row.reviewNote ?? "");
    setErr(null);
  }, [row, open]);

  if (!open || !row) return null;

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function submit() {
    const current = row;
    if (!current) return;
    setSaving(true);
    setErr(null);
    try {
      if (reviewStatus === "reviewed" && tags.size === 0) {
        setErr("Select at least one reason tag when marking reviewed.");
        setSaving(false);
        return;
      }
      await updateAdminDeepCleanCalibrationReview(current.bookingId, {
        reviewStatus,
        reviewReasonTags: reviewStatus === "reviewed" ? [...tags] : undefined,
        reviewNote: note.trim() ? note.trim() : null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dc-review-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="dc-review-modal-title" className="text-lg font-semibold text-slate-900">
          Calibration review
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-500">{row.bookingId}</p>

        <div className="mt-4 space-y-3">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="reviewStatus"
                checked={reviewStatus === "unreviewed"}
                onChange={() => setReviewStatus("unreviewed")}
              />
              Unreviewed
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="reviewStatus"
                checked={reviewStatus === "reviewed"}
                onChange={() => setReviewStatus("reviewed")}
              />
              Reviewed
            </label>
          </div>
        </div>

        {reviewStatus === "reviewed" ? (
          <div className="mt-4">
            <span className="text-sm font-medium text-slate-700">Reason tags</span>
            <p className="mt-1 text-xs text-slate-500">
              Likely explanations — not guaranteed truth. At least one required.
            </p>
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {DEEP_CLEAN_REVIEW_TAGS.map((tag) => (
                <li key={tag}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={tags.has(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span>{DEEP_CLEAN_REVIEW_TAG_LABELS[tag]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Note (optional)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short internal context…"
          />
        </label>

        {err ? (
          <p className="mt-3 text-sm text-red-700" data-testid="dc-review-modal-error">
            {err}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void submit()}
            disabled={saving}
            data-testid="dc-review-modal-save"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
