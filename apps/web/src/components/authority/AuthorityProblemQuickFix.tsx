import type { AuthorityProblemExecutionQuickFix } from "@/authority/types/authorityPageTypes";

export function AuthorityProblemQuickFix(props: AuthorityProblemExecutionQuickFix) {
  const { use: useLine, do: doLine, ifNeeded } = props;
  return (
    <aside
      id="problem-quick-answer"
      className="w-full max-w-[520px] rounded-2xl border border-stone-200/80 bg-stone-50/90 p-4 md:p-5 lg:max-w-none"
      aria-label="Quick fix"
      data-testid="problem-quick-fix"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">Quick fix</p>
      <dl className="mt-3 space-y-2.5 font-[var(--font-manrope)] text-[0.98rem] leading-snug text-[#334155] md:text-[1.02rem]">
        <div>
          <dt className="font-semibold text-[#0F172A]">Use</dt>
          <dd className="mt-0.5">{useLine}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0F172A]">Do</dt>
          <dd className="mt-0.5">{doLine}</dd>
        </div>
        {ifNeeded ?
          <div className="border-t border-stone-200/80 pt-2.5">
            <dt className="font-semibold text-[#0F172A]">If needed</dt>
            <dd className="mt-0.5">{ifNeeded}</dd>
          </div>
        : null}
      </dl>
    </aside>
  );
}
