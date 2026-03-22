type KnowledgeHeroProps = {
  title: string;
  subtitle: string;
};

export function KnowledgeHero({ title, subtitle }: KnowledgeHeroProps) {
  return (
    <section className="py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
    </section>
  );
}
