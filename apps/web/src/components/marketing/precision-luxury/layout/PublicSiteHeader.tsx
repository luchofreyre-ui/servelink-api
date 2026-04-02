import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";
import { publicPrimaryNavItems } from "../content/publicNavigationData";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#C9B27C]/20 bg-[#FFF9F3]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 md:px-8">
        <div className="hidden items-center gap-4 lg:gap-6 md:flex">
          <a href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C9B27C]/40 bg-white shadow-sm">
              <div className="h-5 w-5 rounded-full bg-[#0D9488]" />
            </div>

            <div>
              <p className="font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.3em] text-[#C9B27C]">
                Nu Standard Cleaning
              </p>
              <p className="font-[var(--font-poppins)] text-sm font-medium text-[#0F172A]">
                Precision Luxury
              </p>
            </div>
          </a>

          <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-4 lg:gap-6 xl:gap-8">
            {publicPrimaryNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-[var(--font-manrope)] text-sm text-[#475569] transition hover:text-[#0F172A]"
                data-testid={item.href === "/encyclopedia" ? "public-nav-encyclopedia" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <GlobalSearchForm className="min-w-0 w-44 shrink-0 md:w-48 lg:w-52 xl:w-60" />
          <MarketingLinkButton href="/book" variant="primary" className="shrink-0 px-5 py-2.5 text-sm">
            Start Booking
          </MarketingLinkButton>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9B27C]/40 bg-white shadow-sm">
                <div className="h-5 w-5 rounded-full bg-[#0D9488]" />
              </div>

              <div className="min-w-0">
                <p className="font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.3em] text-[#C9B27C]">
                  Nu Standard Cleaning
                </p>
                <p className="font-[var(--font-poppins)] text-sm font-medium text-[#0F172A]">
                  Precision Luxury
                </p>
              </div>
            </a>

            <MarketingLinkButton href="/book" variant="primary" className="shrink-0 px-4 py-2 text-sm">
              Book
            </MarketingLinkButton>
          </div>

          <GlobalSearchForm />

          <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#C9B27C]/15 pt-3">
            {publicPrimaryNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-[var(--font-manrope)] text-sm text-[#475569] transition hover:text-[#0F172A]"
                data-testid={item.href === "/encyclopedia" ? "public-nav-encyclopedia" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#C9B27C]/15 px-6 pb-2 pt-2 md:px-8">
          <p className="text-xs text-zinc-500">Powered by a Cleaning Education Engine</p>
        </div>
      </div>
    </header>
  );
}
