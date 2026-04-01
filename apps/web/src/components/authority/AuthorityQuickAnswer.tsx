export function AuthorityQuickAnswer(props: { text: string }) {
  const { text } = props;
  if (!text.trim()) return null;
  return (
    <aside
      className="mb-8 rounded-xl border border-[#0D9488]/25 bg-[#F0FDFA]/80 px-4 py-3 text-[#0F172A] shadow-sm"
      aria-label="Quick answer"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">Quick answer</p>
      <p className="mt-1 font-[var(--font-manrope)] text-sm leading-7 text-[#334155]">{text}</p>
    </aside>
  );
}
