import type { AuthorityFaqBlock } from "@/authority/types/authorityPageTypes";
import { AuthoritySection } from "./AuthoritySection";

export function AuthorityFaq({ block, id }: { block: AuthorityFaqBlock | null; id?: string }) {
  if (!block || !block.items.length) return null;

  return (
    <AuthoritySection id={id} title={block.title}>
      <div className="space-y-6">
        {block.items.map((item) => (
          <div key={item.question} className="rounded-2xl border border-[#C9B27C]/25 p-5">
            <h3 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">{item.question}</h3>
            <p className="mt-2 font-[var(--font-manrope)] text-[#475569]">{item.answer}</p>
          </div>
        ))}
      </div>
    </AuthoritySection>
  );
}
