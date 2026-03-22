import type { KnowledgeArticleOutlineSection } from "../../knowledge/knowledgeArticles";

type KnowledgeOutlineProps = {
  sections: KnowledgeArticleOutlineSection[];
};

export function KnowledgeOutline({ sections }: KnowledgeOutlineProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">Article outline</h2>
      <ol className="mt-3 list-inside list-decimal space-y-2 text-gray-700">
        {sections.map((s) => (
          <li key={s.id} id={s.id}>
            {s.heading}
          </li>
        ))}
      </ol>
    </section>
  );
}
