"use client";

/** Problem pages: at most two thumbnails (topPick + secondaryPick); keep UI compact and non-dominant. */

export type InlineAssistProduct = {
  slug: string;
  name: string;
  image: string;
  amazonUrl?: string | null;
};

type InlineProductAssistProps = {
  title?: string;
  description?: string;
  topPick?: InlineAssistProduct | null;
  secondaryPick?: InlineAssistProduct | null;
  buyHref?: string | null;
  compareLabel?: string;
  buyLabel?: string;
  onBuyClick?: () => void;
  onCompareClick?: () => void;
  onThumbnailClick?: (slug: string) => void;
};

export function InlineProductAssist({
  title = "Most people don't need anything aggressive here.",
  description = "Start with a balanced cleaner and adjust if needed.",
  topPick,
  secondaryPick,
  buyHref,
  compareLabel = "Compare options",
  buyLabel = "Buy top pick",
  onBuyClick,
  onCompareClick,
  onThumbnailClick,
}: InlineProductAssistProps) {
  return (
    <div className="mt-3 rounded-lg border border-zinc-200/80 bg-white/50 px-3 py-2.5 sm:px-4">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-xl">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-zinc-600 sm:text-sm">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            {topPick ? (
              <a
                href={`/products/${topPick.slug}`}
                onClick={() => onThumbnailClick?.(topPick.slug)}
                className="block h-10 w-10 overflow-hidden rounded border border-zinc-200 bg-white transition hover:opacity-90"
              >
                <img
                  src={topPick.image}
                  alt={topPick.name}
                  className="h-full w-full object-contain"
                />
              </a>
            ) : null}

            {secondaryPick ? (
              <a
                href={`/products/${secondaryPick.slug}`}
                onClick={() => onThumbnailClick?.(secondaryPick.slug)}
                className="block h-10 w-10 overflow-hidden rounded border border-zinc-200 bg-white transition hover:opacity-90"
              >
                <img
                  src={secondaryPick.image}
                  alt={secondaryPick.name}
                  className="h-full w-full object-contain"
                />
              </a>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-0.5">
            {buyHref ? (
              <a
                href={buyHref}
                onClick={onBuyClick}
                target="_blank"
                rel="noreferrer sponsored"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 sm:text-sm"
              >
                {buyLabel}
              </a>
            ) : null}

            <button
              type="button"
              onClick={onCompareClick}
              className="text-xs text-zinc-600 underline underline-offset-2 transition hover:text-zinc-900 sm:text-sm"
            >
              {compareLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
