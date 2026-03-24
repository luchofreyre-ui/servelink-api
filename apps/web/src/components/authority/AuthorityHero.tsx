export function AuthorityHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-10 border-b border-[#C9B27C]/20 pb-6">
      <p className="mb-2 font-[var(--font-manrope)] text-sm font-semibold uppercase tracking-[0.12em] text-[#64748B]">
        {eyebrow}
      </p>
      <h1 className="mb-3 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
        {title}
      </h1>
      <p className="max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{description}</p>
    </header>
  );
}
