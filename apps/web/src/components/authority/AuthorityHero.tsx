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
      <header className="mb-8 rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.32)] md:p-8">
        <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] md:text-5xl">
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
    <header className="mb-10 rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.32)] md:p-8">
      <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
        {eyebrow}
      </p>
      <h1 className="mb-3 mt-4 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] md:text-5xl">
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
