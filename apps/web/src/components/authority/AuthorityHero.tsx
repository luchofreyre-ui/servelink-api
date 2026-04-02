export function AuthorityHero({
  eyebrow,
  title,
  description,
  subline,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional second paragraph under the hero lead (diagnostic framing). */
  subline?: string;
}) {
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
