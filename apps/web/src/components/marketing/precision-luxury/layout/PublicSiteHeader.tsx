import { publicPrimaryNavItems } from "../content/publicNavigationData";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#C9B27C]/20 bg-[#FFF9F3]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="/" className="flex items-center gap-3">
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

        <nav className="hidden items-center gap-8 md:flex">
          {publicPrimaryNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-[var(--font-manrope)] text-sm text-[#475569] transition hover:text-[#0F172A]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <MarketingLinkButton href="/book" variant="primary" className="px-5 py-2.5 text-sm">
            Start Booking
          </MarketingLinkButton>
        </div>
      </div>
    </header>
  );
}
