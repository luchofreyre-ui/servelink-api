function firstSentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const cut = t.match(/^(.+?[.!?])(\s|$)/);
  return cut ? cut[1]!.trim() : t.split("\n")[0]!.trim();
}

export function AuthorityHero({
  eyebrow,
  title,
  description,
  subline,
  variant = "default",
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional second paragraph under the hero lead (diagnostic framing). */
  subline?: string;
  /** Compact problem hub: max two text lines under H1, no divider. */
  variant?: "default" | "problemCompact";
}) {
  if (variant === "problemCompact") {
    const support = firstSentence(description);
    return (
      <header className="mb-6 max-w-4xl space-y-3">
        <p className="font-[var(--font-manrope)] text-sm font-semibold uppercase tracking-[0.12em] text-[#64748B]">
          {eyebrow}
        </p>
        <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A] md:text-5xl">
          {title}
        </h1>
        {subline ? (
          <p className="font-[var(--font-manrope)] text-lg leading-[1.25] text-[#334155] md:text-xl">
            {subline}
          </p>
        ) : null}
        {support ? (
          <p className="max-w-3xl font-[var(--font-manrope)] text-base leading-[1.35] text-[#475569] md:text-lg">
            {support}
          </p>
        ) : null}
      </header>
    );
  }

  return (
    <header className="mb-10 border-b border-[#C9B27C]/20 pb-6">
      <p className="mb-2 font-[var(--font-manrope)] text-sm font-semibold uppercase tracking-[0.12em] text-[#64748B]">
        {eyebrow}
      </p>
      <h1 className="mb-3 font-[var(--font-poppins)] text-3xl font-semibold tracking-tight text-[#0F172A]">
        {title}
      </h1>
      <p className="max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{description}</p>
      {subline ? (
        <p className="mt-4 max-w-3xl font-[var(--font-manrope)] text-base leading-7 text-[#64748B]">
          {subline}
        </p>
      ) : null}
    </header>
  );
}
