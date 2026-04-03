import Link from "next/link";

type QuickAnswerProps = {
  text: string;
  /** Problem hub: card anchor + optional jump to method block. */
  variant?: "default" | "problemAnchor";
  methodsHref?: string;
  methodsLabel?: string;
};

export function AuthorityQuickAnswer({
  text,
  variant = "default",
  methodsHref = "#problem-methods",
  methodsLabel = "Jump to method",
}: QuickAnswerProps) {
  const body = text.trim();
  if (!body) return null;

  if (variant === "problemAnchor") {
    const para = firstParagraph(body);
    return (
      <aside
        id="problem-quick-answer"
        className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 md:p-6"
        aria-label="Quick answer"
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">Quick answer</p>
          <p className="font-[var(--font-manrope)] text-[1.05rem] leading-[1.35] text-[#0F172A] md:text-[1.15rem]">
            {para}
          </p>
          {methodsHref ? (
            <div className="mt-2 flex justify-end">
              <Link
                href={methodsHref}
                className="text-sm font-medium text-[#0D9488] underline-offset-2 transition hover:underline"
              >
                {methodsLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="mb-6 border-l border-zinc-200 pl-3 text-sm text-zinc-600"
      aria-label="Quick answer"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick answer</p>
      <p className="mt-1 font-[var(--font-manrope)] text-sm leading-[1.4] md:text-base">{body}</p>
    </aside>
  );
}

function firstParagraph(text: string): string {
  const t = text.trim();
  const parts = t.split(/\n\n+/);
  return (parts[0] ?? t).trim();
}
