import type { AuthorityProblemExecutionQuickFix } from "@/authority/types/authorityPageTypes";

export function AuthorityProblemQuickFix(props: AuthorityProblemExecutionQuickFix) {
  const { use: useLine, do: doLine, ifNeeded } = props;
  return (
    <aside id="problem-quick-answer" aria-label="Quick fix" data-testid="problem-quick-fix">
      <div className="rounded-xl border p-6">
        <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Quick fix</div>

        <div className="space-y-4">
          <div>
            <div className="font-semibold">Use</div>
            <div>{useLine}</div>
          </div>

          <div>
            <div className="font-semibold">Do</div>
            <div>{doLine}</div>
          </div>

          {ifNeeded ?
            <div>
              <div className="font-semibold">If needed</div>
              <div>{ifNeeded}</div>
            </div>
          : null}
        </div>
      </div>
    </aside>
  );
}
