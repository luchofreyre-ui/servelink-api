"use client";

import type { ReviewablePage } from "@/lib/encyclopedia/renderTypes";

type LegacyReviewListItem = {
  slug: string;
  title: string;
  status: string;
  pages: { title: string }[];
};

type Props = {
  readOnly: boolean;
  pages: ReviewablePage[];
};

function toLegacyItems(pages: ReviewablePage[]): LegacyReviewListItem[] {
  return pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    status: p.reviewStatus,
    pages: [{ title: p.title }],
  }));
}

/** Legacy file-backed review corpus (reference only). */
export default function EncyclopediaReviewPanel({ readOnly, pages }: Props) {
  if (!readOnly) {
    return null;
  }

  const items = toLegacyItems(pages);
  const firstCorpusPage = pages[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Legacy pipeline review is now read-only. The API review store is the
        operational source for approve, reject, promote, retry, and live
        publication.
      </div>

      {firstCorpusPage && pages.length > 1 ? (
        <p className="text-xs text-neutral-500">
          Corpus preview (first page in store order):{" "}
          <span className="font-medium text-neutral-800">
            {firstCorpusPage.title}
          </span>
          . Additional rows are listed below.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.slug} className="rounded-xl border p-4">
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="mt-1 text-xs text-neutral-500">{item.slug}</div>
            <div className="mt-2 text-xs text-neutral-600">
              Status: {item.status ?? "unknown"}
            </div>

            {Array.isArray(item.pages) && item.pages.length > 0 ? (
              <div className="mt-3 rounded-lg border bg-neutral-50 p-3 text-sm text-neutral-700">
                <div className="font-medium">
                  Previewing first page of {item.pages.length}
                </div>
                <div className="mt-2">
                  {item.pages[0]?.title ?? "Untitled page"}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-neutral-500">
                No pages available.
              </div>
            )}

            {Array.isArray(item.pages) && item.pages.length > 1 ? (
              <div className="mt-2 text-xs text-neutral-500">
                Additional pages exist in the legacy corpus. Only the first page
                preview is shown here.
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-neutral-500">
          No rows in the legacy review corpus.
        </div>
      ) : null}
    </div>
  );
}
