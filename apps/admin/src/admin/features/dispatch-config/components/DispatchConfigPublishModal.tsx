import type { DispatchConfigPublishPreviewResponse } from "../api/types";

type DispatchConfigPublishModalProps = {
  open: boolean;
  onClose: () => void;
  preview: DispatchConfigPublishPreviewResponse | undefined;
  isPublishing: boolean;
  onConfirm: () => void;
};

export function DispatchConfigPublishModal({
  open,
  onClose,
  preview,
  isPublishing,
  onConfirm,
}: DispatchConfigPublishModalProps) {
  if (!open) return null;

  const canPublish = preview?.canPublish ?? false;
  const warnings = preview?.warnings ?? [];
  const highlights = preview?.highlights ?? [];
  const summary = preview?.publishSummary ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Publish dispatch config</h2>
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mb-4 space-y-3">
          {summary ? <p className="text-sm text-gray-700">{summary}</p> : null}
          {highlights.length > 0 ? (
            <ul className="list-inside list-disc text-sm text-gray-600">
              {highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
          {warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-sm font-medium text-amber-800">Warnings</p>
              <ul className="list-inside list-disc text-sm text-amber-700">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={!canPublish || isPublishing}
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
