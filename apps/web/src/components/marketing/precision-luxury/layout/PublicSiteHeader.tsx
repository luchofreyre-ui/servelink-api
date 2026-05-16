import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";

import { editorialInteractiveTransition } from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        {/* LEFT — BRAND */}
        <div className="shrink-0 font-[var(--font-poppins)] text-sm font-semibold tracking-tight text-[#0F172A]">
          Nu Standard
        </div>

        {/* CENTER — NAV */}
        <nav className="hidden items-center gap-5 font-[var(--font-manrope)] text-[13px] text-[#64748B] md:flex">
          <a href="/problems" className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}>
            Problems
          </a>
          <a href="/surfaces" className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}>
            Surfaces
          </a>
          <a href="/products" className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}>
            Products
          </a>
          <a href="/guides" className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}>
            Guides
          </a>
          <a
            href="/encyclopedia"
            data-testid="public-nav-encyclopedia"
            className={`hover:text-[#0F172A] ${editorialInteractiveTransition}`}
          >
            Encyclopedia
          </a>
        </nav>

        {/* RIGHT — SEARCH + CTA */}
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="hidden w-48 shrink-0 lg:block">
            <GlobalSearchForm
              placeholder="Search surfaces, methods, guides…"
              className="w-full gap-2 [&_button]:border-[#E8DFD0]/90 [&_button]:bg-white/80 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-[11px] [&_button]:text-[#0F172A] [&_input]:rounded-xl [&_input]:border-[#E8DFD0]/90 [&_input]:bg-white/80 [&_input]:px-3 [&_input]:py-1.5 [&_input]:text-[11px]"
            />
          </div>
          <a
            href="/products"
            className={`hidden shrink-0 rounded-full border border-[#E8DFD0]/95 bg-white/70 px-3 py-1.5 font-[var(--font-manrope)] text-[11px] font-semibold text-[#0F172A] xl:inline-flex ${editorialInteractiveTransition} hover:border-[#C9B27C]/45 hover:bg-white active:translate-y-px`}
          >
            View Products
          </a>
        </div>
      </div>

      <nav
        aria-label="Knowledge shortcuts"
        className="flex gap-x-3 gap-y-1 overflow-x-auto border-t border-[#F0E7DC]/80 px-4 py-1.5 font-[var(--font-manrope)] text-[11px] text-[#64748B] md:hidden"
      >
        <a href="/problems" className="whitespace-nowrap hover:text-[#0F172A]">
          Problems
        </a>
        <span aria-hidden className="text-[#E2E8F0]">
          ·
        </span>
        <a href="/surfaces" className="whitespace-nowrap hover:text-[#0F172A]">
          Surfaces
        </a>
        <span aria-hidden className="text-[#E2E8F0]">
          ·
        </span>
        <a href="/products" className="whitespace-nowrap hover:text-[#0F172A]">
          Products
        </a>
        <span aria-hidden className="text-[#E2E8F0]">
          ·
        </span>
        <a href="/guides" className="whitespace-nowrap hover:text-[#0F172A]">
          Guides
        </a>
        <span aria-hidden className="text-[#E2E8F0]">
          ·
        </span>
        <a href="/encyclopedia" data-testid="public-nav-encyclopedia-mobile" className="whitespace-nowrap hover:text-[#0F172A]">
          Encyclopedia
        </a>
      </nav>
    </header>
  );
}
