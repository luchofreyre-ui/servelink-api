"use client";

type InlineProductAssistProps = {
  viewHref: string;
  buyHref?: string | null;
  viewLabel?: string;
  buyLabel?: string;
  title?: string;
  description?: string;
  onViewClick?: () => void;
  onBuyClick?: () => void;
};

export function InlineProductAssist({
  viewHref,
  buyHref,
  viewLabel = "View recommended products",
  buyLabel = "Buy top pick",
  title = "Most people don't need anything aggressive here.",
  description = "Start with a balanced cleaner and adjust if needed.",
  onViewClick,
  onBuyClick,
}: InlineProductAssistProps) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <a
            href={viewHref}
            onClick={onViewClick}
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            {viewLabel}
          </a>

          {buyHref ? (
            <a
              href={buyHref}
              onClick={onBuyClick}
              target="_blank"
              rel="noreferrer sponsored"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {buyLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
