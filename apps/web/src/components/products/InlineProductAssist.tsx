"use client";

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
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-2xl">
          <p className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-4 lg:gap-3">
          <div className="flex items-center gap-2">
            {topPick ? (
              <a
                href={`/products/${topPick.slug}`}
                onClick={() => onThumbnailClick?.(topPick.slug)}
                className="block h-12 w-12 overflow-hidden rounded-md border border-zinc-200 bg-white transition hover:opacity-90"
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
                className="block h-12 w-12 overflow-hidden rounded-md border border-zinc-200 bg-white transition hover:opacity-90"
              >
                <img
                  src={secondaryPick.image}
                  alt={secondaryPick.name}
                  className="h-full w-full object-contain"
                />
              </a>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-1">
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

            <button
              type="button"
              onClick={onCompareClick}
              className="text-sm text-zinc-600 underline underline-offset-2 transition hover:text-zinc-900"
            >
              {compareLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
