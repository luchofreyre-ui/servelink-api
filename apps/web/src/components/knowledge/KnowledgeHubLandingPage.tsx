import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";
import {
  EditorialHero,
  EditorialMediaFrame,
  EditorialTrustStrip,
  EditorialCard,
  EditorialCardGrid,
  editorialInteractiveTransition,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";

const hubCards = [
  {
    title: "Problems",
    href: "/problems",
    description: "Explore common cleaning challenges, causes, and safer resolution paths.",
  },
  {
    title: "Surfaces",
    href: "/surfaces",
    description: "Finish-first guidance for stone, glass, wood, metal, fabrics, and sealed materials.",
  },
  {
    title: "Products",
    href: "/products",
    description: "Educational product references aligned with compatibility—never a substitute for label direction.",
  },
  {
    title: "Guides",
    href: "/guides",
    description: "Long-form references on chemical safety, stain removal, and protecting finishes.",
  },
  {
    title: "Methods",
    href: "/methods",
    description: "Understand proven routines, when they apply, and where misuse introduces damage risk.",
  },
  {
    title: "Glossary",
    href: "/encyclopedia/methods",
    description: "Browse published encyclopedia methods—the structured vocabulary behind safer routines.",
  },
];

export function KnowledgeHubLandingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-8 md:py-14">
      <EditorialHero
        eyebrow="ENCYCLOPEDIA"
        title="Your home. Every material. Every challenge. Explained."
        body="Browse by category to find expert knowledge on problems, surfaces, products, methods, and more."
        aside={
          <EditorialMediaFrame
            src="/media/trust/oop-respectful-entry.jpg"
            alt="Nu Standard professional reviewing cleaning details in a calm residential setting."
          />
        }
      />

      <div className="mt-10 rounded-[20px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.35)] sm:p-6">
        <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
          Search the library
        </p>
        <div className="mt-4" data-testid="encyclopedia-hero-search">
          <GlobalSearchForm
            placeholder="Search methods, surfaces, stains, tools, guides..."
            className="max-w-2xl gap-2 [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_input]:px-3 [&_input]:py-2 [&_input]:text-xs"
          />
        </div>
      </div>

      <section className="mt-12" aria-labelledby="encyclopedia-categories-heading">
        <h2 id="encyclopedia-categories-heading" className="sr-only">
          Encyclopedia categories
        </h2>
        <EditorialCardGrid className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {hubCards.map((card) => (
            <EditorialCard
              key={card.href}
              href={card.href}
              eyebrow="Library"
              title={card.title}
              summary={card.description}
              ctaLabel="Explore"
              clickable
            />
          ))}
        </EditorialCardGrid>
      </section>

      <div className="mt-14">
        <EditorialTrustStrip
          items={[
            { title: "Professional Standards", body: "Grounded in careful methodology—not hype." },
            { title: "Practical Guidance", body: "Written so you can apply judgment room-by-room." },
            { title: "Updated References", body: "Maintained as the encyclopedia pipeline evolves." },
            { title: "Clear Explanations", body: "Prioritizes why steps matter, not just what to spray." },
          ]}
        />
      </div>

      <section className="mt-12 rounded-[18px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
        <p>
          <span className="font-semibold text-[#0F172A]">How to use this encyclopedia:</span> start with search when you
          already know the stain or surface, browse categories when you want structure, and cross-check methods against
          your manufacturer guidance before escalating chemistry.
        </p>
        <a
          href="/encyclopedia/clusters"
          className={`mt-4 inline-flex items-center gap-1 font-semibold text-[#0D9488] underline-offset-4 hover:underline ${editorialInteractiveTransition}`}
        >
          Browse topic clusters →
        </a>
      </section>
    </div>
  );
}
