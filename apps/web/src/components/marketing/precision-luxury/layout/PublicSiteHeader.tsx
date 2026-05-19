import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";

import { editorialInteractiveTransition } from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";

type PublicSiteHeaderProps = {
  searchPlaceholder?: string;
};

type PublicNavItem = {
  href: string;
  label: string;
  testId?: string;
};

const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/problems", label: "Problems" },
  { href: "/surfaces", label: "Surfaces" },
  { href: "/products", label: "Products" },
  { href: "/guides", label: "Guides" },
  { href: "/encyclopedia", label: "Encyclopedia", testId: "public-nav-encyclopedia" },
] as const;

export function PublicSiteHeader({
  searchPlaceholder = "Search surfaces, methods, guides…",
}: PublicSiteHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        {/* LEFT — BRAND */}
        <a
          href="/"
          aria-label="Nu Standard home"
          className={`shrink-0 font-[var(--font-poppins)] text-sm font-semibold tracking-tight text-[#0F172A] hover:text-[#0F172A] ${editorialInteractiveTransition}`}
        >
          Nu Standard
        </a>

        {/* CENTER — NAV */}
        <nav className="hidden items-center gap-3 font-[var(--font-manrope)] text-[13px] text-[#64748B] md:flex xl:gap-5">
          {publicNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* RIGHT — SEARCH + CTA */}
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="hidden w-48 shrink-0 lg:block">
            <GlobalSearchForm
              placeholder={searchPlaceholder}
              className="w-full gap-2 [&_button]:border-[#E8DFD0]/90 [&_button]:bg-white/80 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-[11px] [&_button]:text-[#0F172A] [&_input]:rounded-xl [&_input]:border-[#E8DFD0]/90 [&_input]:bg-white/80 [&_input]:px-3 [&_input]:py-1.5 [&_input]:text-[11px]"
            />
          </div>
          <a
            href="/book"
            className={`inline-flex shrink-0 rounded-full bg-[#0F172A] px-3.5 py-2 font-[var(--font-manrope)] text-[11px] font-semibold text-white shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)] md:px-4 ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:bg-[#162131] active:translate-y-px`}
          >
            Book Now
          </a>
        </div>
      </div>

      <nav
        aria-label="Knowledge shortcuts"
        className="flex gap-x-3 gap-y-1 overflow-x-auto border-t border-[#F0E7DC]/80 px-4 py-1.5 font-[var(--font-manrope)] text-[11px] text-[#64748B] md:hidden"
      >
        {publicNavItems.map((item, index) => (
          <span key={item.href} className="inline-flex items-center gap-3">
            {index > 0 ? (
              <span aria-hidden className="text-[#E2E8F0]">
                ·
              </span>
            ) : null}
            <a
              href={item.href}
              data-testid={item.testId ? `${item.testId}-mobile` : undefined}
              className="whitespace-nowrap hover:text-[#0F172A]"
            >
              {item.label}
            </a>
          </span>
        ))}
      </nav>
    </header>
  );
}
