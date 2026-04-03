export function AuthorityQuickAnswer(props: { text: string }) {
  const { text } = props;
  if (!text.trim()) return null;
  return (
    <aside
      className="mb-6 border-l border-zinc-200 pl-3 text-sm text-zinc-600"
      aria-label="Quick answer"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick answer</p>
      <p className="mt-1 font-[var(--font-manrope)] text-sm leading-relaxed md:text-base">{text}</p>
    </aside>
  );
}
