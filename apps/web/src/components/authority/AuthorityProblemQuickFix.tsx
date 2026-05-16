import type { AuthorityProblemExecutionQuickFix } from "@/authority/types/authorityPageTypes";

export function AuthorityProblemQuickFix(props: AuthorityProblemExecutionQuickFix) {
  const { use: useLine, do: doLine, ifNeeded } = props;
  return (
    <aside id="problem-quick-answer" aria-label="Quick fix" data-testid="problem-quick-fix">
      <div className="rounded-[28px] border border-[#E8DFD0]/95 bg-white/88 p-6 shadow-[0_18px_54px_-42px_rgba(15,23,42,0.28)] md:p-8">
        <div className="mb-4 font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
          Quick fix
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFF9F3] p-4">
            <div className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">Use</div>
            <div className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">{useLine}</div>
          </div>

          <div className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFF9F3] p-4">
            <div className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">Do</div>
            <div className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">{doLine}</div>
          </div>

          {ifNeeded ?
            <div className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFF9F3] p-4">
              <div className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">If needed</div>
              <div className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">{ifNeeded}</div>
            </div>
          : null}
        </div>
      </div>
    </aside>
  );
}
