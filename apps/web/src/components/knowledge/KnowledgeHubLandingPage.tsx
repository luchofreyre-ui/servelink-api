import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";
import {
  EditorialMediaFrame,
  EditorialTrustStrip,
  editorialInteractiveTransition,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";

const hubCards = [
  {
    title: "Problems",
    href: "/problems",
    eyebrow: "Start with a symptom",
    description: "Explore common cleaning challenges, causes, and safer resolution paths.",
    weight: "primary",
  },
  {
    title: "Surfaces",
    href: "/surfaces",
    eyebrow: "Start with a material",
    description: "Finish-first guidance for stone, glass, wood, metal, fabrics, and sealed materials.",
    weight: "secondary",
  },
  {
    title: "Products",
    href: "/products",
    eyebrow: "Start with compatibility",
    description: "Educational product references aligned with compatibility—never a substitute for label direction.",
    weight: "secondary",
  },
  {
    title: "Guides",
    href: "/guides",
    eyebrow: "Read the standards",
    description: "Long-form references on chemical safety, stain removal, and protecting finishes.",
    weight: "secondary",
  },
  {
    title: "Methods",
    href: "/methods",
    eyebrow: "Understand technique",
    description: "Understand proven routines, when they apply, and where misuse introduces damage risk.",
    weight: "compact",
  },
  {
    title: "Glossary",
    href: "/encyclopedia/methods",
    eyebrow: "Browse vocabulary",
    description: "Browse published encyclopedia methods—the structured vocabulary behind safer routines.",
    weight: "compact",
  },
];

export function KnowledgeHubLandingPage() {
  const primaryCard = hubCards.find((card) => card.weight === "primary") ?? hubCards[0]!;
  const secondaryCards = hubCards.filter((card) => card.href !== primaryCard.href && card.weight !== "compact");
  const compactCards = hubCards.filter((card) => card.weight === "compact");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <section className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
          <div>
            <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
              ENCYCLOPEDIA
            </p>
            <h1 className="mt-5 font-[var(--font-poppins)] text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.25rem]">
              Your home. Every material. Every challenge. Explained.
            </h1>
            <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
              Search first when you know the issue, or choose a gateway when you need structure around problems, surfaces, products, and methods.
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border border-[#C9B27C]/18 bg-white/85 p-5">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              Search the library
            </p>
            <div className="mt-4" data-testid="encyclopedia-hero-search">
              <GlobalSearchForm
                placeholder="Search methods, surfaces, stains, tools, guides..."
                className="max-w-2xl gap-2 [&_button]:border-[#E8DFD0]/90 [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_input]:px-3 [&_input]:py-3 [&_input]:text-sm"
              />
            </div>
            <p className="mt-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
              Use search for a known term; use the category cards when you are diagnosing from context.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <EditorialMediaFrame
            src="/media/trust/oop-respectful-entry.jpg"
            alt="Nu Standard professional reviewing cleaning details in a calm residential setting."
            aspectClassName="aspect-[16/10]"
            frameClassName="rounded-[30px]"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Start with a problem", "Identify symptoms and likely causes."],
              ["Start with a surface", "Protect the finish before choosing chemistry."],
              ["Start with a product", "Check compatibility and label-first guidance."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[20px] border border-[#E8DFD0]/90 bg-white/82 p-4">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
                  {title}
                </p>
                <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="encyclopedia-categories-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
              Category gateway
            </p>
            <h2 id="encyclopedia-categories-heading" className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
              Choose the path that matches the question.
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <a
            href={primaryCard.href}
            className={`group flex min-h-[360px] flex-col justify-between rounded-[32px] border border-[#C9B27C]/24 bg-white p-7 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] outline-none sm:p-8 ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
          >
            <div>
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                {primaryCard.eyebrow}
              </p>
              <h3 className="mt-5 font-[var(--font-poppins)] text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#0F172A]">
                {primaryCard.title}
              </h3>
              <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                {primaryCard.description}
              </p>
            </div>
            <span className="mt-10 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:gap-2">
              Explore problems <span aria-hidden>→</span>
            </span>
          </a>

          <div className="grid gap-5">
            {secondaryCards.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className={`group rounded-[26px] border border-[#E8DFD0]/95 bg-white/90 p-6 outline-none ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/35 hover:shadow-[0_22px_50px_-34px_rgba(15,23,42,0.38)] focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
              >
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
                  {card.title}
                </h3>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                  {card.description}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {compactCards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className={`group rounded-[20px] border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-5 outline-none ${editorialInteractiveTransition} hover:border-[#C9B27C]/35 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45`}
            >
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                {card.eyebrow}
              </p>
              <h3 className="mt-2 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">{card.title}</h3>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">{card.description}</p>
            </a>
          ))}
        </div>
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

      <section className="mt-12 rounded-[24px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
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
